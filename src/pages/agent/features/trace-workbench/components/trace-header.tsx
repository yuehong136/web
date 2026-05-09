import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TraceRunViewModel } from '@/pages/agent/adapters/trace'
import { TRACE_RUN_STATUS_LABELS, TRACE_UNAVAILABLE_LABELS } from '../constants'

const STATUS_VARIANT_MAP: Record<
  TraceRunViewModel['status'],
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  running: 'warning',
  success: 'success',
  error: 'destructive',
  partial: 'warning',
  missing: 'outline',
}

interface TraceHeaderProps {
  viewModel: TraceRunViewModel
  isLoading?: boolean
  onRefresh?: () => void
}

function TraceIdentifier({ label, value }: { label: string; value?: string }) {
  const displayValue =
    value && value.length > 12
      ? `${value.slice(0, 8)}...${value.slice(-4)}`
      : value

  return (
    <div className="gap-space-xs rounded-radius-full bg-surface-secondary px-space-sm flex min-w-0 items-center border border-border-subtle py-[2px] text-xs text-text-tertiary">
      <span className="shrink-0">{label}</span>
      <span className="font-mono text-text-secondary">
        {displayValue || '-'}
      </span>
    </div>
  )
}

export function TraceHeader({
  viewModel,
  isLoading,
  onRefresh,
}: TraceHeaderProps) {
  const unavailable = viewModel.unavailableReason
    ? TRACE_UNAVAILABLE_LABELS[viewModel.unavailableReason]
    : undefined

  return (
    <header className="gap-space-base px-space-lg py-space-base flex min-h-[64px] items-center justify-between border-b border-components-split-pane-border bg-components-console-surface">
      <div className="min-w-0">
        <div className="gap-space-sm flex min-w-0 items-center">
          <Badge variant={STATUS_VARIANT_MAP[viewModel.status]}>
            {TRACE_RUN_STATUS_LABELS[viewModel.status]}
          </Badge>
          <h3 className="truncate text-sm font-semibold text-text-primary">
            Trace
          </h3>
          {unavailable ? (
            <span className="gap-space-xs text-status-warning inline-flex min-w-0 items-center text-xs">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="truncate">{unavailable.title}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-space-xs gap-space-xs flex min-w-0 flex-wrap items-center">
          <TraceIdentifier label="Session" value={viewModel.sessionId} />
          <TraceIdentifier label="Message" value={viewModel.messageId} />
        </div>
      </div>
      <div className="gap-space-xs flex shrink-0 items-center">
        <span className="hidden text-xs text-text-tertiary xl:inline-flex">
          {viewModel.summary.spanCount} spans
        </span>
        <span className="hidden text-xs text-text-tertiary xl:inline-flex">
          {viewModel.summary.toolCallCount} tools
        </span>
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="刷新 Trace"
            onClick={onRefresh}
            loading={isLoading}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </header>
  )
}
