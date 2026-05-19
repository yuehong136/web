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
import { initialGoogleValues } from '../../constant'
import { GoogleCountryOptions, GoogleLanguageOptions } from '../../options'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  ApiKeyField,
  FormWrapper,
  Output,
  QueryVariable,
  transferOutputs,
} from '../components'

const schema = z.object({
  q: z.string().optional(),
  start: z.coerce.number().optional(),
  num: z.coerce.number().optional(),
  api_key: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function GoogleForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialGoogleValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable name="q" />
        <ApiKeyField />

        <FormField
          control={form.control}
          name="start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.start', 'Start')}</FormLabel>
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

        <FormField
          control={form.control}
          name="num"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.num', 'Num')}</FormLabel>
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
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.country', 'Country')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value}
                  onChange={field.onChange}
                  options={GoogleCountryOptions}
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
                  options={GoogleLanguageOptions}
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
