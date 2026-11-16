import { EntityAvatar } from '@/components/patterns/entity-avatar'
import {
  ENTITY_KIND_ICON,
  type EntityKind,
} from '@/components/patterns/entity-kind'
import { resolveLocalizedText } from '@/lib/agent'
import { cn } from '@/lib/utils'
import { AgentCanvasType, type AgentTemplate } from '@/types/agent'
import { getCategory, normalizeCategoryKey } from './template-category-config'
import { resolveTemplateKind } from './template-create-dialog'

const SIZES = {
  md: 'size-9 rounded-radius-lg [&>svg]:size-4.5',
  lg: 'size-10 rounded-radius-lg [&>svg]:size-5',
} as const

/** What a template creates: an agent or an ingestion pipeline. */
export function templateEntityKind(template: AgentTemplate): EntityKind {
  return resolveTemplateKind(template) === AgentCanvasType.PIPELINE
    ? 'workflow'
    : 'agent'
}

/**
 * A template's identity: its own image when it has one, otherwise the
 * category glyph on the category colour. The corner badge names the kind.
 */
export function TemplateTile({
  template,
  size = 'lg',
}: {
  template: AgentTemplate
  size?: keyof typeof SIZES
}) {
  const kind = templateEntityKind(template)
  if (template.avatar)
    return (
      <EntityAvatar
        name={resolveLocalizedText(template.title, '')}
        src={template.avatar}
        seed={template.id}
        size={size === 'lg' ? 'lg' : 'md'}
        badge={kind}
      />
    )
  const category = getCategory(normalizeCategoryKey(template.canvas_type))
  const Icon = category.icon
  const KindIcon = ENTITY_KIND_ICON[kind]
  return (
    <span
      aria-hidden="true"
      data-slot="template-tile"
      className="relative inline-flex shrink-0"
    >
      <span
        className={cn(
          'flex items-center justify-center ring-1 ring-border-subtle ring-inset',
          SIZES[size],
          category.tone,
        )}
      >
        <Icon />
      </span>
      <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-radius-sm bg-components-avatar-7-bg text-components-avatar-7-text ring-2 ring-background-surface [&>svg]:size-2.5">
        <KindIcon />
      </span>
    </span>
  )
}

/** The category name with its colour, for a card's chip row. */
export function TemplateCategoryMark({
  template,
  label,
}: {
  template: AgentTemplate
  label: string
}) {
  const category = getCategory(normalizeCategoryKey(template.canvas_type))
  const Icon = category.icon
  return (
    <span
      data-slot="template-category"
      className="inline-flex h-5.5 max-w-full min-w-0 items-center gap-space-xs rounded-radius-full border border-border-subtle bg-background-subtle pr-space-sm pl-space-2xs text-xs text-text-secondary"
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-radius-sm [&>svg]:size-2.5',
          category.tone,
        )}
      >
        <Icon />
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}
