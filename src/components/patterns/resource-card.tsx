import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  ResourceCheckbox,
  ResourceLeading,
  ResourceName,
  type ResourceItemProps,
} from './resource-parts'

export interface ResourceGridProps {
  /** Accessible name for the grid list. */
  label: string
  children: ReactNode
  className?: string
}

/** Responsive card grid with the collection gutter; children are `ResourceCard`s. */
export function ResourceGrid({
  label,
  children,
  className,
}: ResourceGridProps) {
  return (
    <ul
      aria-label={label}
      data-slot="resource-grid"
      className={cn(
        'grid grid-cols-1 gap-space-base p-space-md sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </ul>
  )
}

export interface ResourceCardProps extends ResourceItemProps {
  /** Small caption above the name, e.g. the resource type. */
  eyebrow?: ReactNode
}

/**
 * The grid form of `ResourceRow`: same slots, laid out as a 12px-radius card.
 * Selection and actions sit in the top row; meta sits on a hairline footer.
 */
export function ResourceCard({
  name,
  description,
  avatar,
  leading,
  status,
  meta,
  actions,
  onOpen,
  selection,
  current = false,
  eyebrow,
  className,
}: ResourceCardProps) {
  const selected = selection?.checked ?? false
  return (
    <li
      data-slot="resource-card"
      data-selected={selected || undefined}
      aria-current={current || undefined}
      className="min-w-0"
    >
      <article
        className={cn(
          'flex h-full min-w-0 flex-col gap-space-sm rounded-radius-xl border p-space-md transition-colors',
          selected || current
            ? 'border-state-focus bg-state-selected-bg'
            : 'border-border-default bg-background-surface hover:border-border-strong',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-space-sm">
          {selection ? (
            <ResourceCheckbox name={name} selection={selection} />
          ) : null}
          <ResourceLeading
            name={name}
            avatar={avatar}
            leading={leading}
            size="md"
          />
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="truncate text-xs text-text-tertiary">{eyebrow}</p>
            ) : null}
            <h3 className="flex min-w-0 text-sm font-semibold text-text-primary">
              <ResourceName name={name} onOpen={onOpen} className="min-w-0" />
            </h3>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-space-2xs">
              {actions}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="line-clamp-2 text-sm text-text-secondary">
            {description}
          </p>
        ) : null}
        {status !== undefined ? <div className="flex">{status}</div> : null}
        {meta !== undefined ? (
          <div className="mt-auto flex flex-wrap items-center gap-x-space-md gap-y-space-xs border-t border-border-subtle pt-space-sm text-xs text-text-tertiary tabular-nums">
            {meta}
          </div>
        ) : null}
      </article>
    </li>
  )
}
