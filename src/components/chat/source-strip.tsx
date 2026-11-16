import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'
import { cn } from '@/lib/utils'
import { getCitationNumber } from './citation-utils'
import { toPlainText, truncateText } from './reference-meta'
import { SourceTile } from './source-tile'

const STACKED_TILES = 3
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus'

export interface SourceStripProps {
  /** Every chunk retrieved for this answer. */
  references: ReferenceChunk[]
  /** Chunks the answer cites, in citation order. */
  cited: ReferenceChunk[]
  onOpen: (chunk: ReferenceChunk) => void
  onShowAll: () => void
}

/**
 * One line under an answer: stacked file tiles with “N sources” (expands to
 * the cited sources) and the retrieval count, which opens every chunk in the
 * evidence panel.
 */
export function SourceStrip({
  references,
  cited,
  onOpen,
  onShowAll,
}: SourceStripProps) {
  const { t, i18n } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const locale = i18n.resolvedLanguage ?? i18n.language
  const sources = cited.length ? cited : references
  if (!sources.length) return null
  const sourcesLabel = t('chat.thread.sources', { count: sources.length })
  return (
    <section
      aria-label={sourcesLabel}
      data-source-strip
      className="min-w-0 space-y-space-sm"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-space-base gap-y-space-xs">
        <button
          type="button"
          data-source-toggle
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'inline-flex h-[var(--control-height-sm)] shrink-0 items-center gap-space-sm rounded-radius-full border border-border-default ps-space-xs pe-space-base text-xs text-text-secondary transition-colors hover:bg-state-hover hover:text-text-primary motion-reduce:transition-none',
            FOCUS,
          )}
        >
          {/* Overlapping colour swatches only; the labels would collide. */}
          <span aria-hidden="true" className="flex">
            {sources.slice(0, STACKED_TILES).map((chunk, index) => (
              <SourceTile
                key={`${chunk.dataset_id ?? ''}:${chunk.id}`}
                chunk={chunk}
                size="xs"
                className={cn(
                  'text-transparent ring-2 ring-components-main-workbench-surface',
                  index > 0 && '-ms-space-xs',
                )}
              />
            ))}
          </span>
          {sourcesLabel}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-icon-xs text-text-tertiary transition-transform motion-reduce:transition-none',
              open && 'rotate-180',
            )}
          />
        </button>
        <button
          type="button"
          data-retrieval-summary
          onClick={onShowAll}
          className={cn(
            'min-w-0 rounded-radius-sm text-start text-xs text-text-tertiary hover:text-text-primary',
            FOCUS,
          )}
        >
          {cited.length
            ? t('chat.thread.retrievedCited', {
                count: references.length,
                cited: cited.length,
              })
            : t('chat.thread.retrieved', { count: references.length })}
        </button>
      </div>
      <div id={listId} hidden={!open}>
        {open && (
          <ul className="grid gap-space-2xs sm:grid-cols-2">
            {sources.map((chunk) => {
              const number = getCitationNumber(chunk, references)
              const score = readRetrievalScore(chunk.similarity)
              const name = chunk.document_name || t('sources.unknownDocument')
              return (
                <li key={`${chunk.dataset_id ?? ''}:${chunk.id}`}>
                  <button
                    type="button"
                    data-source-chunk={chunk.id}
                    aria-label={t('reference.marker.label', {
                      index: number,
                      name,
                    })}
                    onClick={() => onOpen(chunk)}
                    className={cn(
                      'flex w-full min-w-0 items-center gap-space-sm rounded-radius-lg border border-transparent px-space-sm py-space-xs text-start transition-colors hover:border-border-subtle hover:bg-state-hover motion-reduce:transition-none',
                      FOCUS,
                    )}
                  >
                    <SourceTile chunk={chunk} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-primary">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-text-tertiary">
                        {score !== null
                          ? t('chat.thread.relevance', {
                              score: formatRetrievalScore(score, locale),
                            })
                          : truncateText(toPlainText(chunk.content), 60)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs text-text-tertiary"
                    >
                      {number}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={onShowAll}
          data-source-all
          className={cn(
            'mt-space-2xs inline-flex items-center gap-space-xs rounded-radius-md px-space-sm py-space-xs text-xs text-text-secondary hover:bg-state-hover hover:text-text-primary',
            FOCUS,
          )}
        >
          {t('chat.thread.allSources', { count: references.length })}
          <ChevronRight aria-hidden="true" className="size-icon-xs" />
        </button>
      </div>
    </section>
  )
}
