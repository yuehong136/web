import { useId, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import './runtime-timeline.css'

export type RuntimeTimelineStatus = 'loading' | 'success' | 'error' | 'abort'

export interface RuntimeTimelineItem {
  key: string
  title: ReactNode
  description?: ReactNode
  status: RuntimeTimelineStatus
  /** Pulses the icon while the step runs. */
  blink?: boolean
  icon: ReactNode
  /** Details shown when the step is expanded; without it the step can't expand. */
  content?: ReactNode
  footer?: ReactNode
}

/**
 * A run's steps as a vertical timeline: an icon per step on a connecting
 * line, a title that expands the step's details, and its status and meta.
 * Expansion is controlled by the caller.
 */
export function RuntimeTimeline({
  items,
  expandedKeys,
  onExpand,
  line = 'solid',
  compact = false,
}: {
  items: RuntimeTimelineItem[]
  expandedKeys: string[]
  onExpand: (keys: string[]) => void
  line?: 'solid' | 'dashed'
  compact?: boolean
}) {
  const id = useId()
  return (
    <ol
      className="runtime-timeline"
      data-line={line}
      data-compact={compact || undefined}
    >
      {items.map((item, index) => {
        const open = expandedKeys.includes(item.key)
        const contentId = `${id}-${index}`
        const last = index === items.length - 1
        return (
          <li
            key={item.key}
            className="runtime-timeline-item"
            data-status={item.status}
          >
            <span className="runtime-timeline-rail" aria-hidden="true">
              <span
                className="runtime-timeline-icon"
                data-blink={item.blink || undefined}
              >
                {item.icon}
              </span>
              {!last && <span className="runtime-timeline-line" />}
            </span>
            <div className="min-w-0 flex-1 pb-[var(--runtime-timeline-gap)]">
              {item.content ? (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={contentId}
                  onClick={() =>
                    onExpand(
                      open
                        ? expandedKeys.filter((key) => key !== item.key)
                        : [...expandedKeys, item.key],
                    )
                  }
                  className="flex w-full min-w-0 items-center gap-space-xs rounded-radius-sm text-start outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus"
                >
                  <span className="min-w-0 flex-1">{item.title}</span>
                  <ChevronRight
                    aria-hidden="true"
                    className={cn(
                      'size-icon-sm shrink-0 text-fg-subtle transition-transform duration-(--motion-fast) motion-reduce:transition-none',
                      open && 'rotate-90',
                    )}
                  />
                </button>
              ) : (
                item.title
              )}
              {item.description ? (
                <div className="mt-space-2xs">{item.description}</div>
              ) : null}
              {item.content && open ? (
                <div
                  id={contentId}
                  className={cn(
                    'max-w-full overflow-auto pt-space-sm',
                    compact && 'max-h-80',
                  )}
                >
                  {item.content}
                </div>
              ) : null}
              {item.footer ? (
                <div className="pt-space-xs">{item.footer}</div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
