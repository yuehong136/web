import { useTranslation } from 'react-i18next'
import { Cpu } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import type { EntityKind } from '@/components/patterns/entity-kind'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { ResourceChip } from '@/components/patterns/resource-card'
import { useModelIdentity } from '@/components/models/model-identity'
import { cn } from '@/lib/utils'

/**
 * Identity pieces shared by the collection pages (Studio apps, agents, search
 * apps, memory banks, skills and run logs): status dots, model chips and the
 * kind tiles used as first-use art.
 */

// The status dot is a shared pattern now; kept here for existing imports.
export { StatusDot, type StatusDotTone } from '@/components/patterns/status-dot'

/**
 * Provider logo plus model name for a stored model reference
 * (`name@provider`). Resolves from cached provider metadata only.
 */
export function ModelChip({ reference }: { reference?: string | null }) {
  const { t } = useTranslation()
  const identity = useModelIdentity({ reference: reference || undefined })
  if (!reference) return null
  return (
    <ResourceChip
      icon={
        identity.provider ? (
          <ProviderLogo provider={identity.provider} size="xs" tile={false} />
        ) : (
          <Cpu aria-hidden="true" />
        )
      }
    >
      {identity.label ?? t('common.modelPicker.savedModel')}
    </ResourceChip>
  )
}

/**
 * Three kind tiles fanned out, the first-use art for collections of apps,
 * agents and other entities. Decorative only.
 */
export function KindStackIllustration({
  kinds,
  className,
}: {
  /** Left, centre and right tiles. */
  kinds: [EntityKind, EntityKind, EntityKind]
  className?: string
}) {
  const [left, centre, right] = kinds
  return (
    <div aria-hidden="true" className={cn('relative h-24 w-44', className)}>
      <EntityAvatar
        kind={left}
        tone="kind"
        size="xl"
        className="absolute top-7 left-5 -rotate-10"
      />
      <EntityAvatar
        kind={right}
        tone="kind"
        size="xl"
        className="absolute top-7 right-5 rotate-10"
      />
      <EntityAvatar
        kind={centre}
        tone="kind"
        size="2xl"
        className="absolute top-1 left-1/2 -translate-x-1/2 shadow-elevation-medium"
      />
    </div>
  )
}
