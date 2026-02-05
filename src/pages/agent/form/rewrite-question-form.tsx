import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialRewriteQuestionValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper } from './components'
import { LlmSetting } from './components/llm-setting'

const schema = z.object({
  llm_id: z.string().optional(),
  temperature: z.coerce.number().optional(),
  top_p: z.coerce.number().optional(),
  presence_penalty: z.coerce.number().optional(),
  frequency_penalty: z.coerce.number().optional(),
  max_tokens: z.coerce.number().optional(),
  language: z.string().optional(),
  message_history_window_size: z.coerce.number().optional(),
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
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.language', 'Language')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('flow.languagePlaceholder', 'e.g. English')}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
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
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
            <ChevronDown className="size-4" />
            {t('flow.modelSettings', 'Model Settings')}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <LlmSetting />
          </CollapsibleContent>
        </Collapsible>
      </FormWrapper>
    </Form>
  )
}
