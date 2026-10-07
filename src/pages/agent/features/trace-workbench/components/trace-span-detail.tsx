import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TRACE_SPAN_KIND_LABELS, TRACE_SPAN_STATUS_LABELS } from '../constants'
import { formatTraceDuration } from '../utils'

const STATUS_VARIANT_MAP: Record<
  TraceSpanViewModel['status'],
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  running: 'warning',
  success: 'success',
  error: 'destructive',
  unknown: 'outline',
}

function formatShortId(value?: string) {
  if (!value) {
    return '-'
  }

  return value.length > 18
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-space-sm border-b border-border-subtle py-space-xs last:border-b-0">
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="min-w-0 text-xs break-words text-text-primary">
        {value}
      </div>
    </div>
  )
}

export function TraceSpanDetail({ span }: { span?: TraceSpanViewModel }) {
  if (!span) {
    return (
      <section className="p-space-lg text-sm text-text-secondary">
        请选择一个节点。
      </section>
    )
  }

  return (
    <section className="border-b border-components-split-pane-border bg-components-console-surface">
      <div className="px-space-lg py-space-base">
        <div className="flex min-w-0 items-start justify-between gap-space-base">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-space-sm">
              <h4 className="truncate text-base font-semibold text-text-primary">
                {span.name}
              </h4>
              <Badge variant={STATUS_VARIANT_MAP[span.status]}>
                {TRACE_SPAN_STATUS_LABELS[span.status]}
              </Badge>
            </div>
            <div className="mt-space-xs flex flex-wrap items-center gap-x-space-base gap-y-space-xs text-xs text-text-tertiary">
              <span>类型 {TRACE_SPAN_KIND_LABELS[span.kind]}</span>
              <span>耗时 {formatTraceDuration(span.duration)}</span>
              <span className="inline-flex min-w-0 items-center">
                ID{' '}
                <span className="truncate font-mono">
                  {formatShortId(span.id)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {span.error ? (
          <div className="mt-space-base rounded-radius-md border border-status-error-border bg-status-error-subtle p-space-sm text-status-error">
            <div className="mb-space-xs flex items-center gap-space-xs text-xs font-semibold">
              <AlertTriangle className="size-3.5" />
              错误
            </div>
            <pre className="text-xs break-words whitespace-pre-wrap">
              {span.error}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="grid border-t border-border-subtle px-space-lg py-space-sm md:grid-cols-2 md:gap-x-space-xl">
        {span.componentId ? (
          <DetailRow label="组件" value={span.componentId} />
        ) : null}
        {span.parentId ? (
          <DetailRow label="父节点" value={formatShortId(span.parentId)} />
        ) : null}
        {span.message ? <DetailRow label="消息" value={span.message} /> : null}
      </div>
    </section>
  )
}
