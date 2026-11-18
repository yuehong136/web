import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { TraceRunViewModel } from '@/pages/agent/adapters/trace'
import { formatTraceDuration } from '../utils'

interface TraceSummaryStripProps {
  summary: TraceRunViewModel['summary']
}

function SummaryMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number
  tone?: 'default' | 'error' | 'warning'
}) {
  return (
    <div className="min-w-0 border-r border-line-subtle px-space-base py-space-sm last:border-r-0">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div
        className={cn(
          'mt-space-xs truncate font-mono text-sm font-semibold text-fg',
          tone === 'error'
            ? 'text-danger-fg'
            : tone === 'warning'
              ? 'text-warning-fg'
              : undefined,
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function TraceSummaryStrip({ summary }: TraceSummaryStripProps) {
  const { t } = useTranslation()

  return (
    <div className="grid shrink-0 grid-cols-2 border-b border-line bg-surface md:grid-cols-5">
      <SummaryMetric label={t('agent.trace.node')} value={summary.spanCount} />
      <SummaryMetric
        label={t('agent.trace.tool')}
        value={summary.toolCallCount}
      />
      <SummaryMetric
        label={t('agent.trace.error')}
        value={summary.errorCount}
        tone={summary.errorCount ? 'error' : 'default'}
      />
      <SummaryMetric
        label={t('agent.trace.duration')}
        value={formatTraceDuration(summary.totalDuration, t)}
      />
      <SummaryMetric
        label={t('agent.trace.slowestNode')}
        value={
          summary.slowestSpan
            ? `${summary.slowestSpan.name} · ${formatTraceDuration(
                summary.slowestSpan.duration,
                t,
              )}`
            : '-'
        }
        tone={summary.slowestSpan ? 'warning' : 'default'}
      />
    </div>
  )
}
