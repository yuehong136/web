import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, badgeLook } from '@/components/ui/badge'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import {
  TRACE_SPAN_KIND_LABEL_KEYS,
  TRACE_SPAN_STATUS_LABEL_KEYS,
} from '../constants'
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
    <div className="grid grid-cols-[96px_1fr] gap-space-sm border-b border-line-subtle py-space-xs last:border-b-0">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div className="min-w-0 text-xs break-words text-fg">{value}</div>
    </div>
  )
}

export function TraceSpanDetail({ span }: { span?: TraceSpanViewModel }) {
  const { t } = useTranslation()

  if (!span) {
    return (
      <section className="p-space-lg text-sm text-fg-muted">
        {t('agent.traceWorkbench.spanDetail.empty')}
      </section>
    )
  }

  return (
    <section className="border-b border-line bg-surface">
      <div className="px-space-lg py-space-base">
        <div className="flex min-w-0 items-start justify-between gap-space-base">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-space-sm">
              <h4 className="truncate text-base font-semibold text-fg">
                {span.name}
              </h4>
              <Badge {...badgeLook(STATUS_VARIANT_MAP[span.status])}>
                {t(TRACE_SPAN_STATUS_LABEL_KEYS[span.status])}
              </Badge>
            </div>
            <div className="mt-space-xs flex flex-wrap items-center gap-x-space-base gap-y-space-xs text-xs text-fg-subtle">
              <span>
                {t('agent.traceWorkbench.spanDetail.kind', {
                  kind: t(TRACE_SPAN_KIND_LABEL_KEYS[span.kind]),
                })}
              </span>
              <span>
                {t('agent.traceWorkbench.spanDetail.duration', {
                  duration: formatTraceDuration(span.duration, t),
                })}
              </span>
              <span className="inline-flex min-w-0 items-center">
                {t('agent.traceWorkbench.spanDetail.id')}{' '}
                <span className="truncate font-mono">
                  {formatShortId(span.id)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {span.error ? (
          <div className="mt-space-base rounded-radius-md border border-danger-line bg-danger-soft p-space-sm text-danger-fg">
            <div className="mb-space-xs flex items-center gap-space-xs text-xs font-semibold">
              <AlertTriangle className="size-3.5" />
              {t('agent.trace.error')}
            </div>
            <pre className="text-xs break-words whitespace-pre-wrap">
              {span.error}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="grid border-t border-line-subtle px-space-lg py-space-sm md:grid-cols-2 md:gap-x-space-xl">
        {span.componentId ? (
          <DetailRow
            label={t('agent.traceWorkbench.spanDetail.component')}
            value={span.componentId}
          />
        ) : null}
        {span.parentId ? (
          <DetailRow
            label={t('agent.traceWorkbench.spanDetail.parent')}
            value={formatShortId(span.parentId)}
          />
        ) : null}
        {span.message ? (
          <DetailRow
            label={t('agent.traceWorkbench.spanDetail.message')}
            value={span.message}
          />
        ) : null}
      </div>
    </section>
  )
}
