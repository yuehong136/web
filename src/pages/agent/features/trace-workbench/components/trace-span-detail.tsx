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
        请选择一个节点。
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
          <div className="mt-space-base rounded-radius-md border-status-error bg-status-error/10 p-space-sm text-status-error border">
            <div className="mb-space-xs gap-space-xs flex items-center text-xs font-semibold">
              <AlertTriangle className="size-3.5" />
              错误
            </div>
            <pre className="whitespace-pre-wrap break-words text-xs">
              {span.error}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="px-space-lg py-space-sm md:gap-x-space-xl grid border-t border-border-subtle md:grid-cols-2">
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
