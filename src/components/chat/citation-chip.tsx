import { useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Copy, ExternalLink } from 'lucide-react'
import type { Config } from 'dompurify'
import { useTranslation } from 'react-i18next'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SafeHtml } from '@/components/ui/safe-html'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { getChunkByRefId } from '@/utils/reference-utils'
import { ReferenceMetadataBadges } from './reference-metadata-badges'
import {
  getOriginalSource,
  getOriginalSourceLink,
  toPlainText,
  truncateText,
} from './reference-meta'
import {
  getCitationNumber,
  getSourceTitle,
  parseCitationIds,
} from './citation-utils'
import { SourceTile } from './source-tile'
import { useHoverPopover } from './use-hover-popover'

// Table chunks preview as a small table (parsed document content: untrusted).
const TABLE_PREVIEW_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'br'],
  ALLOWED_ATTR: ['rowspan', 'colspan', 'class'],
}
const ICON_BUTTON =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-radius-md text-text-tertiary transition-colors hover:bg-state-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-state-focus disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none'

export interface CitationActions {
  /** Open the chunk in the evidence panel (or the caller's detail sheet). */
  onViewDetail?: (chunk: ReferenceChunk) => void
  onCopy?: (text: string) => void
}

interface CitationCardProps extends CitationActions {
  chunk: ReferenceChunk
  references: ReferenceChunk[]
  position: number
  count: number
  onStep: (delta: number) => void
}

/** The hover preview: file, title, score, passage, where it sits, and the way to the panel. */
function CitationCard({
  chunk,
  references,
  position,
  count,
  onStep,
  onCopy,
  onViewDetail,
}: CitationCardProps) {
  const { t, i18n } = useTranslation()
  const name = chunk.document_name || t('sources.unknownDocument')
  const score = readRetrievalScore(chunk.similarity)
  const original = getOriginalSource(chunk)
  const link = original && getOriginalSourceLink(original)
  const isTable =
    chunk.doc_type === 'table' && Boolean(chunk.content?.includes('<table'))
  const location = [
    t('chat.aiWorkspace.sourceNumber', {
      number: getCitationNumber(chunk, references),
    }),
    chunk.doc_type === 'table' || chunk.doc_type === 'image'
      ? t(`reference.docType.${chunk.doc_type}`)
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const text = toPlainText(chunk.content)
  return (
    <div className="flex flex-col gap-space-sm" data-citation-card={chunk.id}>
      <div className="flex min-w-0 items-center gap-space-sm">
        <SourceTile chunk={chunk} size="sm" />
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary"
          title={name}
        >
          {name}
        </span>
        {score !== null && (
          <span className="shrink-0 font-mono text-xs text-text-tertiary tabular-nums">
            <span className="sr-only">{t('chat.citation.relevance')} </span>
            {formatRetrievalScore(
              score,
              i18n.resolvedLanguage ?? i18n.language,
            )}
          </span>
        )}
      </div>
      {isTable ? (
        <SafeHtml
          className="max-h-32 overflow-auto rounded-radius-md bg-background-subtle p-space-sm text-xs text-text-primary"
          html={chunk.content || ''}
          options={TABLE_PREVIEW_PURIFY_OPTIONS}
        />
      ) : (
        <p className="m-0 line-clamp-4 text-xs leading-relaxed text-text-secondary">
          {text ? truncateText(text, 200) : t('sources.noContent')}
        </p>
      )}
      <ReferenceMetadataBadges metadata={chunk.document_metadata} />
      <div className="-mb-space-xs flex min-w-0 items-center gap-space-2xs text-xs text-text-tertiary">
        {count > 1 && (
          <span className="flex shrink-0 items-center">
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label={t('chat.citation.previous')}
              title={t('chat.citation.previous')}
              disabled={position === 0}
              onClick={() => onStep(-1)}
            >
              <ChevronLeft aria-hidden className="size-icon-sm" />
            </button>
            <span className="font-mono tabular-nums" aria-live="polite">
              {position + 1}/{count}
            </span>
            <button
              type="button"
              className={ICON_BUTTON}
              aria-label={t('chat.citation.next')}
              title={t('chat.citation.next')}
              disabled={position === count - 1}
              onClick={() => onStep(1)}
            >
              <ChevronRight aria-hidden className="size-icon-sm" />
            </button>
          </span>
        )}
        <span className="min-w-0 truncate">{location}</span>
        <span className="flex-1" />
        <button
          type="button"
          className={ICON_BUTTON}
          aria-label={t('sources.copy')}
          title={t('sources.copy')}
          disabled={!text}
          onClick={() => onCopy?.(text)}
        >
          <Copy aria-hidden className="size-icon-sm" />
        </button>
        {link && (
          <a
            className={ICON_BUTTON}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(link.labelKey)}
            title={t(link.hintKey)}
          >
            <ExternalLink aria-hidden className="size-icon-sm" />
          </a>
        )}
        <button
          type="button"
          data-reference-details
          className="shrink-0 rounded-radius-sm px-space-xs py-space-2xs font-medium text-text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-state-focus"
          onClick={() => onViewDetail?.(chunk)}
        >
          {t('chat.citation.viewInPanel')}
        </button>
      </div>
    </div>
  )
}

export interface CitationChipProps extends CitationActions {
  /** The cited chunks, deduplicated, in citation order (at least one). */
  chunks: ReferenceChunk[]
  references: ReferenceChunk[]
}

/**
 * An inline citation: file tile, document name and “+N” for citations written
 * back to back. Hover (mouse) previews the card; click or Enter opens it.
 */
export function CitationChip({
  chunks,
  references,
  onViewDetail,
  onCopy,
}: CitationChipProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, hoverProps, preventHoverFocus } =
    useHoverPopover()
  const [position, setPosition] = useState(0)
  const trigger = useRef<HTMLButtonElement>(null)
  const first = chunks[0]
  const name = first.document_name || t('sources.unknownDocument')
  const numbers = chunks.map((chunk) => getCitationNumber(chunk, references))
  const single = t('reference.marker.label', { index: numbers[0], name })
  const label =
    chunks.length > 1
      ? t('chat.citation.groupLabel', {
          label: single,
          count: chunks.length - 1,
        })
      : single
  // Every opening starts at the first source, however the card was closed.
  if (!open && position !== 0) setPosition(0)
  const current = chunks[Math.min(position, chunks.length - 1)]
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <sup className="citation-chip-anchor">
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            type="button"
            aria-label={label}
            data-citation-chip
            data-citation-number={numbers.join(',')}
            {...hoverProps}
            className={cn(
              'citation-chip inline-flex h-5 max-w-full cursor-pointer items-center gap-space-xs rounded-radius-full border border-border-subtle bg-background-subtle ps-0.5 pe-space-sm align-baseline text-xs leading-none font-normal text-text-secondary',
              'transition-colors hover:border-border-accent hover:text-text-primary motion-reduce:transition-none',
              'aria-expanded:border-border-accent aria-expanded:bg-state-selected-bg aria-expanded:text-text-primary',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-state-focus',
            )}
          >
            <SourceTile chunk={first} size="xs" className="rounded-full" />
            <span className="max-w-40 min-w-0 truncate">
              {getSourceTitle(name)}
            </span>
            {chunks.length > 1 && (
              <span className="font-mono text-text-tertiary">
                +{chunks.length - 1}
              </span>
            )}
          </button>
        </PopoverTrigger>
      </sup>
      <PopoverContent
        aria-label={label}
        className="w-80 max-w-[calc(100vw-2rem)] rounded-radius-lg p-space-base"
        align="start"
        sideOffset={8}
        {...hoverProps}
        onOpenAutoFocus={preventHoverFocus}
      >
        <CitationCard
          chunk={current}
          references={references}
          position={position}
          count={chunks.length}
          onStep={(delta) =>
            setPosition((value) =>
              Math.max(0, Math.min(chunks.length - 1, value + delta)),
            )
          }
          onCopy={onCopy}
          onViewDetail={(chunk) => {
            onOpenChange(false)
            trigger.current?.focus({ preventScroll: true })
            onViewDetail?.(chunk)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * The `sup` renderer for XMarkdown: `<sup>3</sup>` or a grouped `<sup>1,2</sup>`
 * becomes a chip. Ids no chunk answers to stay plain superscripts, numbered
 * like the chips (id + 1), so protocol text never shows and nothing points
 * at the wrong chunk.
 */
export function createCitationChipComponent(
  references: ReferenceChunk[],
  actions: CitationActions,
) {
  return function CitationSup({ children }: { children?: ReactNode }) {
    const ids = parseCitationIds(String(children ?? ''))
    if (!ids) return <sup>{children}</sup>
    const chunks = [
      ...new Set(ids.flatMap((id) => getChunkByRefId(id, references) ?? [])),
    ]
    if (!chunks.length)
      return (
        <sup className="mx-space-2xs inline-flex h-icon-sm min-w-icon-sm items-center justify-center rounded-radius-sm bg-background-subtle px-space-xs font-mono text-xs font-medium text-text-tertiary">
          {ids.map((id) => Number(id) + 1).join(',')}
        </sup>
      )
    return <CitationChip chunks={chunks} references={references} {...actions} />
  }
}
