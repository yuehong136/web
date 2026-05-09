import { Bot, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import { cn, formatTimestampDetailed } from '@/lib/utils'
import type { AgentFlow, AgentSession } from '@/types/agent'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { extractAgentLogStatus } from '../hooks/use-agent-log-list'
import { AgentLogStatus } from '../types'

interface LogSummaryBandProps {
  agent?: AgentFlow
  total: number
  filteredTotal: number
  isFiltered: boolean
  sessions?: AgentSession[]
}

export function LogSummaryBand({
  agent,
  total,
  filteredTotal,
  isFiltered,
  sessions = [],
}: LogSummaryBandProps) {
  if (!agent) {
    return null
  }

  const title = resolveLocalizedText(agent.title, '未命名 Agent')
  const failures = sessions.filter(
    (session) => extractAgentLogStatus(session) === AgentLogStatus.ERR,
  ).length
  const successRate =
    sessions.length > 0
      ? `${Math.round(((sessions.length - failures) / sessions.length) * 1000) / 10}%`
      : '-'

  return (
    <div className="grid grid-cols-[minmax(220px,1.6fr)_repeat(5,minmax(120px,1fr))_minmax(180px,1.1fr)] border-b border-components-page-toolbar-border bg-components-console-surface">
      <div className="gap-space-sm px-space-lg py-space-base flex min-w-0 items-center border-r border-border-subtle">
        <div
          className={cn(
            'rounded-radius-lg flex h-12 w-12 shrink-0 items-center justify-center bg-gradient-to-br text-base font-semibold text-text-inverted',
            getAvatarGradient(title),
          )}
        >
          {title.charAt(0).toUpperCase() || <Bot className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <div className="gap-space-xs flex flex-wrap items-center">
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {title}
            </h2>
            <Badge variant={isPipelineFlow(agent) ? 'blue' : 'green'}>
              {isPipelineFlow(agent) ? 'Pipeline' : 'Agent'}
            </Badge>
          </div>
          <div className="mt-space-xs gap-space-xs flex flex-wrap items-center text-xs text-text-tertiary">
            <span>
              {isFiltered ? `筛选后 ${filteredTotal}` : `${total} 会话`}
            </span>
            <span>·</span>
            <span>最近运行 {formatTimestampDetailed(agent.update_time)}</span>
            <span>·</span>
            <span className="font-mono">{agent.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
      <SummaryStat label="会话数" value={String(total)} delta="+24" positive />
      <SummaryStat label="成功率" value={successRate} delta="-0.8" />
      <SummaryStat label="失败" value={String(failures)} delta="+3" danger />
      <SummaryStat label="P50 / P95" value="-" unit="s" />
      <SummaryStat label="Token (in/out)" value="-" />
      <div className="px-space-lg py-space-base border-r-0">
        <div className="text-xs font-medium text-text-tertiary">触发来源</div>
        <div className="mt-space-xs gap-space-xs flex flex-wrap">
          <Badge variant="secondary">Explore</Badge>
          <Badge variant="secondary">Webhook</Badge>
          <Badge variant="secondary">API</Badge>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  unit,
  delta,
  positive = false,
  danger = false,
}: {
  label: string
  value: string
  unit?: string
  delta?: string
  positive?: boolean
  danger?: boolean
}) {
  return (
    <div className="px-space-lg py-space-base border-r border-border-subtle">
      <div className="text-xs font-medium text-text-tertiary">{label}</div>
      <div className="mt-space-xs text-2xl font-semibold leading-none text-text-primary">
        {value}
        {unit ? (
          <span className="ml-space-xs text-sm text-text-tertiary">{unit}</span>
        ) : null}
      </div>
      {delta ? (
        <div
          className={cn(
            'mt-space-xs gap-space-xs inline-flex items-center text-xs',
            positive
              ? 'text-state-success'
              : danger
                ? 'text-state-error'
                : 'text-state-error',
          )}
        >
          {positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {delta}
        </div>
      ) : null}
    </div>
  )
}
