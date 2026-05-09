import { AlertTriangle, Clock, Gauge, GitBranch, Wrench } from 'lucide-react'
import type { TraceRunViewModel } from '@/pages/agent/adapters/trace'

interface TraceSummaryStripProps {
  summary: TraceRunViewModel['summary']
}

function formatDuration(duration?: number) {
  if (typeof duration !== 'number') {
    return '-'
  }

  return duration >= 1000
    ? `${(duration / 1000).toFixed(2)}s`
    : `${duration.toFixed(3)}s`
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  icon: typeof GitBranch
  tone?: 'default' | 'error' | 'warning'
}) {
  return (
    <div className="px-space-base py-space-sm min-w-0 border-r border-border-subtle last:border-r-0">
      <div className="gap-space-xs flex items-center text-xs text-text-tertiary">
        <Icon
          className={
            tone === 'error'
              ? 'text-status-error size-4'
              : tone === 'warning'
                ? 'text-status-warning size-4'
                : 'text-text-caption size-4'
          }
        />
        <span>{label}</span>
      </div>
      <div className="mt-space-xs truncate text-sm font-semibold text-text-primary">
        {value}
      </div>
    </div>
  )
}

export function TraceSummaryStrip({ summary }: TraceSummaryStripProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 border-b border-components-split-pane-border bg-components-console-surface md:grid-cols-5">
      <SummaryMetric icon={GitBranch} label="Spans" value={summary.spanCount} />
      <SummaryMetric
        icon={Wrench}
        label="Tools"
        value={summary.toolCallCount}
      />
      <SummaryMetric
        icon={AlertTriangle}
        label="Errors"
        value={summary.errorCount}
        tone={summary.errorCount ? 'error' : 'default'}
      />
      <SummaryMetric
        icon={Clock}
        label="Total"
        value={formatDuration(summary.totalDuration)}
      />
      <SummaryMetric
        icon={Gauge}
        label="Slowest"
        value={
          summary.slowestSpan
            ? `${summary.slowestSpan.name} · ${formatDuration(
                summary.slowestSpan.duration,
              )}`
            : '-'
        }
        tone={summary.slowestSpan ? 'warning' : 'default'}
      />
    </div>
  )
}
