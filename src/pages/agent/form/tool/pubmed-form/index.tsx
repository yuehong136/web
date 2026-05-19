import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolTextField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  email: z.string().optional(),
})

export default function PubMedToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={12}
      />
      <ToolTextField name="email" label={t('email', 'Email')} type="email" />
    </ToolConfigForm>
  )
}
