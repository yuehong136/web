import { cn } from '@/lib/utils'
import { Operator } from '@/pages/agent/constant'
import OperatorIcon from '@/pages/agent/operator-icon'
import type {
  TraceSpanKind,
  TraceSpanStatus,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import { TRACE_SPAN_KIND_LABELS, TRACE_SPAN_STATUS_LABELS } from '../constants'
import { formatTraceDuration, getTraceDurationPercent } from '../utils'

const STATUS_DOT_CLASSES: Record<TraceSpanStatus, string> = {
  success: 'bg-status-success',
  error: 'bg-status-error',
  running: 'bg-status-warning',
  unknown: 'bg-text-caption',
}

const KIND_TONE_CLASSES: Record<TraceSpanKind, string> = {
  node: 'text-text-tertiary bg-surface-secondary',
  llm: 'text-status-info bg-status-info-subtle',
  tool: 'text-status-warning bg-status-warning-subtle',
  retrieval: 'text-status-success bg-status-success-subtle',
  control: 'text-text-secondary bg-surface-secondary',
  data: 'text-status-info bg-status-info-subtle',
  webhook: 'text-status-warning bg-status-warning-subtle',
  system: 'text-text-tertiary bg-surface-secondary',
}

const KIND_BAR_CLASSES: Record<TraceSpanKind, string> = {
  node: 'bg-text-caption',
  llm: 'bg-status-info',
  tool: 'bg-status-warning',
  retrieval: 'bg-status-success',
  control: 'bg-text-secondary',
  data: 'bg-status-info',
  webhook: 'bg-status-warning',
  system: 'bg-text-caption',
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
  const operatorName = resolveTraceOperatorName(span)
  const depthPadding =
    depth === 0 ? 'pl-space-xs' : depth === 1 ? 'pl-space-md' : 'pl-space-lg'
  const durationPercent = getTraceDurationPercent(span.duration, totalDuration)
  const durationBarClass =
    span.status === 'error'
      ? 'bg-status-error'
      : span.status === 'running'
        ? 'bg-status-warning'
        : KIND_BAR_CLASSES[span.kind]

  return (
    <button
      type="button"
      aria-label={`查看节点 ${span.name || span.id}`}
      aria-pressed={selected}
      className={cn(
        'group grid w-full min-w-0 grid-cols-[32px_minmax(0,1fr)] pr-space-sm text-left text-text-secondary transition-colors',
        depthPadding,
      )}
      onClick={() => onSelect(span.id)}
    >
      <span className="relative flex min-h-[58px] justify-center">
        <span
          className={cn(
            'absolute top-0 w-px bg-border-subtle',
            isLast ? 'h-space-base' : 'bottom-0',
          )}
        />
        <span
          className={cn(
            'z-10 mt-space-base h-2 w-2 shrink-0 rounded-radius-full ring-4 ring-components-console-surface transition-colors',
            selected ? 'bg-state-focus' : STATUS_DOT_CLASSES[span.status],
          )}
        />
      </span>
      <span
        className={cn(
          'my-space-xs min-w-0 rounded-radius-md px-space-sm py-space-sm transition-colors',
          selected
            ? 'bg-components-page-toolbar-bg text-text-primary'
            : 'group-hover:bg-components-page-toolbar-bg',
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
                <span className="shrink-0 rounded-radius-full border border-border-subtle px-space-xs py-[1px] text-[11px] text-text-tertiary">
                  {TRACE_SPAN_KIND_LABELS[span.kind]}
                </span>
              </span>
              <span className="mt-space-xs flex min-w-0 items-center gap-space-xs text-xs text-text-caption">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-radius-full',
                    STATUS_DOT_CLASSES[span.status],
                  )}
                />
                <span>{TRACE_SPAN_STATUS_LABELS[span.status]}</span>
              </span>
            </span>
          </span>
          <span
            className="block h-2 min-w-0 overflow-hidden rounded-radius-full bg-surface-secondary"
            aria-label={`耗时占比 ${durationPercent.toFixed(1)}%`}
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
            <span className="font-mono text-xs text-text-secondary">
              {formatTraceDuration(span.duration)}
            </span>
            {span.children.length ? (
              <span className="shrink-0 rounded-radius-full bg-surface-secondary px-space-xs py-[1px] text-[11px] text-text-caption">
                {span.children.length}
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </button>
  )
}
