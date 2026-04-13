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
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialSplitterValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, buildOutputList } from '../components'
import { normalizeSplitterFormForStore } from './utils'

const splitterSchema = z.object({
  chunk_token_size: z.number().optional(),
  overlapped_percent: z.number().optional(),
  delimiters: z.array(z.object({ value: z.string().optional() })).optional(),
  enable_children: z.boolean().optional(),
  children_delimiters: z
    .array(z.object({ value: z.string().optional() }))
    .optional(),
  table_context_size: z.number().optional(),
  image_context_size: z.number().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

type SplitterFormValues = z.input<typeof splitterSchema>

type DelimiterListProps = {
  name: 'delimiters' | 'children_delimiters'
  label: string
  control: Control<SplitterFormValues>
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

export function SplitterForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = normalizeSplitterFormForStore(
    useFormValues(initialSplitterValues, node),
  )

  const form = useForm<
    SplitterFormValues,
    unknown,
    z.output<typeof splitterSchema>
  >({
    resolver: zodResolver(splitterSchema),
    defaultValues: values as SplitterFormValues,
  })

  useWatchFormChange(node?.id, form)

  const enableChildren = useWatch({
    control: form.control,
    name: 'enable_children',
  })

  const outputs = useMemo(() => buildOutputList(form.getValues('outputs')), [form])

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="chunk_token_size"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t('flow.chunkTokenSize', 'Chunk Token Size')}</FormLabel>
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
                <FormLabel>{t('flow.overlappedPercent', 'Overlapped Percent')}</FormLabel>
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

        <DelimiterList
          name="delimiters"
          label={t('flow.delimiters', 'Delimiters')}
          control={form.control}
        />

        <div className="grid gap-space-md md:grid-cols-2">
          <FormField
            control={form.control}
            name="table_context_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.tableContextSize', 'Table Context Size')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value ?? 0}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image_context_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.imageContextSize', 'Image Context Size')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value ?? 0}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="enable_children"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-radius-md border border-border-default px-space-sm py-space-sm">
              <FormLabel>
                {t('flow.enableChildrenDelimiters', 'Enable Children Delimiters')}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
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

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
