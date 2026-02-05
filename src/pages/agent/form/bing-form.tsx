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
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialBingValues } from '../constant'
import { BingCountryOptions, BingLanguageOptions } from '../options'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, QueryVariable } from './components'

const schema = z.object({
  query: z.string().optional(),
  top_n: z.coerce.number().optional(),
  channel: z.string().optional(),
  api_key: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
})

export function BingForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialBingValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const channelOptions = useMemo(
    () => ['Webpages', 'News'].map((value) => ({ label: value, value })),
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
                  value={field.value ?? 10}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.channel', 'Channel')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value}
                  onChange={field.onChange}
                  options={channelOptions}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.apiKey', 'API Key')}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.country', 'Country')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value}
                  onChange={field.onChange}
                  options={BingCountryOptions}
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
                  options={BingLanguageOptions}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </FormWrapper>
    </Form>
  )
}
