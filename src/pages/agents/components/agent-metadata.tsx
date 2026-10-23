import { useTranslation } from 'react-i18next'
import { Clock, GitBranch } from 'lucide-react'
import {
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import { countFlowNodes, isPipelineFlow } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import type { AgentTimeFormat } from './agent-card'

export function AgentKind({ flow }: { flow: AgentFlow }) {
  const { t } = useTranslation()
  return (
    <span className="rounded-radius-full bg-background-subtle px-space-sm py-space-2xs text-xs text-text-secondary">
      {t(isPipelineFlow(flow) ? 'agents.kindPipeline' : 'agents.kindAgent')}
    </span>
  )
}
export function AgentMetadata({
  flow,
  timeFormat,
}: {
  flow: AgentFlow
  timeFormat: AgentTimeFormat
}) {
  const { t } = useTranslation()
  const timestamp = flow.update_time
  const valid =
    Number.isFinite(timestamp) && timestamp >= 0 && timestamp <= 4102444800000
  const formatted = valid
    ? (timeFormat === 'relative'
        ? formatRelativeTime
        : timeFormat === 'compact'
          ? formatTimestampCompact
          : formatTimestampDetailed)(timestamp)
    : t('agents.noUpdateTime')
  return (
    <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs text-xs text-text-tertiary">
      <span className="inline-flex items-center gap-space-xs">
        <GitBranch className="size-icon-xs" aria-hidden="true" />
        {t('agents.nodeCount', { count: countFlowNodes(flow) })}
      </span>
      <span className="inline-flex items-center gap-space-xs">
        <Clock className="size-icon-xs" aria-hidden="true" />
        <time dateTime={valid ? new Date(timestamp).toISOString() : undefined}>
          {formatted}
        </time>
      </span>
    </div>
  )
}
