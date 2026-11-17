import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type InlineStatTone =
  'default' | 'success' | 'warning' | 'error' | 'info'

export interface InlineStat {
  /** Stable React key; defaults to the item index. */
  key?: string
  label: ReactNode
  value: ReactNode
  /** Adds a status dot. The label still carries the meaning on its own. */
  tone?: InlineStatTone
}

export interface InlineStatsProps extends HTMLAttributes<HTMLDListElement> {
  items: InlineStat[]
}

const DOTS: Record<Exclude<InlineStatTone, 'default'>, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  info: 'bg-status-info',
}

/**
 * One quiet line of figures under a page title ("Published 4 · Drafts 2"),
 * replacing rows of stat cards. Only show figures that are true for the whole
 * collection; page-scoped sums belong next to the pager, not here.
 */
export function InlineStats({ items, className, ...props }: InlineStatsProps) {
  if (!items.length) return null
  return (
    <dl
      data-slot="inline-stats"
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-x-space-md gap-y-space-2xs text-xs text-text-tertiary',
        className,
      )}
      {...props}
    >
      {items.map((item, index) => (
        <div
          key={item.key ?? index}
          className="inline-flex min-w-0 items-center gap-space-xs"
        >
          {item.tone && item.tone !== 'default' ? (
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 shrink-0 rounded-radius-full',
                DOTS[item.tone],
              )}
            />
          ) : null}
          <dt className="truncate">{item.label}</dt>
          <dd className="font-medium text-text-secondary tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
