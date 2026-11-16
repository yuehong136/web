import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'
import { cn } from '@/lib/utils'
import { getCitationNumber, getSourceBadge } from './citation-utils'

const VISIBLE_SOURCES = 3

export interface SourceStripProps {
  /** Every chunk retrieved for this answer. */
  references: ReferenceChunk[]
  /** Chunks the answer cites, in citation order. */
  cited: ReferenceChunk[]
  onOpen: (chunk: ReferenceChunk) => void
  onShowAll: () => void
}

/** One line under an answer: the cited sources, then the rest in the evidence panel. */
export function SourceStrip({
  references,
  cited,
  onOpen,
  onShowAll,
}: SourceStripProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language
  const sources = cited.length ? cited : references
  if (!sources.length) return null
  const visible = sources.slice(0, VISIBLE_SOURCES)
  const hidden = references.length - visible.length
  return (
    <section
      aria-label={t('chat.thread.sources', { count: sources.length })}
      data-source-strip
      className="flex min-w-0 gap-space-sm overflow-x-auto pb-space-2xs"
    >
      {visible.map((chunk) => {
        const number = getCitationNumber(chunk, references)
        const score = readRetrievalScore(chunk.similarity)
        const name = chunk.document_name || t('sources.unknownDocument')
        return (
          <button
            key={`${chunk.dataset_id ?? ''}:${chunk.id}`}
            type="button"
            data-source-chunk={chunk.id}
            aria-label={t('reference.marker.label', { index: number, name })}
            onClick={() => onOpen(chunk)}
            className="flex w-64 max-w-full min-w-0 shrink-0 items-center gap-space-sm rounded-radius-lg border border-border-default bg-background-surface py-space-xs ps-space-xs pe-space-sm text-start transition-colors hover:border-border-strong hover:bg-state-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus"
          >
            <span
              aria-hidden="true"
              className="grid size-icon-2xl shrink-0 place-items-center rounded-radius-md bg-background-subtle font-mono text-xs font-semibold text-text-secondary"
            >
              {getSourceBadge(chunk)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-text-primary">
                {name}
              </span>
              {score !== null && (
                <span className="block text-xs text-text-tertiary">
                  {t('chat.thread.relevance', {
                    score: formatRetrievalScore(score, locale),
                  })}
                </span>
              )}
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-xs text-text-tertiary"
            >
              {number}
            </span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={onShowAll}
        data-source-all
        className={cn(
          'inline-flex shrink-0 items-center gap-space-xs self-center rounded-radius-md px-space-sm py-space-xs text-xs text-text-secondary hover:bg-state-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus',
        )}
      >
        {hidden > 0
          ? t('chat.thread.moreSources', { count: hidden })
          : t('chat.thread.allSources', { count: references.length })}
        <ChevronRight aria-hidden="true" className="size-icon-xs" />
      </button>
    </section>
  )
}
