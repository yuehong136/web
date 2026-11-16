import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { EntityAvatar, type EntityAvatarSize } from './entity-avatar'
import type { EntityKind } from './entity-kind'

export interface ResourceAvatar {
  /** Image URL, data URL or bare base64 payload. */
  src?: string | null
  /** Stable tone key, normally the entity id. */
  seed?: string | null
  icon?: ReactNode
  shape?: 'rounded' | 'circle'
  tone?: 'auto' | 'neutral' | 'kind'
  /** Kind glyph in place of the monogram when there is no image. */
  kind?: EntityKind
  /** Corner badge naming the kind (agent, knowledge, …). */
  badge?: EntityKind
}

export interface ResourceSelection {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Accessible label; defaults to "Select {{name}}". */
  label?: string
  disabled?: boolean
}

/** Slots shared by `ResourceRow` and `ResourceCard`. */
export interface ResourceItemProps {
  /** Visible title; also the avatar monogram and default labels. */
  name: string
  description?: ReactNode
  /** Rendered as an `EntityAvatar` at the item's size. */
  avatar?: ResourceAvatar
  /** Non-entity glyph (file type, provider icon) in place of the avatar. */
  leading?: ReactNode
  /** Badge or lozenge describing state. */
  status?: ReactNode
  /** Secondary facts: counts, owner, updated time. */
  meta?: ReactNode
  /** Row/card actions, e.g. an ActionMenu trigger. Always keyboard reachable. */
  actions?: ReactNode
  /** Primary action; makes the name a button. */
  onOpen?: () => void
  selection?: ResourceSelection
  /** Highlights the item as the one shown in an open Inspector. */
  current?: boolean
  className?: string
}

export function ResourceCheckbox({
  name,
  selection,
}: {
  name: string
  selection: ResourceSelection
}) {
  const { t } = useTranslation()
  return (
    <Checkbox
      checked={selection.checked}
      disabled={selection.disabled}
      onCheckedChange={(value) => selection.onCheckedChange(value === true)}
      aria-label={selection.label ?? t('common.patterns.select', { name })}
    />
  )
}

export function ResourceLeading({
  name,
  avatar,
  leading,
  size,
}: Pick<ResourceItemProps, 'name' | 'avatar' | 'leading'> & {
  size: EntityAvatarSize
}) {
  if (leading) return <span className="flex shrink-0">{leading}</span>
  if (!avatar) return null
  return <EntityAvatar name={name} size={size} {...avatar} />
}

/** The title, as a button when the item has a primary action. */
export function ResourceName({
  name,
  onOpen,
  className,
}: {
  name: string
  onOpen?: () => void
  className?: string
}) {
  if (!onOpen)
    return (
      <span data-slot="resource-name" className={cn('truncate', className)}>
        {name}
      </span>
    )
  return (
    <button
      type="button"
      data-slot="resource-name"
      onClick={onOpen}
      className={cn(
        'max-w-full truncate rounded-radius-sm text-left outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus',
        className,
      )}
    >
      {name}
    </button>
  )
}
