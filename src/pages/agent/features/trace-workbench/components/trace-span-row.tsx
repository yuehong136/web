import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Operator } from '@/pages/agent/constant'
import OperatorIcon from '@/pages/agent/operator-icon'
import type {
  TraceSpanKind,
  TraceSpanStatus,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import {
  TRACE_SPAN_KIND_LABEL_KEYS,
  TRACE_SPAN_STATUS_LABEL_KEYS,
} from '../constants'
import { formatTraceDuration, getTraceDurationPercent } from '../utils'

const STATUS_DOT_CLASSES: Record<TraceSpanStatus, string> = {
  success: 'bg-success-fg',
  error: 'bg-danger-fg',
  running: 'bg-warning-fg',
  unknown: 'bg-fg-subtle',
}

const KIND_TONE_CLASSES: Record<TraceSpanKind, string> = {
  node: 'text-fg-subtle bg-sunken',
  llm: 'text-info-fg bg-info-soft',
  tool: 'text-warning-fg bg-warning-soft',
  retrieval: 'text-success-fg bg-success-soft',
  control: 'text-fg-muted bg-sunken',
  data: 'text-info-fg bg-info-soft',
  webhook: 'text-warning-fg bg-warning-soft',
  system: 'text-fg-subtle bg-sunken',
}

const KIND_BAR_CLASSES: Record<TraceSpanKind, string> = {
  node: 'bg-fg-subtle',
  llm: 'bg-info-fg',
  tool: 'bg-warning-fg',
  retrieval: 'bg-success-fg',
  control: 'bg-fg-muted',
  data: 'bg-info-fg',
  webhook: 'bg-warning-fg',
  system: 'bg-fg-subtle',
}

const TRACE_OPERATOR_NAME_MAP: Partial<Record<TraceSpanKind, Operator>> = {
  llm: Operator.Agent,
  tool: Operator.Tool,
  retrieval: Operator.Retrieval,
  control: Operator.Categorize,
  data: Operator.DataOperations,
  webhook: Operator.Begin,
}

function resolveTraceOperatorName(span: TraceSpanViewModel) {
  const name = span.name.toLowerCase()
  if (name.includes('begin') || span.componentId === 'begin') {
    return Operator.Begin
  }
  if (name.includes('message')) {
    return Operator.Message
  }
  if (name.includes('categorize')) {
    return Operator.Categorize
  }
  if (name.includes('agent')) {
    return Operator.Agent
  }
  return TRACE_OPERATOR_NAME_MAP[span.kind] || Operator.Placeholder
}

interface TraceSpanRowProps {
  span: TraceSpanViewModel
  selected?: boolean
  onSelect: (spanId: string) => void
  depth?: number
  isLast?: boolean
  totalDuration?: number
}

export function TraceSpanRow({
  span,
  selected,
  onSelect,
  depth = 0,
  isLast = false,
  totalDuration,
}: TraceSpanRowProps) {
  const { t } = useTranslation()
  const operatorName = resolveTraceOperatorName(span)
  const depthPadding =
    depth === 0 ? 'pl-space-xs' : depth === 1 ? 'pl-space-md' : 'pl-space-lg'
  const durationPercent = getTraceDurationPercent(span.duration, totalDuration)
  const durationBarClass =
    span.status === 'error'
      ? 'bg-danger-fg'
      : span.status === 'running'
        ? 'bg-warning-fg'
        : KIND_BAR_CLASSES[span.kind]

  return (
    <button
      type="button"
      aria-label={t('agent.traceWorkbench.spanRow.view', {
        name: span.name || span.id,
      })}
      aria-pressed={selected}
      className={cn(
        'group grid w-full min-w-0 grid-cols-[32px_minmax(0,1fr)] pr-space-sm text-left text-fg-muted transition-colors',
        depthPadding,
      )}
      onClick={() => onSelect(span.id)}
    >
      <span className="relative flex min-h-[58px] justify-center">
        <span
          className={cn(
            'absolute top-0 w-px bg-line-subtle',
            isLast ? 'h-space-base' : 'bottom-0',
          )}
        />
        <span
          className={cn(
            'z-10 mt-space-base h-2 w-2 shrink-0 rounded-radius-full ring-4 ring-surface transition-colors',
            selected ? 'bg-line-focus' : STATUS_DOT_CLASSES[span.status],
          )}
        />
      </span>
      <span
        className={cn(
          'my-space-xs min-w-0 rounded-radius-md px-space-sm py-space-sm transition-colors',
          selected ? 'bg-surface text-fg' : 'group-hover:bg-surface',
        )}
      >
        <span className="grid min-w-0 grid-cols-[minmax(132px,0.92fr)_minmax(100px,1fr)_72px] items-center gap-space-sm">
          <span className="flex min-w-0 items-start gap-space-sm">
            <span
              className={cn(
                'mt-[1px] flex size-7 shrink-0 items-center justify-center rounded-radius-md',
                KIND_TONE_CLASSES[span.kind],
              )}
            >
              <OperatorIcon name={operatorName} className="size-3.5" />
            </span>
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-space-xs">
                <span className="truncate text-sm font-medium">
                  {span.name}
                </span>
                <span className="shrink-0 rounded-radius-full border border-line-subtle px-space-xs py-[1px] text-[11px] text-fg-subtle">
                  {t(TRACE_SPAN_KIND_LABEL_KEYS[span.kind])}
                </span>
              </span>
              <span className="mt-space-xs flex min-w-0 items-center gap-space-xs text-xs text-fg-subtle">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-radius-full',
                    STATUS_DOT_CLASSES[span.status],
                  )}
                />
                <span>{t(TRACE_SPAN_STATUS_LABEL_KEYS[span.status])}</span>
              </span>
            </span>
          </span>
          <span
            className="block h-2 min-w-0 overflow-hidden rounded-radius-full bg-sunken"
            aria-label={t('agent.traceWorkbench.spanRow.durationShare', {
              percent: durationPercent.toFixed(1),
            })}
          >
            <span
              className={cn(
                'block h-full rounded-radius-full transition-all',
                durationBarClass,
              )}
              style={{ width: `${durationPercent}%` }}
            />
          </span>
          <span className="flex items-center justify-end gap-space-xs">
            <span className="font-mono text-xs text-fg-muted">
              {formatTraceDuration(span.duration, t)}
            </span>
            {span.children.length ? (
              <span className="shrink-0 rounded-radius-full bg-sunken px-space-xs py-[1px] text-[11px] text-fg-subtle">
                {span.children.length}
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </button>
  )
}
