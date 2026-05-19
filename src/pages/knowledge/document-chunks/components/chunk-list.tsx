import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import type { ChunkData, TextMode } from '../types'
import { ChunkListRow } from './chunk-list-row'
import { ChunkListState } from './chunk-list-state'
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <ChunkListState label={t('knowledge.chunks.list.loading')} spinning />
        ) : error ? (
          <ChunkListState label={t('knowledge.chunks.list.loadError')}>
            <Button variant="outline" onClick={onRefetch}>
              {t('knowledge.chunks.list.retry')}
            </Button>
          </ChunkListState>
        ) : filteredChunks.length === 0 ? (
          <ChunkListState label={t('knowledge.chunks.list.empty')} />
        ) : (
          <div className="space-y-3 p-4">
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
