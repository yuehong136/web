import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext } from 'react-router-dom'
import { Cpu, LockKeyhole } from 'lucide-react'
import {
  EntityAvatar,
  type EntityAvatarSize,
} from '@/components/patterns/entity-avatar'
import type { PageTitleCrumb } from '@/components/patterns/page-title-bar'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { useModelIdentity } from '@/components/models/model-identity'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import type { Memory } from '@/types/memory'

export interface MemoryDetailOutletContext {
  /** True when the shell's secondary panel lists the sections and the way back. */
  navigationManaged: boolean
}

/**
 * The crumbs before a memory section title: the bank's name, plus the list
 * when no shell panel offers the way back. `nameTo` links the name back to
 * the workspace from other sections.
 */
export function useMemoryCrumbs(
  memory: Memory | undefined,
  nameTo?: string,
): PageTitleCrumb[] {
  const { t } = useTranslation()
  const context = useOutletContext<MemoryDetailOutletContext | undefined>()
  const name: PageTitleCrumb = {
    label: memory?.name || t('memory.common.loading'),
    to: memory ? nameTo : undefined,
  }
  return context?.navigationManaged
    ? [name]
    : [{ label: t('memory.common.allMemories'), to: ROUTES.MEMORY }, name]
}

/** A memory bank's uploaded avatar, otherwise the memory glyph on its tint. */
export function MemoryAvatar({
  memory,
  memoryId,
  size = 'md',
  className,
}: {
  memory?: Pick<Memory, 'id' | 'name' | 'avatar'>
  memoryId?: string
  size?: EntityAvatarSize
  className?: string
}) {
  return (
    <EntityAvatar
      name={memory?.name}
      src={memory?.avatar}
      seed={memory?.id ?? memoryId}
      kind="memory"
      tone="kind"
      size={size}
      className={className}
    />
  )
}

/** Provider logo and model name for a stored `name@provider` reference. */
export function MemoryModelLabel({
  reference,
  className,
}: {
  reference?: string | null
  className?: string
}) {
  const { t } = useTranslation()
  const identity = useModelIdentity({ reference: reference || undefined })
  if (!reference) return null
  return (
    <span
      data-slot="memory-model"
      className={cn('inline-flex min-w-0 items-center gap-space-xs', className)}
    >
      {identity.provider ? (
        <ProviderLogo provider={identity.provider} size="xs" tile={false} />
      ) : (
        <Cpu aria-hidden="true" className="size-icon-xs shrink-0" />
      )}
      <span className="truncate" title={reference}>
        {identity.label ?? t('common.modelPicker.savedModel')}
      </span>
    </span>
  )
}

/**
 * One quiet line under the title: the extraction model, memory types and
 * storage, separated by dots.
 */
export function MemoryIdentityMeta({ memory }: { memory?: Memory }) {
  const { t } = useTranslation()
  if (!memory) return null
  const parts: { key: string; node: ReactNode }[] = []
  if (memory.llm_id)
    parts.push({
      key: 'model',
      node: <MemoryModelLabel reference={memory.llm_id} />,
    })
  if (memory.memory_type?.length)
    parts.push({
      key: 'types',
      node: (
        <span className="truncate">
          {memory.memory_type
            .map((type) => t(`memory.filters.${type}`, type))
            .join(t('memory.detail.listSeparator'))}
        </span>
      ),
    })
  parts.push({
    key: 'storage',
    node: (
      <span className="shrink-0">
        {t(
          memory.storage_type === 'graph'
            ? 'memory.fields.graph'
            : 'memory.fields.table',
        )}
      </span>
    ),
  })
  return (
    <p
      data-slot="memory-identity-meta"
      className="flex min-w-0 items-center gap-space-xs text-xs text-fg-subtle"
    >
      {parts.map((part, index) => (
        <Fragment key={part.key}>
          {index > 0 && <span aria-hidden="true">·</span>}
          {part.node}
        </Fragment>
      ))}
    </p>
  )
}

/**
 * A model that cannot be changed here, as an identity row: the provider logo
 * on its tile, the model name, its stored reference and why it is locked.
 */
export function MemoryModelRow({
  reference,
  hint,
}: {
  reference?: string | null
  hint: string
}) {
  const { t } = useTranslation()
  const identity = useModelIdentity({ reference: reference || undefined })
  return (
    <div
      data-slot="memory-model-row"
      className="flex min-w-0 items-center gap-space-sm rounded-radius-lg border border-line-subtle bg-sunken px-space-sm py-space-xs"
    >
      {identity.provider ? (
        <ProviderLogo provider={identity.provider} size="md" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-radius-md bg-surface text-fg-subtle ring-1 ring-line-subtle ring-inset">
          <Cpu aria-hidden="true" className="size-icon-sm" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-fg">
          {reference
            ? (identity.label ?? t('common.modelPicker.savedModel'))
            : t('memory.detail.noModel')}
        </span>
        {reference ? (
          <span className="truncate font-mono text-xs text-fg-subtle">
            {reference}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-space-xs text-xs text-fg-subtle">
        <LockKeyhole aria-hidden="true" className="size-icon-xs" />
        <span className="hidden sm:inline">{hint}</span>
        <span className="sr-only sm:hidden">{hint}</span>
      </span>
    </div>
  )
}
