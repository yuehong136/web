import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialTokenizerValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { SearchMethodOptions } from './constants'

const schema = z.object({
  search_method: z.array(z.string()).optional(),
  filename_embd_weight: z.coerce.number().optional(),
  fields: z.string().optional(),
})

export function TokenizerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialTokenizerValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const selectedMethods = useWatch({
    control: form.control,
    name: 'search_method',
  }) ?? []

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="search_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.searchMethod', 'Search Method')}</FormLabel>
              <div className="space-y-2">
                {SearchMethodOptions.map((method) => {
                  const checked = selectedMethods.includes(method)
                  return (
                    <label key={method} className="flex items-center gap-space-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          const next = checked
                            ? selectedMethods.filter((m: string) => m !== method)
                            : [...selectedMethods, method]
                          field.onChange(next)
                        }}
                      />
                      <span className="text-sm">{method}</span>
                    </label>
                  )
                })}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filename_embd_weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.filenameWeight', 'Filename Weight')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  {...field}
                  value={field.value ?? 0.1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fields"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.fields', 'Fields')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="text" />
              </FormControl>
            </FormItem>
          )}
        />
      </FormWrapper>
    </Form>
  )
}
