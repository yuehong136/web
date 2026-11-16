import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
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

/**
 * Responsive card grid with the collection gutter; children are
 * `ResourceCard`s. Columns fill the width at ~280px each, so the grid adapts
 * when an Inspector opens beside it.
 */
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
        'grid grid-cols-[repeat(auto-fill,minmax(min(17.5rem,100%),1fr))] gap-space-base p-space-md',
        className,
      )}
    >
      {children}
    </ul>
  )
}

export interface ResourceCardProps extends ResourceItemProps {
  /** Small caption under the name, e.g. the resource type. */
  eyebrow?: ReactNode
  /** Identity chips under the description: model logo, linked knowledge… */
  chips?: ReactNode
}

/**
 * The grid form of `ResourceRow`: same slots, laid out as a 12px-radius card.
 * The whole card opens the item (the name button stretches over it); the
 * checkbox, actions and chips stay separately clickable above it.
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
  chips,
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
          'group/card relative flex h-full min-w-0 flex-col gap-space-sm rounded-radius-xl border p-space-md transition-[background-color,border-color,box-shadow,transform] duration-150',
          selected || current
            ? 'border-state-focus bg-state-selected-bg'
            : 'border-border-subtle bg-background-surface hover:border-border-strong hover:shadow-elevation-medium motion-safe:hover:-translate-y-px',
          className,
        )}
      >
        <div className="flex min-w-0 items-start gap-space-sm">
          {selection ? (
            <div className="relative z-10 flex h-10 items-center">
              <ResourceCheckbox name={name} selection={selection} />
            </div>
          ) : null}
          <ResourceLeading
            name={name}
            avatar={avatar}
            leading={leading}
            size="lg"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-space-2xs pt-space-2xs">
            <h3 className="flex min-w-0 text-sm font-semibold text-text-primary">
              <ResourceName
                name={name}
                onOpen={onOpen}
                className="min-w-0 after:absolute after:inset-0 after:rounded-[inherit] hover:no-underline"
              />
            </h3>
            {eyebrow !== undefined || status !== undefined ? (
              <div className="flex min-w-0 items-center gap-space-sm text-xs text-text-tertiary">
                {eyebrow !== undefined ? (
                  <span className="truncate">{eyebrow}</span>
                ) : null}
                {status !== undefined ? (
                  <span className="relative z-10 flex shrink-0">{status}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div className="relative z-10 flex shrink-0 items-center gap-space-2xs">
              {actions}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="line-clamp-2 min-h-[2lh] text-sm text-text-secondary">
            {description}
          </p>
        ) : null}
        {chips ? (
          <div className="relative z-10 flex min-w-0 flex-wrap items-center gap-space-xs">
            {chips}
          </div>
        ) : null}
        {meta !== undefined ? (
          <div className="mt-auto flex flex-wrap items-center gap-x-space-md gap-y-space-xs border-t border-border-subtle pt-space-sm text-xs text-text-tertiary tabular-nums">
            {meta}
          </div>
        ) : null}
      </article>
    </li>
  )
}

/** A small rounded fact on a card: a provider logo plus model, a count… */
export function ResourceChip({
  icon,
  children,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span
      data-slot="resource-chip"
      className={cn(
        'inline-flex h-5.5 max-w-full min-w-0 items-center gap-space-2xs rounded-full border border-border-subtle bg-background-subtle px-space-sm text-xs text-text-secondary',
        className,
      )}
    >
      {icon ? (
        <span className="flex shrink-0 [&_svg]:size-3">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

export interface ResourceCreateCardProps {
  label: string
  description?: ReactNode
  onClick: () => void
  icon?: ReactNode
}

/** The dashed "new …" card that ends a grid. Hide it in the empty state. */
export function ResourceCreateCard({
  label,
  description,
  onClick,
  icon,
}: ResourceCreateCardProps) {
  return (
    <li data-slot="resource-create-card" className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-space-sm rounded-radius-xl border border-dashed border-border-default p-space-md text-text-tertiary outline-hidden transition-colors hover:border-border-strong hover:bg-state-hover hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-state-focus"
      >
        <span className="flex size-10 items-center justify-center rounded-radius-lg border border-dashed border-border-strong [&_svg]:size-icon-md">
          {icon ?? <Plus aria-hidden />}
        </span>
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description ? <span className="text-xs">{description}</span> : null}
      </button>
    </li>
  )
}
