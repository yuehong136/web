import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialRewriteQuestionValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { GoogleLanguageOptions } from '../../options'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { LLMSelectField } from '../components/llm-select-field'

const schema = z.object({
  llm_id: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  max_tokens: z.number().optional(),
  language: z.string().optional(),
  message_history_window_size: z.number().optional(),
})

export function RewriteQuestionForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialRewriteQuestionValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        <LLMSelectField type="chat" valueMode="nameWithProvider" />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.language', 'Language')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={GoogleLanguageOptions}
                  allowClear
                  placeholder={t('flow.languagePlaceholder', 'Select language')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message_history_window_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.messageHistoryWindowSize', 'Message History Window')}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 6}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormWrapper>
    </Form>
  )
}
