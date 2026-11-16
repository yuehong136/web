import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useModelIdentity } from '@/components/models/model-identity'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import type { ModelIdentitySnapshot } from '@/lib/model-identity'

export interface AnswerIdentityProps extends ModelIdentitySnapshot {
  /** When the answer was written, as the thread records it (already formatted). */
  time?: string
}

/**
 * Who answered, above each answer: the provider's logo and the model name in
 * a pill, then the time. Resolution uses cached model metadata only; an
 * unknown numeric reference never shows, and nothing is invented.
 */
export function AnswerIdentity({ time, ...snapshot }: AnswerIdentityProps) {
  const { t } = useTranslation()
  const identity = useModelIdentity(snapshot)
  const label =
    identity.label ??
    t(
      snapshot.reference
        ? 'common.modelPicker.savedModel'
        : 'chat.transcript.assistant',
    )
  return (
    <div
      className="flex min-w-0 items-center gap-space-sm text-xs text-text-tertiary"
      data-answer-identity
    >
      <span
        className="inline-flex h-7 min-w-0 items-center gap-space-xs rounded-radius-full border border-border-subtle bg-background-surface ps-0.5 pe-space-sm text-text-primary"
        data-model-identity
      >
        {identity.provider ? (
          <ProviderLogo provider={identity.provider} size="sm" />
        ) : (
          <span className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-radius-sm bg-background-subtle text-text-secondary ring-1 ring-border-subtle ring-inset">
            <Bot aria-hidden className="size-icon-xs" />
          </span>
        )}
        <span className="min-w-0 truncate">{label}</span>
      </span>
      {time && <span className="shrink-0 font-mono">{time}</span>}
    </div>
  )
}
