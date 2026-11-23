import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The one dot-and-label status: runs, apps, documents, memory entries. Six
 * tones; finished runs read the run-* tokens so a dot means the same in a
 * list, a header and a timeline. `running` is the AI moment, a tide dot with
 * shimmering text. Colour is never the only signal: the label always shows.
 * Badges carry categories; they do not grow a dot variant.
 */
export type StatusDotTone =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  /** An agent at work: the one AI moment a list shows. */
  | 'running'

const DOT: Record<StatusDotTone, string> = {
  success: 'bg-run-succeeded',
  warning: 'bg-warning-fg',
  error: 'bg-run-failed',
  info: 'bg-info-fg',
  neutral: 'bg-run-queued',
  running: 'bg-ai-tide',
}

const LABEL: Record<StatusDotTone, string> = {
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  error: 'text-danger-fg',
  info: 'text-info-fg',
  neutral: 'text-fg-subtle',
  running: 'text-shimmer',
}

/** A 6px status dot with its label. */
export function StatusDot({
  tone,
  label,
  className,
}: {
  tone: StatusDotTone
  label: ReactNode
  className?: string
}) {
  return (
    <span
      data-slot="status-dot"
      data-tone={tone}
      className={cn(
        'inline-flex min-w-0 items-center gap-space-xs text-xs',
        LABEL[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-radius-full', DOT[tone])}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}
