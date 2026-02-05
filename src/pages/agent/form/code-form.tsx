import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  CodeTemplateStrMap,
  ProgrammingLanguage,
  initialCodeValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  lang: z.string(),
  script: z.string().optional(),
  arguments: z.record(z.string(), z.any()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function CodeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialCodeValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const lang = useWatch({ control: form.control, name: 'lang' })
  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="lang"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.language', 'Language')}</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val)
                    const template =
                      CodeTemplateStrMap[
                        val as keyof typeof CodeTemplateStrMap
                      ]
                    if (template) {
                      form.setValue('script', template)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProgrammingLanguage.Python}>
                      Python
                    </SelectItem>
                    <SelectItem value={ProgrammingLanguage.JavaScript}>
                      JavaScript
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="script"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.code', 'Code')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={12}
                  className="font-mono text-xs"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
