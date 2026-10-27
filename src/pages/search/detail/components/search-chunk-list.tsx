import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import { useTranslation } from 'react-i18next'
import { memo, useState, type FC } from 'react'
import type { Config } from 'dompurify'
import { ChevronDown, ChevronUp, FileText, Layers } from 'lucide-react'
import { SafeHtml } from '@/components/ui/safe-html'
import type { ChunkResult } from '@/types/search'

interface SearchChunkListProps {
  chunks: ChunkResult[]
  total: number
  isLoading: boolean
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

// 检索高亮/块内容来自文档解析（不可信输入）
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

const SearchChunkCard: FC<{
  chunk: ChunkResult
  index: number
  allChunks: ChunkResult[]
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}> = ({ chunk, index, allChunks, onViewDetail }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const similarity =
    Number.isFinite(chunk.similarity) &&
    chunk.similarity >= 0 &&
    chunk.similarity <= 1
      ? Math.round(chunk.similarity * 100)
      : undefined
  const rawContent =
    chunk.highlight || chunk.content_with_weight || chunk.text || ''
  const longContent = rawContent.length > 400

  return (
    <div className="rounded-radius-xl border border-border-default bg-surface-primary p-space-sm">
      <div className="mb-space-xs flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-radius-md bg-state-selected-bg text-xs font-medium text-state-selected-text">
            {index + 1}
          </span>
          <FileText className="h-3.5 w-3.5 text-text-tertiary" />
          <span className="truncate text-sm font-medium text-text-primary">
            {chunk.docnm_kwd}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onViewDetail(chunk, allChunks)}
          className="text-xs text-text-accent hover:underline"
        >
          {t('searchPage.workspace.details')}
        </button>
      </div>

      <div className="mb-space-xs flex items-center gap-2 text-xs text-text-tertiary">
        <span className="inline-flex h-1.5 w-16 overflow-hidden rounded-radius-full bg-background-subtle">
          <span
            className="h-full bg-status-success"
            style={{
              width: similarity === undefined ? undefined : `${similarity}%`,
            }}
          />
        </span>
        <span>
          {similarity === undefined
            ? t('sources.unavailable')
            : `${similarity}%`}
        </span>
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
      {longContent ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-space-xs inline-flex items-center gap-1 text-xs text-text-accent hover:underline"
        >
          {t(
            expanded
              ? 'searchPage.workspace.collapse'
              : 'searchPage.workspace.expand',
          )}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      ) : null}
    </div>
  )
}

const SearchChunkList: FC<SearchChunkListProps> = ({
  chunks,
  total,
  isLoading,
  onViewDetail,
}) => {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-radius-xl border border-border-default bg-surface-primary p-space-sm"
          >
            <div className="mb-3 h-4 w-1/3 animate-pulse rounded-radius-md bg-background-subtle" />
            <div className="mb-2 h-3 w-full animate-pulse rounded-radius-md bg-background-subtle" />
            <div className="mb-2 h-3 w-5/6 animate-pulse rounded-radius-md bg-background-subtle" />
            <div className="h-3 w-3/4 animate-pulse rounded-radius-md bg-background-subtle" />
          </div>
        ))}
      </div>
    )
  }

  if (!chunks.length) {
    return (
      <div className="rounded-radius-xl border border-border-default bg-surface-primary p-space-base text-sm text-text-tertiary">
        {t('searchPage.workspace.noResults')}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-space-xs flex items-center gap-2">
        <Layers className="h-4 w-4 text-text-tertiary" />
        <span className="text-sm font-medium text-text-primary">
          {t('searchPage.workspace.results')}
        </span>
        <span className="text-xs text-text-tertiary">
          {t('searchPage.workspace.count', { count: total })}
        </span>
      </div>

      <div className="space-y-3">
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
