import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
})

export default function GithubToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={5}
      />
    </ToolConfigForm>
  )
}
