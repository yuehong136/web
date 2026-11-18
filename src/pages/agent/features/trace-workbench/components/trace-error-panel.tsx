import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  TraceIssue,
  TraceRunViewModel,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import { cn } from '@/lib/utils'

const ISSUE_TONE_CLASSES: Record<TraceIssue['severity'], string> = {
  error: 'border-danger-line bg-danger-soft text-danger-fg',
  warning: 'border-warning-line bg-warning-soft text-warning-fg',
  info: 'border-line-subtle bg-surface text-fg-muted',
}

interface TraceErrorPanelProps {
  viewModel: TraceRunViewModel
  span?: TraceSpanViewModel
}

export function TraceErrorPanel({ viewModel, span }: TraceErrorPanelProps) {
  const { t } = useTranslation()
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
        <div className="flex flex-col items-center justify-center rounded-radius-md bg-surface px-space-lg py-space-xl text-center">
          <CheckCircle2 className="size-8 text-success-fg" />
          <div className="mt-space-sm text-sm font-semibold text-fg">
            {t('agent.traceWorkbench.errorPanel.empty')}
          </div>
          <div className="mt-space-xs text-xs text-fg-subtle">
            {t('agent.traceWorkbench.errorPanel.emptyHint')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-space-base p-space-lg">
      {spanError ? (
        <div className="rounded-radius-md border border-danger-line bg-danger-soft p-space-base text-danger-fg">
          <div className="flex items-center gap-space-xs text-sm font-semibold">
            <AlertTriangle className="size-3.5" />
            {t('agent.traceWorkbench.errorPanel.spanError')}
          </div>
          <pre className="mt-space-sm text-xs break-words whitespace-pre-wrap">
            {spanError}
          </pre>
        </div>
      ) : null}
      {issues.map((issue) => (
        <div
          key={issue.id}
          className={cn(
            'rounded-radius-md border p-space-base',
            ISSUE_TONE_CLASSES[issue.severity],
          )}
        >
          <div className="flex items-center gap-space-xs text-sm font-semibold">
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
