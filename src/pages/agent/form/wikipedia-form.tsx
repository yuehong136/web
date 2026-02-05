import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialWikipediaValues } from '../constant'
import { LanguageOptions } from '../options'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from './components'

const schema = z.object({
  query: z.string().optional(),
  top_n: z.coerce.number().optional(),
  language: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function WikipediaForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialWikipediaValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

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
                  value={field.value ?? 10}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.language', 'Language')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value}
                  onChange={field.onChange}
                  options={LanguageOptions}
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
