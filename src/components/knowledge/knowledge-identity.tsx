import { Cpu } from 'lucide-react'
import {
  EntityAvatar,
  type EntityAvatarSize,
} from '@/components/patterns/entity-avatar'
import type { ResourceAvatar } from '@/components/patterns/resource-parts'
import {
  ProviderLogo,
  type ProviderLogoSize,
} from '@/components/patterns/provider-logo'
import { ResourceChip } from '@/components/patterns/resource-card'
import { useModelIdentity } from '@/components/models/model-identity'
import { cn } from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'

type KnowledgeIdentitySource = Pick<KnowledgeBase, 'id' | 'name' | 'avatar'>

/**
 * Avatar props for a knowledge base: its uploaded image, otherwise the
 * knowledge glyph on the knowledge tint, so a base reads the same in the
 * list, the detail panel, settings and pickers.
 */
export function knowledgeAvatar(
  knowledgeBase: Pick<KnowledgeIdentitySource, 'id' | 'avatar'>,
): ResourceAvatar {
  return {
    src: knowledgeBase.avatar,
    seed: knowledgeBase.id,
    kind: 'knowledge',
    tone: 'kind',
  }
}

export function KnowledgeAvatar({
  knowledgeBase,
  size = 'md',
  className,
}: {
  knowledgeBase: KnowledgeIdentitySource
  size?: EntityAvatarSize
  className?: string
}) {
  return (
    <EntityAvatar
      name={knowledgeBase.name}
      size={size}
      className={className}
      {...knowledgeAvatar(knowledgeBase)}
    />
  )
}

/**
 * The embedding model a base indexes with. Resolves through cached model
 * metadata when it is loaded and falls back to the stored `model@provider`
 * reference, so it never fetches on its own.
 */
function useEmbeddingIdentity(modelId?: string | null) {
  const identity = useModelIdentity({ reference: modelId ?? undefined })
  return { provider: identity.provider, label: identity.label ?? modelId }
}

function EmbeddingLogo({
  provider,
  size,
  tile,
}: {
  provider?: string
  size: ProviderLogoSize
  tile: boolean
}) {
  return provider ? (
    <ProviderLogo provider={provider} size={size} tile={tile} />
  ) : (
    <Cpu className="size-icon-xs shrink-0" aria-hidden="true" />
  )
}

/** Provider logo and model name in a text run (detail panel, inspector). */
export function EmbeddingModelLabel({
  modelId,
  size = 'xs',
  tile = false,
  className,
}: {
  modelId?: string | null
  size?: ProviderLogoSize
  /** Seat the logo on its neutral tile (stand-alone rows). */
  tile?: boolean
  className?: string
}) {
  const { provider, label } = useEmbeddingIdentity(modelId)
  if (!modelId) return null
  return (
    <span
      data-slot="embedding-model"
      className={cn(
        'inline-flex min-w-0 items-center gap-space-xs text-xs text-text-tertiary',
        className,
      )}
    >
      <EmbeddingLogo provider={provider} size={size} tile={tile} />
      <span className="truncate" title={modelId}>
        {label}
      </span>
    </span>
  )
}

/** The embedding model as a card chip. */
export function EmbeddingModelChip({ modelId }: { modelId?: string | null }) {
  const { provider, label } = useEmbeddingIdentity(modelId)
  if (!modelId) return null
  return (
    <ResourceChip
      icon={<EmbeddingLogo provider={provider} size="xs" tile={false} />}
    >
      <span title={modelId}>{label}</span>
    </ResourceChip>
  )
}
