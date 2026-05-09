import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import { cn, formatTimestampDetailed } from '@/lib/utils'
import type { AgentFlow, AgentSession } from '@/types/agent'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { extractAgentLogStatus } from '../hooks/use-agent-log-list'
import { AGENT_LOG_SOURCE_LABELS } from '../constants'
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
  const successes = sessions.filter(
    (session) => extractAgentLogStatus(session) === AgentLogStatus.OK,
  ).length
  const running = sessions.filter(
    (session) => extractAgentLogStatus(session) === AgentLogStatus.RUN,
  ).length
  const successRate =
    sessions.length > 0
      ? `${Math.round(((sessions.length - failures) / sessions.length) * 1000) / 10}%`
      : '-'
  const latestSession = sessions[0]
  const sourceCounts = sessions.reduce<Record<string, number>>(
    (acc, session) => {
      const source =
        typeof session.source === 'string' && session.source.trim()
          ? session.source
          : undefined
      if (source) {
        acc[source] = (acc[source] || 0) + 1
      }
      return acc
    },
    {},
  )
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="grid border-b border-components-page-toolbar-border bg-components-console-surface xl:grid-cols-[minmax(280px,1.5fr)_minmax(0,2.5fr)]">
      <div className="gap-space-sm px-space-lg py-space-base flex min-w-0 items-center border-r border-border-subtle">
        <div
          className={cn(
            'rounded-radius-lg flex h-12 w-12 shrink-0 items-center justify-center bg-gradient-to-br text-base font-semibold text-text-inverted',
            getAvatarGradient(title),
          )}
        >
          {title.charAt(0).toUpperCase() || <Bot className="size-5" />}
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
            <span>
              最近会话{' '}
              {latestSession?.update_time
                ? formatTimestampDetailed(latestSession.update_time)
                : '暂无'}
            </span>
            <span>·</span>
            <span className="font-mono">{agent.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
        <SummaryStat label="会话总数" value={String(total)} />
        <SummaryStat
          label="当前结果"
          value={String(isFiltered ? filteredTotal : sessions.length)}
        />
        <SummaryStat
          label="成功率"
          value={successRate}
          description={`${successes} 成功 / ${failures} 失败`}
        />
        <SummaryStat
          label="运行中"
          value={String(running)}
          description={failures ? `${failures} 个失败` : '无失败'}
          tone={failures ? 'danger' : 'default'}
        />
        <div className="px-space-lg py-space-base min-w-0">
          <div className="text-xs font-medium text-text-tertiary">来源</div>
          <div className="mt-space-xs gap-space-xs flex min-w-0 flex-wrap">
            {topSources.length > 0 ? (
              topSources.map(([source, count]) => (
                <Badge key={source} variant="secondary">
                  {AGENT_LOG_SOURCE_LABELS[source] || source} {count}
                </Badge>
              ))
            ) : (
              <span className="text-sm font-medium text-text-secondary">
                未记录
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  description,
  tone = 'default',
}: {
  label: string
  value: string
  description?: string
  tone?: 'default' | 'danger'
}) {
  return (
    <div className="px-space-lg py-space-base min-w-0 border-r border-border-subtle last:border-r-0">
      <div className="text-xs font-medium text-text-tertiary">{label}</div>
      <div className="mt-space-xs text-xl font-semibold leading-none text-text-primary">
        {value}
      </div>
      {description ? (
        <div
          className={cn(
            'mt-space-xs truncate text-xs',
            tone === 'danger' ? 'text-status-error' : 'text-text-tertiary',
          )}
        >
          {description}
        </div>
      ) : null}
    </div>
  )
}
