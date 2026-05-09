import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type {
  TraceIssue,
  TraceRunViewModel,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import { cn } from '@/lib/utils'

const ISSUE_TONE_CLASSES: Record<TraceIssue['severity'], string> = {
  error: 'border-status-error bg-status-error/10 text-status-error',
  warning: 'border-status-warning bg-status-warning/10 text-status-warning',
  info: 'border-border-subtle bg-surface-primary text-text-secondary',
}

interface TraceErrorPanelProps {
  viewModel: TraceRunViewModel
  span?: TraceSpanViewModel
}

export function TraceErrorPanel({ viewModel, span }: TraceErrorPanelProps) {
  const spanIssues = span
    ? viewModel.issues.filter((issue) => issue.spanId === span.id)
    : []
  const issues = spanIssues.length > 0 ? spanIssues : viewModel.issues
  const spanError =
    span?.error && !issues.some((issue) => issue.message === span.error)
      ? span.error
      : undefined

  if (!spanError && issues.length === 0) {
    return (
      <div className="p-space-lg">
        <div className="rounded-radius-md bg-surface-primary px-space-lg py-space-xl flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="text-status-success size-8" />
          <div className="mt-space-sm text-sm font-semibold text-text-primary">
            当前节点未记录错误
          </div>
          <div className="mt-space-xs text-xs text-text-tertiary">
            如果回答异常但 Trace 正常，请继续查看 Payload 与 Raw JSON。
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gap-space-base p-space-lg flex flex-col">
      {spanError ? (
        <div className="rounded-radius-md border-status-error bg-status-error/10 p-space-base text-status-error border">
          <div className="gap-space-xs flex items-center text-sm font-semibold">
            <AlertTriangle className="size-3.5" />
            节点错误
          </div>
          <pre className="mt-space-sm whitespace-pre-wrap break-words text-xs">
            {spanError}
          </pre>
        </div>
      ) : null}
      {issues.map((issue) => (
        <div
          key={issue.id}
          className={cn(
            'rounded-radius-md p-space-base border',
            ISSUE_TONE_CLASSES[issue.severity],
          )}
        >
          <div className="gap-space-xs flex items-center text-sm font-semibold">
            <AlertTriangle className="size-3.5" />
            {issue.severity}
          </div>
          <div className="mt-space-xs text-sm">{issue.message}</div>
          {issue.componentId ? (
            <div className="mt-space-xs font-mono text-xs opacity-80">
              {issue.componentId}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
