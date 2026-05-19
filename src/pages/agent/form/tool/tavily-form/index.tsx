import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { ApiKeyField } from '../../components'
import { ToolConfigForm } from '../tool-config-form'

const schema = z.object({
  api_key: z.string().optional(),
})

function TavilyToolForm({ node }: INextOperatorForm) {
  return (
    <ToolConfigForm node={node} schema={schema}>
      <ApiKeyField />
    </ToolConfigForm>
  )
}

export const TavilyExtractToolForm = TavilyToolForm

export default TavilyToolForm
