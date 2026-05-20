import React, { memo, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { ChevronDown, ChevronUp, FileText, Layers } from 'lucide-react'
import type { ChunkResult } from '@/types/search'

interface SearchChunkListProps {
  chunks: ChunkResult[]
  total: number
  isLoading: boolean
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

const sanitizeContent = (content: string) => {
  return DOMPurify.sanitize(content, {
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
  })
}

const SearchChunkCard: React.FC<{
  chunk: ChunkResult
  index: number
  allChunks: ChunkResult[]
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}> = ({ chunk, index, allChunks, onViewDetail }) => {
  const [expanded, setExpanded] = useState(false)
  const similarity = Math.round((chunk.similarity || 0) * 100)
  const rawContent =
    chunk.highlight || chunk.content_with_weight || chunk.text || ''
  const html = useMemo(() => sanitizeContent(rawContent), [rawContent])
  const longContent = rawContent.length > 400

  return (
    <div className="rounded-radius-xl bg-surface-primary p-space-sm border border-border-default">
      <div className="mb-space-xs flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-radius-md bg-surface-accent-subtle flex h-6 w-6 items-center justify-center text-xs font-medium text-text-accent">
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
          查看详情
        </button>
      </div>

      <div className="mb-space-xs flex items-center gap-2 text-xs text-text-tertiary">
        <span className="rounded-radius-full inline-flex h-1.5 w-16 overflow-hidden bg-background-subtle">
          <span
            className="h-full bg-status-success"
            style={{ width: `${similarity}%` }}
          />
        </span>
        <span>{similarity}%</span>
      </div>

      <div
        className={
          !expanded && longContent
            ? 'line-clamp-5 text-sm leading-relaxed text-text-secondary'
            : 'text-sm leading-relaxed text-text-secondary'
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {longContent ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-space-xs inline-flex items-center gap-1 text-xs text-text-accent hover:underline"
        >
          {expanded ? '收起' : '展开'}
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

const SearchChunkList: React.FC<SearchChunkListProps> = ({
  chunks,
  total,
  isLoading,
  onViewDetail,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-radius-xl bg-surface-primary p-space-sm border border-border-default"
          >
            <div className="rounded-radius-md mb-3 h-4 w-1/3 animate-pulse bg-background-subtle" />
            <div className="rounded-radius-md mb-2 h-3 w-full animate-pulse bg-background-subtle" />
            <div className="rounded-radius-md mb-2 h-3 w-5/6 animate-pulse bg-background-subtle" />
            <div className="rounded-radius-md h-3 w-3/4 animate-pulse bg-background-subtle" />
          </div>
        ))}
      </div>
    )
  }

  if (!chunks.length) {
    return (
      <div className="rounded-radius-xl bg-surface-primary p-space-base border border-border-default text-sm text-text-tertiary">
        没有命中文档片段。可尝试放宽阈值、提高 Top K，或改写问题表述。
      </div>
    )
  }

  return (
    <div>
      <div className="mb-space-xs flex items-center gap-2">
        <Layers className="h-4 w-4 text-text-tertiary" />
        <span className="text-sm font-medium text-text-primary">检索结果</span>
        <span className="text-xs text-text-tertiary">共 {total} 条</span>
      </div>

      <div className="space-y-3">
        {chunks.map((chunk, index) => (
          <SearchChunkCard
            key={chunk.chunk_id || `${chunk.doc_id}-${index}`}
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
