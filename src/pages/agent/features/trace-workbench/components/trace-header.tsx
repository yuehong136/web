import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, badgeLook } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TraceRunViewModel } from '@/pages/agent/adapters/trace'
import {
  TRACE_RUN_STATUS_LABEL_KEYS,
  TRACE_UNAVAILABLE_LABELS,
} from '../constants'

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
    <div className="flex min-w-0 items-center gap-space-xs rounded-radius-full border border-line-subtle bg-sunken px-space-sm py-[2px] text-xs text-fg-subtle">
      <span className="shrink-0">{label}</span>
      <span className="font-mono text-fg-muted">{displayValue || '-'}</span>
    </div>
  )
}

export function TraceHeader({
  viewModel,
  isLoading,
  onRefresh,
}: TraceHeaderProps) {
  const { t } = useTranslation()
  const unavailable = viewModel.unavailableReason
    ? TRACE_UNAVAILABLE_LABELS[viewModel.unavailableReason]
    : undefined

  return (
    <header className="flex min-h-[64px] items-center justify-between gap-space-base border-b border-line bg-surface px-space-lg py-space-base">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-space-sm">
          <Badge {...badgeLook(STATUS_VARIANT_MAP[viewModel.status])}>
            {t(TRACE_RUN_STATUS_LABEL_KEYS[viewModel.status])}
          </Badge>
          <h3 className="truncate text-sm font-semibold text-fg">
            {t('agent.trace.trace')}
          </h3>
          {unavailable ? (
            <span className="inline-flex min-w-0 items-center gap-space-xs text-xs text-warning-fg">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="truncate">{t(unavailable.titleKey)}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-space-xs flex min-w-0 flex-wrap items-center gap-space-xs">
          <TraceIdentifier
            label={t('agent.trace.session')}
            value={viewModel.sessionId}
          />
          <TraceIdentifier
            label={t('agent.trace.message')}
            value={viewModel.messageId}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-space-xs">
        <span className="hidden text-xs text-fg-subtle xl:inline-flex">
          {t('agent.traceWorkbench.header.spanCount', {
            count: viewModel.summary.spanCount,
          })}
        </span>
        <span className="hidden text-xs text-fg-subtle xl:inline-flex">
          {t('agent.traceWorkbench.header.toolCount', {
            count: viewModel.summary.toolCallCount,
          })}
        </span>
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('agent.trace.refresh')}
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
