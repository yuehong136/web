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
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { CrawlerResultOptions } from '../../options'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  FormWrapper,
  Output,
  QueryVariable,
  transferOutputs,
} from '../components'

const schema = z.object({
  query: z.string().optional(),
  proxy: z.string().optional(),
  extract_type: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

const defaultValues = {
  proxy: '',
  extract_type: 'markdown',
}

export function CrawlerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(defaultValues, node)

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
          name="proxy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.proxy', 'Proxy')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="http://127.0.0.1:8888"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="extract_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.extractType', 'Extract Type')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CrawlerResultOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`flow.crawlerResultOptions.${value}`, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
