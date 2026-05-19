import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolTextField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  smtp_server: z.string().optional(),
  smtp_port: z.coerce.number().optional(),
  email: z.string().optional(),
  smtp_username: z.string().optional(),
  password: z.string().optional(),
  sender_name: z.string().optional(),
})

export default function EmailToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolTextField
        name="smtp_server"
        label={t('smtpServer', 'SMTP Server')}
      />
      <ToolNumberField
        name="smtp_port"
        label={t('smtpPort', 'SMTP Port')}
        fallback={465}
      />
      <ToolTextField
        name="email"
        label={t('senderEmail', 'Sender Email')}
        type="email"
      />
      <ToolTextField
        name="smtp_username"
        label={t('smtpUsername', 'SMTP Username')}
      />
      <ToolTextField
        name="password"
        label={t('authCode', 'Auth Code')}
        type="password"
      />
      <ToolTextField
        name="sender_name"
        label={t('senderName', 'Sender Name')}
      />
    </ToolConfigForm>
  )
}
