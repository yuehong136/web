import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolTextField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.union([z.string(), z.number()]).optional(),
  searxng_url: z.string().optional(),
})

export default function SearXNGToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={10}
        keepString
      />
      <ToolTextField
        name="searxng_url"
        label={t('searxngUrl', 'SearXNG URL')}
        placeholder="https://searx.example.com"
      />
    </ToolConfigForm>
  )
}
