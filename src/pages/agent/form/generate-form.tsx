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
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialGenerateValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'
import { LlmSetting } from './components/llm-setting'

const schema = z.object({
  llm_id: z.string().optional(),
  temperature: z.coerce.number().optional(),
  top_p: z.coerce.number().optional(),
  presence_penalty: z.coerce.number().optional(),
  frequency_penalty: z.coerce.number().optional(),
  max_tokens: z.coerce.number().optional(),
  prompt: z.string().optional(),
  cite: z.boolean().optional(),
  message_history_window_size: z.coerce.number().optional(),
  parameters: z.array(z.any()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function GenerateForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialGenerateValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.prompt', 'Prompt')}</FormLabel>
              <FormControl>
                <Textarea rows={6} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cite"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.cite', 'Citation')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
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
                  value={field.value ?? 12}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
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

        {outputs && (
          <Output list={transferOutputs(outputs)} />
        )}
      </FormWrapper>
    </Form>
  )
}
