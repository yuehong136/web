import { z } from 'zod'
import { Channel } from '../../../constant'
import type { INextOperatorForm } from '../../../types'
import { ToolConfigForm } from '../tool-config-form'
import { ToolNumberField, ToolSelectField, useFlowLabel } from '../tool-fields'

const schema = z.object({
  top_n: z.coerce.number().optional(),
  channel: z.string().optional(),
})

export default function DuckDuckGoToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const channelOptions = Object.values(Channel).map((value) => ({
    value,
    label: t(value, value),
  }))

  return (
    <ToolConfigForm node={node} schema={schema}>
      <ToolNumberField
        name="top_n"
        label={t('topN', 'Top N Results')}
        fallback={10}
      />
      <ToolSelectField
        name="channel"
        label={t('channel', 'Channel')}
        options={channelOptions}
      />
    </ToolConfigForm>
  )
}
