import { Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  BrandGlyph,
  type BrandGlyphState,
} from '@/components/layout/brand-glyph'
import { useModelIdentity } from '@/components/models/model-identity'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import type { ModelIdentitySnapshot } from '@/lib/model-identity'

export interface AnswerIdentityProps extends ModelIdentitySnapshot {
  /** When the answer was written, as the thread records it (already formatted). */
  time?: string
  /**
   * Set when the product itself answers (Home's direct model chat), not an
   * app, which speaks as itself: the 承 glyph and the product name lead the row.
   */
  speaker?: 'brand'
  /** The glyph's run state, from the answer's phase. */
  glyphState?: BrandGlyphState
  /** Changes as answer text arrives, so a streaming glyph moves with it. */
  glyphPulse?: number
}

/**
 * Who answered, above each answer: the provider's logo and the model name in
 * a pill, then the time. Resolution uses cached model metadata only; an
 * unknown numeric reference never shows, and nothing is invented.
 */
export function AnswerIdentity({
  time,
  speaker,
  glyphState = 'idle',
  glyphPulse,
  ...snapshot
}: AnswerIdentityProps) {
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
      className="flex min-w-0 items-center gap-space-sm text-xs text-fg-subtle"
      data-answer-identity
    >
      {speaker === 'brand' && (
        <span
          className="inline-flex shrink-0 items-center gap-space-xs text-sm font-semibold text-fg"
          data-answer-speaker
        >
          <BrandGlyph
            state={glyphState}
            paint={glyphState === 'idle' ? 'mono' : 'ai'}
            pulse={glyphPulse}
            className="size-[18px]"
          />
          {t('layout.brandName')}
        </span>
      )}
      <span
        className="inline-flex h-7 min-w-0 items-center gap-space-xs rounded-radius-full border border-line-subtle bg-surface ps-0.5 pe-space-sm text-fg"
        data-model-identity
      >
        {identity.provider ? (
          <ProviderLogo provider={identity.provider} size="sm" />
        ) : (
          <span className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-radius-sm bg-sunken text-fg-muted ring-1 ring-line-subtle ring-inset">
            <Bot aria-hidden className="size-icon-xs" />
          </span>
        )}
        <span className="min-w-0 truncate">{label}</span>
      </span>
      {time && <span className="shrink-0 font-mono">{time}</span>}
    </div>
  )
}
