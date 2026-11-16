import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { type Control, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  TokenChunkerDelimiterMode,
  initialTokenChunkerValues,
} from '../chunker-constants'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, buildOutputList } from '../components'
import { SegmentedChoice } from '@/pages/agent/form/components/segmented-choice'
import { normalizeTokenChunkerFormForStore } from './utils'

const tokenChunkerSchema = z.object({
  delimiter_mode: z
    .enum([
      TokenChunkerDelimiterMode.TokenSize,
      TokenChunkerDelimiterMode.Delimiter,
      TokenChunkerDelimiterMode.One,
    ])
    .optional(),
  chunk_token_size: z.number().optional(),
  overlapped_percent: z.number().optional(),
  delimiters: z.array(z.object({ value: z.string().optional() })).optional(),
  enable_children: z.boolean().optional(),
  children_delimiters: z
    .array(z.object({ value: z.string().optional() }))
    .optional(),
  image_table_context_window: z.number().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export type TokenChunkerFormValues = z.input<typeof tokenChunkerSchema>

type DelimiterListProps = {
  name: 'delimiters' | 'children_delimiters'
  label: string
  control: Control<TokenChunkerFormValues>
}

function DelimiterList({ name, label, control }: DelimiterListProps) {
  const fieldArray = useFieldArray({
    control,
    name,
  })

  return (
    <section className="space-y-space-sm">
      <div className="flex items-center justify-between">
        <FormLabel>{label}</FormLabel>
        <Button
          type="button"
          variant="ghost"
          onClick={() => fieldArray.append({ value: '\n' })}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="space-y-space-sm">
        {fieldArray.fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-space-sm">
            <FormField
              control={control}
              name={`${name}.${index}.value`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder={'\\n / --- / ###'}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => fieldArray.remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}

export function TokenChunkerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = normalizeTokenChunkerFormForStore(
    useFormValues(initialTokenChunkerValues, node),
  )

  const form = useForm<
    TokenChunkerFormValues,
    unknown,
    z.output<typeof tokenChunkerSchema>
  >({
    resolver: zodResolver(tokenChunkerSchema),
    defaultValues: values as TokenChunkerFormValues,
  })

  useWatchFormChange(node?.id, form)

  const delimiterMode = useWatch({
    control: form.control,
    name: 'delimiter_mode',
  })
  const enableChildren = useWatch({
    control: form.control,
    name: 'enable_children',
  })
  const outputs = useMemo(
    () => buildOutputList(form.getValues('outputs')),
    [form],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="delimiter_mode"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SegmentedChoice
                  value={field.value ?? TokenChunkerDelimiterMode.TokenSize}
                  onValueChange={field.onChange}
                  options={[
                    {
                      value: TokenChunkerDelimiterMode.TokenSize,
                      label: t('flow.tokenSize', 'Token Size'),
                    },
                    {
                      value: TokenChunkerDelimiterMode.Delimiter,
                      label: t('flow.delimiters', 'Delimiters'),
                    },
                    {
                      value: TokenChunkerDelimiterMode.One,
                      label: t('flow.one', 'One'),
                    },
                  ]}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {delimiterMode === TokenChunkerDelimiterMode.TokenSize && (
          <>
            <FormField
              control={form.control}
              name="chunk_token_size"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {t('flow.chunkTokenSize', 'Chunk Token Size')}
                    </FormLabel>
                    <span className="text-xs text-text-secondary">
                      {field.value ?? 512}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={64}
                      max={2048}
                      step={16}
                      value={[field.value ?? 512]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="overlapped_percent"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {t('flow.overlappedPercent', 'Overlapped Percent')}
                    </FormLabel>
                    <span className="text-xs text-text-secondary">
                      {field.value ?? 0}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={30}
                      step={1}
                      value={[field.value ?? 0]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_table_context_window"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {t(
                        'flow.imageTableContextWindow',
                        'Image & Table Context Window',
                      )}
                    </FormLabel>
                    <span className="text-xs text-text-secondary">
                      {field.value ?? 0}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={256}
                      step={1}
                      value={[field.value ?? 0]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {delimiterMode === TokenChunkerDelimiterMode.Delimiter && (
          <DelimiterList
            name="delimiters"
            label={t('flow.delimiters', 'Delimiters')}
            control={form.control}
          />
        )}

        {delimiterMode === TokenChunkerDelimiterMode.One && (
          <div className="flex items-start gap-space-sm rounded-radius-md border border-border-default bg-surface-secondary px-space-md py-space-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-text-secondary" />
            <div className="space-y-space-2xs">
              <div className="text-sm font-medium text-text-primary">
                {t('flow.oneChunkTitle', 'One chunk')}
              </div>
              <p className="text-sm text-text-secondary">
                {t(
                  'flow.oneChunkDescription',
                  'Keep the upstream document content as one chunk.',
                )}
              </p>
            </div>
          </div>
        )}

        {delimiterMode !== TokenChunkerDelimiterMode.One && (
          <fieldset className="space-y-space-sm">
            <FormField
              control={form.control}
              name="enable_children"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-radius-md border border-border-default px-space-sm py-space-sm">
                  <FormLabel>
                    {t(
                      'flow.enableChildrenDelimiters',
                      'Enable Children Delimiters',
                    )}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {enableChildren && (
              <DelimiterList
                name="children_delimiters"
                label={t('flow.childrenDelimiters', 'Children Delimiters')}
                control={form.control}
              />
            )}
          </fieldset>
        )}

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
