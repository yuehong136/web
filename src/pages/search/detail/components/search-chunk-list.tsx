import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import { useTranslation } from 'react-i18next'
import { memo, useState, type FC } from 'react'
import type { Config } from 'dompurify'
import { ChevronDown, ChevronUp, Layers, PanelRight } from 'lucide-react'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import { SafeHtml } from '@/components/ui/safe-html'
import type { ChunkResult } from '@/types/search'
import { SearchScoreBars } from './search-score-bars'

interface SearchChunkListProps {
  chunks: ChunkResult[]
  isLoading: boolean
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

// Highlights and passage text come from document parsing: untrusted input.
const CHUNK_HIGHLIGHT_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: [
    'mark',
    'b',
    'strong',
    'i',
    'em',
    'p',
    'br',
    'span',
    'code',
    'pre',
  ],
  ALLOWED_ATTR: ['class'],
}

/** One retrieved passage: rank, scores, the matched text and its file. */
const SearchChunkCard: FC<{
  chunk: ChunkResult
  index: number
  allChunks: ChunkResult[]
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}> = ({ chunk, index, allChunks, onViewDetail }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const rawContent =
    chunk.highlight || chunk.content_with_weight || chunk.text || ''
  const longContent = rawContent.length > 400
  const documentName =
    chunk.docnm_kwd || t('searchPage.workspace.mapUntitledDocument')

  return (
    <article className="flex flex-col gap-space-sm rounded-radius-xl border border-border-subtle bg-background-surface p-space-base transition-colors hover:border-border-strong">
      <div className="flex flex-wrap items-start justify-between gap-space-base">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-radius-md bg-background-subtle font-mono text-xs font-semibold text-text-primary">
            {index + 1}
          </span>
          <FileKindTile name={documentName} size="sm" />
          <span
            className="min-w-0 truncate text-sm font-medium text-text-primary"
            title={documentName}
          >
            {documentName}
          </span>
        </div>
        <SearchScoreBars chunk={chunk} />
      </div>

      <SafeHtml
        className={
          !expanded && longContent
            ? 'line-clamp-5 text-sm leading-relaxed text-text-secondary'
            : 'text-sm leading-relaxed text-text-secondary'
        }
        html={rawContent}
        options={CHUNK_HIGHLIGHT_PURIFY_OPTIONS}
      />

      <ReferenceMetadataBadges metadata={chunk.document_metadata} />
      <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-border-subtle pt-space-sm">
        {longContent ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-space-2xs rounded-radius-sm text-xs text-text-accent outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
          >
            {t(
              expanded
                ? 'searchPage.workspace.collapse'
                : 'searchPage.workspace.expand',
            )}
            {expanded ? (
              <ChevronUp className="size-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3" aria-hidden="true" />
            )}
          </button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="ms-auto shrink-0 text-xs"
          onClick={() => onViewDetail(chunk, allChunks)}
        >
          <PanelRight className="size-icon-sm" aria-hidden="true" />
          {t('searchPage.workspace.details')}
        </Button>
      </div>
    </article>
  )
}

const SearchChunkList: FC<SearchChunkListProps> = ({
  chunks,
  isLoading,
  onViewDetail,
}) => {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <div className="space-y-space-sm" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-space-sm rounded-radius-xl border border-border-subtle bg-background-surface p-space-base"
          >
            <div className="flex items-center gap-space-sm">
              <div className="size-7 animate-pulse rounded-radius-md bg-background-subtle motion-reduce:animate-none" />
              <div className="h-4 w-1/3 animate-pulse rounded-radius-md bg-background-subtle motion-reduce:animate-none" />
            </div>
            <div className="h-3 w-full animate-pulse rounded-radius-md bg-background-subtle motion-reduce:animate-none" />
            <div className="h-3 w-5/6 animate-pulse rounded-radius-md bg-background-subtle motion-reduce:animate-none" />
            <div className="h-3 w-3/4 animate-pulse rounded-radius-md bg-background-subtle motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    )
  }

  if (!chunks.length) {
    return (
      <p className="rounded-radius-xl border border-dashed border-border-default bg-background-subtle p-space-base text-sm text-text-secondary">
        {t('searchPage.workspace.noResults')}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-space-sm flex items-center gap-space-xs">
        <Layers
          className="size-icon-sm text-text-tertiary"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-text-primary">
          {t('searchPage.workspace.results')}
        </span>
        <span className="text-xs text-text-tertiary">
          {t('searchPage.workspace.count', { count: chunks.length })}
        </span>
      </div>

      <div className="space-y-space-sm">
        {chunks.map((chunk, index) => (
          <SearchChunkCard
            key={`${chunk.chunk_id || chunk.doc_id || 'chunk'}-${index}`}
            chunk={chunk}
            index={index}
            allChunks={chunks}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(SearchChunkList)
