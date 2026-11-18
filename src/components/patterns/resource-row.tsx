import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  ResourceCheckbox,
  ResourceLeading,
  ResourceName,
  type ResourceItemProps,
} from './resource-parts'
import { useResourceMotion, useResourcePresence } from './resource-presence'

/* Column widths shared by the header and every row so cells line up. */
const STATUS_CELL = 'flex shrink-0 items-center sm:w-28'
const META_CELL =
  'hidden shrink-0 items-center justify-end gap-space-md md:flex md:w-56'
const ACTIONS_CELL =
  'flex min-w-[var(--control-height-sm)] shrink-0 items-center justify-end gap-space-2xs'
const ROW =
  'flex items-center gap-space-base border-b border-line-subtle px-space-md'

export interface ResourceListProps {
  /** Accessible name for the list. */
  label: string
  /** Usually a `ResourceListHeader`. */
  header?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Full-bleed list of keyed `ResourceRow`s; the default collection layout. Rows
 * enter and leave like `ResourceGrid` cards.
 */
export function ResourceList({
  label,
  header,
  children,
  className,
}: ResourceListProps) {
  const items = useResourcePresence(children)
  return (
    <div data-slot="resource-list" className={cn('min-w-0', className)}>
      {header}
      <ul aria-label={label} className="flex flex-col">
        {items}
      </ul>
    </div>
  )
}

export interface ResourceListHeaderProps {
  /** Column caption over the name cell. */
  name: ReactNode
  status?: ReactNode
  meta?: ReactNode
  /** Page-level select-all; preserves selection the caller keeps off-page. */
  selection?: {
    checked: boolean
    indeterminate?: boolean
    onCheckedChange: (checked: boolean) => void
    label: string
  }
  /** Leave room for row avatars so captions line up with names. */
  withAvatar?: boolean
  className?: string
}

/** Caption row aligned with `ResourceRow` cells, with optional select-all. */
export function ResourceListHeader({
  name,
  status,
  meta,
  selection,
  withAvatar = true,
  className,
}: ResourceListHeaderProps) {
  return (
    <div
      data-slot="resource-list-header"
      className={cn(
        ROW,
        'min-h-[var(--control-height-sm)] py-space-xs text-xs font-medium text-fg-subtle',
        className,
      )}
    >
      {selection ? (
        <Checkbox
          aria-label={selection.label}
          checked={selection.checked}
          indeterminate={selection.indeterminate}
          onCheckedChange={(value) => selection.onCheckedChange(value === true)}
        />
      ) : null}
      {withAvatar ? <span aria-hidden="true" className="w-6 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {status !== undefined ? (
        <span className={cn(STATUS_CELL, 'hidden sm:flex')}>{status}</span>
      ) : null}
      {meta !== undefined ? <span className={META_CELL}>{meta}</span> : null}
      <span aria-hidden="true" className={ACTIONS_CELL} />
    </div>
  )
}

export interface ResourceRowProps extends ResourceItemProps {
  /** `hover` reveals actions on hover/focus for fine pointers only. */
  actionsVisibility?: 'always' | 'hover'
  density?: 'default' | 'compact'
}

/**
 * One resource per line: select, avatar, name with its description, status,
 * meta and actions. 44px by default, 36px compact (derived from the control
 * height so density and text size scale it).
 */
export function ResourceRow({
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
  actionsVisibility = 'hover',
  density = 'default',
  className,
}: ResourceRowProps) {
  const selected = selection?.checked ?? false
  const motion = useResourceMotion()
  return (
    <li
      {...motion}
      data-slot="resource-row"
      data-selected={selected || undefined}
      aria-current={current || undefined}
      className={cn(
        ROW,
        'group/row transition-colors hover:bg-fill-hover',
        density === 'compact' ? 'py-space-xs' : 'py-space-sm',
        (selected || current) && 'bg-accent-soft hover:bg-accent-soft',
        className,
      )}
    >
      {selection ? (
        <ResourceCheckbox name={name} selection={selection} />
      ) : null}
      <ResourceLeading
        name={name}
        avatar={avatar}
        leading={leading}
        size="sm"
      />
      <div className="flex min-h-[var(--control-height-sm)] min-w-0 flex-1 items-center gap-space-sm text-sm">
        <ResourceName
          name={name}
          onOpen={onOpen}
          className="min-w-0 font-medium text-fg"
        />
        {description ? (
          <span className="hidden min-w-0 flex-1 truncate text-fg-subtle sm:block">
            {description}
          </span>
        ) : null}
      </div>
      {status !== undefined ? (
        <div className={STATUS_CELL}>{status}</div>
      ) : null}
      {meta !== undefined ? (
        <div className={cn(META_CELL, 'text-xs text-fg-subtle tabular-nums')}>
          {meta}
        </div>
      ) : null}
      <div
        className={cn(
          ACTIONS_CELL,
          actionsVisibility === 'hover' &&
            !selected &&
            !current &&
            'pointer-fine:opacity-0 pointer-fine:group-focus-within/row:opacity-100 pointer-fine:group-hover/row:opacity-100 pointer-fine:has-[[data-state=open]]:opacity-100',
        )}
      >
        {actions}
      </div>
    </li>
  )
}
