import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  markdownConfig,
  mergeMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import { Sparkles } from 'lucide-react'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { RetrievalProgress } from '@/components/chat/retrieval-progress'
import { ThinkWrapper } from '@/components/chat/ThinkWrapper'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ChunkResult } from '@/types/search'
import { convertReferencesToSup } from '@/utils/message-utils'
import { extractThinkContent, type ThinkingStatus } from '@/utils/think-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { toReferenceChunk } from '../search-reference-chunk'

interface SearchSummaryCardProps {
  summary: string
  thinking?: string
  isStreaming: boolean
  completed?: boolean
  references: ChunkResult[]
  onViewDetail: (chunk: ChunkResult, allChunks: ChunkResult[]) => void
}

const SearchSummaryCard = ({
  summary,
  thinking = '',
  completed = false,
  isStreaming,
  references,
  onViewDetail,
}: SearchSummaryCardProps) => {
  const { t } = useTranslation()
  const referenceChunks = useMemo(
    () => references.map(toReferenceChunk),
    [references],
  )
  const parsedSummary = useMemo(() => extractThinkContent(summary), [summary])
  const thinkContent = thinking || parsedSummary.thinkContent
  const displaySummary = parsedSummary.mainContent
  const thinkingStatus: ThinkingStatus = thinkContent
    ? isStreaming && (thinking || parsedSummary.status === 'thinking')
      ? 'thinking'
      : completed
        ? 'complete'
        : 'none'
    : 'none'
  const summaryWithSup = useMemo(
    () => convertReferencesToSup(displaySummary),
    [displaySummary],
  )

  const handleViewReferenceDetail = useCallback(
    (referenceChunk: ReferenceChunk) => {
      const sourceChunk = references.find(
        (chunk) => chunk.chunk_id === referenceChunk.id,
      )
      if (!sourceChunk) return
      onViewDetail(sourceChunk, references)
    },
    [onViewDetail, references],
  )

  const SupComponent = useMemo(
    () =>
      createReferenceMarkerComponent(referenceChunks, {
        onViewDetail: handleViewReferenceDetail,
        onCopy: async (content) => {
          try {
            await copyToClipboard(content)
            toast.success(t('sources.copied'))
          } catch {
            toast.error(t('sources.copyFailed'))
          }
        },
      }),
    [handleViewReferenceDetail, referenceChunks, t],
  )
  const markdownComponents = useMemo(
    () =>
      mergeMarkdownComponents(
        referenceChunks.length > 0 ? { sup: SupComponent } : undefined,
      ),
    [referenceChunks.length, SupComponent],
  )

  if (
    !displaySummary.trim() &&
    !thinkContent &&
    parsedSummary.retrievalStatus === 'none' &&
    !isStreaming
  )
    return null

  // The summary is an AI moment: a tide accent always, the tide ring and a
  // shimmering status only while it is being written.
  return (
    <div
      data-summary-streaming={isStreaming || undefined}
      className={cn(
        'relative min-w-0 overflow-hidden rounded-radius-xl border bg-surface transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none',
        isStreaming ? 'ai-glow' : 'border-line-subtle',
      )}
      aria-live="polite"
      aria-busy={isStreaming}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-ai-tide"
      />
      <div className="p-space-base">
        <div className="mb-space-sm flex items-center gap-space-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-radius-md bg-ai-tide text-accent-on-solid">
            <Sparkles className="size-icon-xs" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-fg">
            {t('searchPage.workspace.summary')}
          </span>
          {isStreaming ? (
            <span className="min-w-0 text-shimmer truncate text-xs">
              {t('searchPage.workspace.phases.summarizing')}
            </span>
          ) : null}
        </div>

        <div className="space-y-space-sm text-fg">
          <RetrievalProgress result={parsedSummary} isStreaming={isStreaming} />
          {thinkContent ? (
            <ThinkWrapper status={thinkingStatus} messageId="search-summary">
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-fg-muted">
                {thinkContent}
              </div>
            </ThinkWrapper>
          ) : null}

          {displaySummary ? (
            <>
              <div className="bubble-copy-text search-summary-markdown max-w-none text-sm leading-7 text-fg [&_h1]:mt-space-sm [&_h1]:mb-space-sm [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-fg [&_h2]:mt-space-sm [&_h2]:mb-space-sm [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:mt-space-sm [&_h3]:mb-space-xs [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-fg [&_li]:my-space-xs [&_li]:leading-7 [&_li]:text-fg [&_ol]:my-space-sm [&_p]:my-space-sm [&_p]:leading-7 [&_p]:text-fg [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:my-space-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <style>{`
                  .search-summary-markdown {
                    color: var(--color-fg) !important;
                  }
                  .search-summary-markdown a {
                    color: var(--color-action-bg) !important;
                  }
                  .search-summary-markdown table:not(pre) {
                    border-collapse: collapse !important;
                    display: block !important;
                    width: max-content !important;
                    max-width: 100% !important;
                    overflow: auto !important;
                    border: 1px solid var(--color-line) !important;
                    border-radius: 8px !important;
                    margin: 8px 0 16px 0 !important;
                    background-color: var(--color-surface) !important;
                  }
                  .search-summary-markdown th,
                  .search-summary-markdown td {
                    border: 1px solid var(--color-line) !important;
                    padding: 8px 12px !important;
                    text-align: left !important;
                    vertical-align: top !important;
                  }
                  .search-summary-markdown th {
                    color: var(--color-fg) !important;
                    background-color: var(--color-sunken) !important;
                    font-weight: 600 !important;
                  }
                  .search-summary-markdown td {
                    color: var(--color-fg) !important;
                    background-color: var(--color-surface) !important;
                  }
                  .search-summary-markdown code {
                    background-color: var(--color-sunken) !important;
                    color: var(--color-fg) !important;
                  }
                  .search-summary-markdown pre {
                    background-color: var(--color-code-bg) !important;
                    border-color: var(--color-line-subtle) !important;
                  }
                  .search-summary-markdown pre code {
                    color: var(--color-code-fg) !important;
                  }
                `}</style>
                <StreamingXMarkdown
                  paragraphTag="div"
                  config={markdownConfig}
                  components={markdownComponents}
                  content={
                    referenceChunks.length > 0 ? summaryWithSup : displaySummary
                  }
                  isStreaming={isStreaming}
                />
              </div>
              {referenceChunks.length > 0 && !isStreaming ? (
                <>
                  <ReferenceImageList
                    referenceChunks={referenceChunks}
                    messageContent={displaySummary}
                    onImageClick={handleViewReferenceDetail}
                  />
                  <ReferencePanel
                    chunks={referenceChunks}
                    onChunkClick={handleViewReferenceDetail}
                    className="mt-space-xs"
                  />
                </>
              ) : null}
              {isStreaming ? (
                <span
                  aria-hidden="true"
                  className="mt-space-2xs inline-block h-4 w-0.5 animate-pulse rounded-radius-full bg-accent-fg motion-reduce:animate-none"
                />
              ) : null}
            </>
          ) : !thinkContent &&
            parsedSummary.retrievalStatus === 'none' &&
            isStreaming ? (
            <div className="space-y-space-xs" aria-hidden="true">
              <div className="h-4 w-full animate-pulse rounded-radius-md bg-sunken motion-reduce:animate-none" />
              <div className="h-4 w-4/5 animate-pulse rounded-radius-md bg-sunken motion-reduce:animate-none" />
              <div className="h-4 w-3/5 animate-pulse rounded-radius-md bg-sunken motion-reduce:animate-none" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(SearchSummaryCard)
