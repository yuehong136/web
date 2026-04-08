import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { initialInvokeValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'
import { invokeMethodOptions } from './constants'
import { invokeFormSchema } from './schema'

export function InvokeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialInvokeValues, node)

  const form = useForm({
    resolver: zodResolver(invokeFormSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.method', 'Method')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invokeMethodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
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
          name="timeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.timeout', 'Timeout (s)')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? initialInvokeValues.timeout}
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
          name="headers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.headers', 'Headers (JSON)')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proxy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.proxy', 'Proxy')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clean_html"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.cleanHtml', 'Clean HTML')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
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
