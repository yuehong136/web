import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialGoogleScholarValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from './components'

const schema = z.object({
  query: z.string().optional(),
  top_n: z.coerce.number().optional(),
  sort_by: z.string().optional(),
  year_low: z.coerce.number().optional(),
  year_high: z.coerce.number().optional(),
  patents: z.boolean().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function GoogleScholarForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialGoogleScholarValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  const sortOptions = useMemo(
    () => ['relevance', 'date'],
    [],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable />

        <FormField
          control={form.control}
          name="top_n"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.topN', 'Top N Results')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? 12}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.sortBy', 'Sort By')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`flow.${value}`, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year_low"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.yearLow', 'Year Low')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="year_high"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.yearHigh', 'Year High')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="patents"
          render={({ field }) => (
            <FormItem className="flex items-center gap-space-sm">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(val) => field.onChange(Boolean(val))}
                />
              </FormControl>
              <FormLabel>{t('flow.patents', 'Patents')}</FormLabel>
            </FormItem>
          )}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
