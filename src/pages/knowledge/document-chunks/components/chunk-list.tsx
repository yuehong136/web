import type { ReactNode } from 'react'
import DOMPurify from 'dompurify'
import {
  Copy,
  Edit2,
  FileText,
  Key,
  MessageCircleQuestion,
  Trash2,
  ZoomIn,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL, API_VERSION } from '@/constants'
import { Button, Checkbox, ToggleSwitch, Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ChunkData, TextMode } from '../types'
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
          <ListState label={t('knowledge.chunks.list.loading')} spinning />
        ) : error ? (
          <ListState label={t('knowledge.chunks.list.loadError')}>
            <Button variant="outline" onClick={onRefetch}>
              {t('knowledge.chunks.list.retry')}
            </Button>
          </ListState>
        ) : filteredChunks.length === 0 ? (
          <ListState label={t('knowledge.chunks.list.empty')} />
        ) : (
          <div className="space-y-3 p-4">
            {filteredChunks.map((chunk) => {
              const isSelected = selectedChunkIds.includes(chunk.chunk_id)
              const indexInPage = chunks.indexOf(chunk)
              const sliceNo =
                (page - 1) * pageSize + (indexInPage >= 0 ? indexInPage : 0) + 1
              const pageNo = chunk.positions?.[0]?.[0]

              return (
                <ChunkListItem
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

interface ChunkListItemProps {
  chunk: ChunkData
  sliceNo: number
  pageNo?: number
  isActive: boolean
  isSelected: boolean
  textMode: TextMode
  onSelectChunk: (chunk: ChunkData) => void
  onEditChunk: (chunk: ChunkData) => void
  onToggleChunkStatus: (chunk: ChunkData) => void
  onDeleteChunk: (chunkId: string) => void
  onCheckboxChange: (chunkId: string, checked: boolean) => void
  onPreviewImage: (url: string) => void
}

const ChunkListItem = ({
  chunk,
  sliceNo,
  pageNo,
  isActive,
  isSelected,
  textMode,
  onSelectChunk,
  onEditChunk,
  onToggleChunkStatus,
  onDeleteChunk,
  onCheckboxChange,
  onPreviewImage,
}: ChunkListItemProps) => {
  const { t } = useTranslation()
  const chunkType = normalizeChunkType(chunk.doc_type_kwd)
  const typeStyles = getTypeStyles(chunkType)

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        isActive && 'ring-2',
        isSelected && 'ring-text-accent/50 ring-1',
      )}
      style={{
        backgroundColor: isSelected
          ? 'var(--color-state-active)'
          : 'var(--color-components-card-bg)',
        border: isActive
          ? '2px solid var(--color-text-accent)'
          : '1px solid var(--color-components-card-border)',
      }}
      onClick={() => onSelectChunk(chunk)}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onEditChunk(chunk)
      }}
    >
      <span
        className="absolute right-0 top-0 rounded-bl-xl rounded-tr-lg px-3 py-1 text-xs font-medium"
        style={{
          backgroundColor: typeStyles.bg,
          color: typeStyles.text,
          borderLeft: '1px solid var(--color-border-default)',
          borderBottom: '1px solid var(--color-border-default)',
        }}
      >
        {t(`knowledge.chunks.list.type.${chunkType}`)}
      </span>

      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            onClick={(event) => {
              event.stopPropagation()
              onCheckboxChange(chunk.chunk_id, !isSelected)
            }}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onCheckboxChange(chunk.chunk_id, !!checked)
              }
            />
          </div>
          <span
            className="inline-flex items-center rounded px-2 py-1 text-xs font-medium tabular-nums"
            style={{
              backgroundColor: 'var(--color-background-subtle)',
              color: 'var(--color-text-primary)',
            }}
          >
            {t('knowledge.chunks.list.itemLabel', { no: sliceNo })}
            {pageNo ? (
              <span
                className="ml-1.5"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {t('knowledge.chunks.list.pageSuffix', { page: pageNo })}
              </span>
            ) : null}
          </span>
          <Tooltip
            content={t('knowledge.chunks.list.copyIdTooltip', {
              id: chunk.chunk_id,
            })}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation()
                void navigator.clipboard
                  .writeText(chunk.chunk_id)
                  .then(() => {
                    toast.success(t('knowledge.chunks.list.copySuccess'))
                  })
                  .catch(() => {
                    toast.error(t('knowledge.chunks.list.copyError'))
                  })
              }}
              aria-label={t('knowledge.chunks.list.copyId')}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <StatusBadge available={chunk.available_int === 1} />
        </div>

        <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div onClick={(event) => event.stopPropagation()}>
            <div
              className="rounded-lg px-2 py-1 shadow-md backdrop-blur-sm"
              style={{
                backgroundColor: 'var(--color-background-surface)',
                border: '1px solid var(--color-border-default)',
              }}
            >
              <ToggleSwitch
                checked={chunk.available_int === 1}
                onChange={() => onToggleChunkStatus(chunk)}
                size="sm"
                leftLabel={t('knowledge.chunks.list.statusDisabled')}
                rightLabel={t('knowledge.chunks.list.statusEnabled')}
              />
            </div>
          </div>
          <Tooltip content={t('knowledge.chunks.list.editChunk')}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation()
                onEditChunk(chunk)
              }}
            >
              <Edit2
                className="h-4 w-4"
                style={{ color: 'var(--color-text-accent)' }}
              />
            </Button>
          </Tooltip>
          <Tooltip content={t('knowledge.chunks.list.deleteChunk')}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation()
                onDeleteChunk(chunk.chunk_id)
              }}
            >
              <Trash2
                className="h-4 w-4"
                style={{ color: 'var(--color-text-error)' }}
              />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-stretch gap-3">
        {chunk.img_id && (
          <div
            className="group/thumb relative flex-shrink-0 cursor-pointer self-stretch"
            onClick={(event) => {
              event.stopPropagation()
              onPreviewImage(
                `${API_BASE_URL}/${API_VERSION}/document/image/${chunk.img_id}`,
              )
            }}
            style={{
              minHeight: '64px',
              minWidth: textMode === 'full' ? '120px' : '64px',
              maxWidth: textMode === 'full' ? '160px' : '64px',
            }}
          >
            <img
              src={`${API_BASE_URL}/${API_VERSION}/document/image/${chunk.img_id}`}
              alt={t('knowledge.chunks.list.thumbnailAlt')}
              className="h-full w-full rounded border object-cover transition-all duration-200 group-hover/thumb:ring-2 group-hover/thumb:ring-text-accent"
              style={{
                borderColor: 'var(--color-border-default)',
                backgroundColor: 'var(--color-background-subtle)',
              }}
              onError={(event) => {
                ;(event.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/0 opacity-0 transition-all duration-200 group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100">
              <ZoomIn className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
          </div>
        )}

        <div
          className="flex-1 text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <div
            className={textMode === 'full' ? '' : 'line-clamp-3'}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(chunk.content_with_weight, {
                ALLOWED_TAGS: ['em', 'strong', 'b', 'i', 'br'],
                ALLOWED_ATTR: [],
              }),
            }}
          />
        </div>
      </div>

      {((chunk.important_kwd && chunk.important_kwd.length > 0) ||
        (chunk.question_kwd && chunk.question_kwd.length > 0)) && (
        <div
          className="mt-3 space-y-2 pt-3"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          {chunk.important_kwd && chunk.important_kwd.length > 0 && (
            <KeywordRow
              icon={<Key className="h-3 w-3" />}
              label={t('knowledge.chunks.list.keywords')}
              values={chunk.important_kwd}
              variant="info"
            />
          )}
          {chunk.question_kwd && chunk.question_kwd.length > 0 && (
            <KeywordRow
              icon={<MessageCircleQuestion className="h-3 w-3" />}
              label={t('knowledge.chunks.list.questions')}
              values={chunk.question_kwd}
              variant="warning"
            />
          )}
        </div>
      )}
    </div>
  )
}

interface KeywordRowProps {
  icon: ReactNode
  label: string
  values: string[]
  variant: 'info' | 'warning'
}

const KeywordRow = ({ icon, label, values, variant }: KeywordRowProps) => (
  <div className="flex items-start gap-2">
    <div
      className="flex flex-shrink-0 items-center gap-1 text-xs"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <Tooltip key={`${value}-${index}`} content={value}>
          <span
            className={cn(
              'inline-flex items-center truncate rounded px-2 py-0.5 text-xs',
              variant === 'info' ? 'max-w-24' : 'max-w-32',
            )}
            style={{
              backgroundColor:
                variant === 'info'
                  ? 'var(--color-components-badge-info-bg)'
                  : 'var(--color-components-badge-warning-bg)',
              color:
                variant === 'info'
                  ? 'var(--color-components-badge-info-text)'
                  : 'var(--color-components-badge-warning-text)',
            }}
          >
            {value}
          </span>
        </Tooltip>
      ))}
    </div>
  </div>
)

const StatusBadge = ({ available }: { available: boolean }) => {
  const { t } = useTranslation()
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm"
      style={{
        backgroundColor: available
          ? 'var(--color-components-badge-success-bg)'
          : 'var(--color-components-badge-error-bg)',
        color: available
          ? 'var(--color-components-badge-success-text)'
          : 'var(--color-components-badge-error-text)',
      }}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: available
            ? 'var(--color-state-success)'
            : 'var(--color-state-error)',
        }}
      />
      {available
        ? t('knowledge.chunks.list.statusEnabled')
        : t('knowledge.chunks.list.statusDisabled')}
    </span>
  )
}

interface ListStateProps {
  label: string
  spinning?: boolean
  children?: ReactNode
}

const ListState = ({ label, spinning, children }: ListStateProps) => (
  <div
    className="p-8 text-center"
    style={{ color: 'var(--color-text-tertiary)' }}
  >
    {spinning ? (
      <div
        className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"
        style={{ borderColor: 'var(--color-text-accent)' }}
      />
    ) : (
      <FileText
        className="mx-auto mb-4 h-12 w-12"
        style={{ color: 'var(--color-text-muted)' }}
      />
    )}
    <p className={children ? 'mb-4' : undefined}>{label}</p>
    {children}
  </div>
)

const normalizeChunkType = (type?: string) => {
  const normalized = type?.toLowerCase()
  if (normalized === 'image' || normalized === 'table') return normalized
  return 'text'
}

const getTypeStyles = (type: 'image' | 'table' | 'text') => {
  if (type === 'image') {
    return {
      bg: 'var(--color-components-badge-warning-bg)',
      text: 'var(--color-components-badge-warning-text)',
    }
  }
  if (type === 'table') {
    return {
      bg: 'var(--color-components-badge-success-bg)',
      text: 'var(--color-components-badge-success-text)',
    }
  }
  return {
    bg: 'var(--color-background-subtle)',
    text: 'var(--color-text-tertiary)',
  }
}
