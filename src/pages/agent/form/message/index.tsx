import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import {
  MessageAudienceFields,
  MessageContentListField,
  MessageOutputSettings,
  WebhookResponseStatusField,
} from './fields'
import {
  useMessageFormValues,
  useMessageWebhookState,
  useWatchMessageFormChange,
} from './hooks'

const messageSchema = z.object({
  content: z.array(z.object({ value: z.string() })).optional(),
  output_format: z.string().optional(),
  auto_play: z.boolean().optional(),
  status: z.coerce.number().optional(),
  memory_ids: z.array(z.string()).optional(),
  user_id: z.string().optional(),
})

export function MessageForm({ node }: INextOperatorForm) {
  const values = useMessageFormValues(node)

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: values,
  })

  useWatchMessageFormChange(node?.id, form)

  const { isWebhookMode, showWebhookResponseStatus } =
    useMessageWebhookState(form)

  return (
    <Form {...form}>
      <FormWrapper>
        {showWebhookResponseStatus && <WebhookResponseStatusField />}
        <MessageContentListField />
        {!isWebhookMode && <MessageOutputSettings />}
        <MessageAudienceFields />
      </FormWrapper>
    </Form>
  )
}
