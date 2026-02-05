import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialSplitterValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  chunk_token_size: z.coerce.number().optional(),
  overlapped_percent: z.coerce.number().optional(),
  delimiters: z.array(z.string()).optional(),
  image_table_context_window: z.coerce.number().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function SplitterForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialSplitterValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const { fields, append, remove } = useFieldArray({
    name: 'delimiters',
    control: form.control,
  })

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="chunk_token_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.chunkTokenSize', 'Chunk Token Size')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? 512}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
              <FormLabel>{t('flow.overlappedPercent', 'Overlapped Percent')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>{t('flow.delimiters', 'Delimiters')}</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => append('')}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-space-sm">
                <FormField
                  control={form.control}
                  name={`delimiters.${index}`}
                  render={({ field: inputField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...inputField} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="image_table_context_window"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.imageTableContextWindow', 'Image/Table Context Window')}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
