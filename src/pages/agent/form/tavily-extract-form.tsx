import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  TavilyExtractDepth,
  TavilyExtractFormat,
  initialTavilyExtractValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  urls: z.string().optional(),
  extract_depth: z.string().optional(),
  format: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function TavilyExtractForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialTavilyExtractValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  const depthOptions = useMemo(
    () => Object.values(TavilyExtractDepth),
    [],
  )
  const formatOptions = useMemo(
    () => Object.values(TavilyExtractFormat),
    [],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="urls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.urls', 'URLs')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="https://example.com"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="extract_depth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.extractDepth', 'Extract Depth')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {depthOptions.map((value) => (
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
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.format', 'Format')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((value) => (
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

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
