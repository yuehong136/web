import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { AgentDialogueMode, initialBeginValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'

const schema = z.object({
  mode: z.string().optional(),
  prologue: z.string().optional(),
  inputs: z.record(z.string(), z.any()).optional(),
})

export function BeginForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialBeginValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const mode = useWatch({ control: form.control, name: 'mode' })

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.mode', 'Mode')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AgentDialogueMode.Conversational}>
                      {t('flow.conversational', 'Conversational')}
                    </SelectItem>
                    <SelectItem value={AgentDialogueMode.Task}>
                      {t('flow.task', 'Task')}
                    </SelectItem>
                    <SelectItem value={AgentDialogueMode.Webhook}>
                      Webhook
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === AgentDialogueMode.Conversational && (
          <FormField
            control={form.control}
            name="prologue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.prologue', 'Opening')}</FormLabel>
                <FormControl>
                  <Textarea rows={5} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </FormWrapper>
    </Form>
  )
}
