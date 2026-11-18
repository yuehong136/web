import type { ReactNode } from 'react'
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

export type StatusDotTone =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  /** An agent at work: the one AI moment a list shows. */
  | 'running'

const DOT: Record<StatusDotTone, string> = {
  success: 'bg-success-fg',
  warning: 'bg-warning-fg',
  error: 'bg-danger-fg',
  info: 'bg-info-fg',
  neutral: 'bg-fg-subtle',
  running: 'bg-ai-tide',
}

const LABEL: Record<StatusDotTone, string> = {
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  error: 'text-danger-fg',
  info: 'text-info-fg',
  neutral: 'text-fg-subtle',
  running: 'text-shimmer',
}

/** A 6px status dot with its label; colour is never the only signal. */
export function StatusDot({
  tone,
  label,
  className,
}: {
  tone: StatusDotTone
  label: ReactNode
  className?: string
}) {
  return (
    <span
      data-slot="status-dot"
      data-tone={tone}
      className={cn(
        'inline-flex min-w-0 items-center gap-space-xs text-xs',
        LABEL[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-radius-full', DOT[tone])}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}

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
