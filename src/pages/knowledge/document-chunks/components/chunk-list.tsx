import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import type { ChunkData, TextMode } from '../types'
import { ChunkListRow } from './chunk-list-row'
import { ChunkPagination } from './chunk-pagination'

interface ChunkListProps {
  loading: boolean
  error: unknown
  chunks: ChunkData[]
  filteredChunks: ChunkData[]
  total: number
  page: number
  pageSize: number
  selectedChunk: ChunkData | null
  selectedChunkIds: string[]
  textMode: TextMode
  filterKey?: string
  isMutationPending?: boolean
  isRefreshing?: boolean
  onRefetch: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSelectChunk: (chunk: ChunkData) => void
  onEditChunk: (chunk: ChunkData) => void
  onToggleChunkStatus: (chunk: ChunkData) => void
  onDeleteChunk: (chunkId: string) => void
  onCheckboxChange: (chunkId: string, checked: boolean) => void
  onPreviewImage: (url: string) => void
}

export const ChunkList = ({
  loading,
  error,
  chunks,
  filteredChunks,
  total,
  page,
  pageSize,
  selectedChunk,
  selectedChunkIds,
  textMode,
  filterKey,
  isMutationPending = false,
  isRefreshing = false,
  onRefetch,
  onPageChange,
  onPageSizeChange,
  onSelectChunk,
  onEditChunk,
  onToggleChunkStatus,
  onDeleteChunk,
  onCheckboxChange,
  onPreviewImage,
}: ChunkListProps) => {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const documentId = chunks[0]?.doc_id

  // Mutations update row content in place; only navigation resets reading position.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [page, pageSize, filterKey, documentId])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="scrollbar-thin min-h-0 flex-1 scrollbar-thumb-components-scrollbar-thumb scrollbar-track-transparent overflow-x-hidden overflow-y-auto"
        aria-busy={loading || isRefreshing}
      >
        {loading ? (
          <PageLoadingState
            compact
            title={t('knowledge.chunks.list.loading')}
            description={null}
          />
        ) : error ? (
          <PageErrorState
            compact
            title={t('knowledge.chunks.list.loadError')}
            description={null}
            retryLabel={t('knowledge.chunks.list.retry')}
            onRetry={onRefetch}
          />
        ) : filteredChunks.length === 0 ? (
          <PageEmptyState compact title={t('knowledge.chunks.list.empty')} />
        ) : (
          <div className="mx-auto w-full max-w-5xl">
            {filteredChunks.map((chunk) => {
              const isSelected = selectedChunkIds.includes(chunk.chunk_id)
              const indexInPage = chunks.indexOf(chunk)
              const sliceNo =
                (page - 1) * pageSize + (indexInPage >= 0 ? indexInPage : 0) + 1
              const pageNo = chunk.positions?.[0]?.[0]

              return (
                <ChunkListRow
                  key={chunk.chunk_id}
                  chunk={chunk}
                  sliceNo={sliceNo}
                  pageNo={pageNo}
                  isActive={selectedChunk?.chunk_id === chunk.chunk_id}
                  isSelected={isSelected}
                  isMutationPending={isMutationPending}
                  textMode={textMode}
                  onSelectChunk={onSelectChunk}
                  onEditChunk={onEditChunk}
                  onToggleChunkStatus={onToggleChunkStatus}
                  onDeleteChunk={onDeleteChunk}
                  onCheckboxChange={onCheckboxChange}
                  onPreviewImage={onPreviewImage}
                />
              )
            })}
          </div>
        )}
      </div>

      {total > 0 && (
        <ChunkPagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}
