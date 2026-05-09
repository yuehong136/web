import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Circle,
  Clock,
  Database,
  GitBranch,
  PlayCircle,
  Search,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  TraceSpanKind,
  TraceSpanStatus,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import { TRACE_SPAN_KIND_LABELS, TRACE_SPAN_STATUS_LABELS } from '../constants'

const KIND_ICON_MAP: Record<TraceSpanKind, typeof GitBranch> = {
  node: GitBranch,
  llm: Bot,
  tool: Wrench,
  retrieval: Search,
  control: GitBranch,
  data: Database,
  webhook: PlayCircle,
  system: Circle,
}

const STATUS_ICON_MAP: Record<TraceSpanStatus, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  running: PlayCircle,
  unknown: Circle,
}

function formatDuration(duration?: number) {
  if (typeof duration !== 'number') {
    return '-'
  }

  return `${duration.toFixed(3)}s`
}

interface TraceSpanRowProps {
  span: TraceSpanViewModel
  selected?: boolean
  onSelect: (spanId: string) => void
}

export function TraceSpanRow({ span, selected, onSelect }: TraceSpanRowProps) {
  const KindIcon = KIND_ICON_MAP[span.kind]
  const StatusIcon = STATUS_ICON_MAP[span.status]

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'gap-space-sm px-space-sm py-space-sm flex w-full min-w-0 items-center border-l-2 text-left transition-colors hover:bg-components-page-toolbar-bg',
        selected
          ? 'border-state-focus bg-components-page-toolbar-bg text-text-primary'
          : 'border-transparent text-text-secondary',
      )}
      onClick={() => onSelect(span.id)}
    >
      <span className="rounded-radius-md bg-surface-primary flex size-8 shrink-0 items-center justify-center border border-border-subtle text-text-tertiary">
        <KindIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="gap-space-xs flex min-w-0 items-center">
          <span className="truncate text-sm font-medium">{span.name}</span>
          <span className="rounded-radius-full px-space-xs shrink-0 border border-border-subtle py-[1px] text-[11px] text-text-tertiary">
            {TRACE_SPAN_KIND_LABELS[span.kind]}
          </span>
        </span>
        <span className="mt-space-2xs gap-space-xs text-text-caption flex min-w-0 items-center text-xs">
          <StatusIcon
            className={cn(
              'size-3 shrink-0',
              span.status === 'error'
                ? 'text-status-error'
                : span.status === 'success'
                  ? 'text-status-success'
                  : span.status === 'running'
                    ? 'text-status-warning'
                    : 'text-text-caption',
            )}
          />
          <span>{TRACE_SPAN_STATUS_LABELS[span.status]}</span>
          <Clock className="size-3 shrink-0" />
          <span className="font-mono">{formatDuration(span.duration)}</span>
        </span>
      </span>
      {span.children.length ? (
        <span className="rounded-radius-full bg-surface-secondary px-space-xs text-text-caption shrink-0 py-[1px] text-[11px]">
          {span.children.length}
        </span>
      ) : null}
    </button>
  )
}
