import { AlertTriangle, Clock, Fingerprint, GitBranch } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TRACE_SPAN_KIND_LABELS, TRACE_SPAN_STATUS_LABELS } from '../constants'

const STATUS_VARIANT_MAP: Record<
  TraceSpanViewModel['status'],
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  running: 'warning',
  success: 'success',
  error: 'destructive',
  unknown: 'outline',
}

function formatDuration(duration?: number) {
  if (typeof duration !== 'number') {
    return '接口未提供'
  }

  return `${duration.toFixed(3)}s`
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="gap-space-sm py-space-xs grid grid-cols-[96px_1fr] border-b border-border-subtle last:border-b-0">
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="min-w-0 break-words text-xs text-text-primary">
        {value}
      </div>
    </div>
  )
}

export function TraceSpanDetail({ span }: { span?: TraceSpanViewModel }) {
  if (!span) {
    return (
      <section className="p-space-lg text-sm text-text-secondary">
        请选择一个 span。
      </section>
    )
  }

  return (
    <section className="border-b border-components-split-pane-border bg-components-console-surface">
      <div className="px-space-lg py-space-base">
        <div className="gap-space-base flex min-w-0 items-start justify-between">
          <div className="min-w-0">
            <div className="gap-space-sm flex min-w-0 items-center">
              <h4 className="truncate text-base font-semibold text-text-primary">
                {span.name}
              </h4>
              <Badge variant={STATUS_VARIANT_MAP[span.status]}>
                {TRACE_SPAN_STATUS_LABELS[span.status]}
              </Badge>
            </div>
            <div className="mt-space-xs gap-x-space-base gap-y-space-xs flex flex-wrap items-center text-xs text-text-tertiary">
              <span className="gap-space-xs inline-flex items-center">
                <GitBranch className="size-4" />
                {TRACE_SPAN_KIND_LABELS[span.kind]}
              </span>
              <span className="gap-space-xs inline-flex items-center">
                <Clock className="size-4" />
                {formatDuration(span.duration)}
              </span>
              <span className="gap-space-xs inline-flex min-w-0 items-center">
                <Fingerprint className="size-4 shrink-0" />
                <span className="truncate font-mono">{span.id}</span>
              </span>
            </div>
          </div>
        </div>

        {span.error ? (
          <div className="mt-space-base rounded-radius-md border-status-error bg-status-error/10 p-space-sm text-status-error border">
            <div className="mb-space-xs gap-space-xs flex items-center text-xs font-semibold">
              <AlertTriangle className="size-4" />
              Error
            </div>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {span.error}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="px-space-lg py-space-sm md:gap-x-space-xl grid border-t border-border-subtle md:grid-cols-2">
        <DetailRow label="Component" value={span.componentId || '-'} />
        <DetailRow label="Parent" value={span.parentId || '-'} />
        <DetailRow label="Confidence" value={span.confidence} />
        <DetailRow label="Message" value={span.message || '-'} />
      </div>
    </section>
  )
}
