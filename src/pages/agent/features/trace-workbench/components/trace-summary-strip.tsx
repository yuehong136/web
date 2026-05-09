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
    <div className="px-space-base py-space-sm min-w-0 border-r border-border-subtle last:border-r-0">
      <div className="text-xs text-text-tertiary">{label}</div>
      <div
        className={cn(
          'mt-space-xs truncate font-mono text-sm font-semibold text-text-primary',
          tone === 'error'
            ? 'text-status-error'
            : tone === 'warning'
              ? 'text-status-warning'
              : undefined,
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function TraceSummaryStrip({ summary }: TraceSummaryStripProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 border-b border-components-split-pane-border bg-components-console-surface md:grid-cols-5">
      <SummaryMetric label="节点" value={summary.spanCount} />
      <SummaryMetric label="工具" value={summary.toolCallCount} />
      <SummaryMetric
        label="错误"
        value={summary.errorCount}
        tone={summary.errorCount ? 'error' : 'default'}
      />
      <SummaryMetric
        label="总耗时"
        value={formatTraceDuration(summary.totalDuration)}
      />
      <SummaryMetric
        label="最慢节点"
        value={
          summary.slowestSpan
            ? `${summary.slowestSpan.name} · ${formatTraceDuration(
                summary.slowestSpan.duration,
              )}`
            : '-'
        }
        tone={summary.slowestSpan ? 'warning' : 'default'}
      />
    </div>
  )
}
