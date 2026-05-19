import type { ReactNode } from 'react'
import DOMPurify from 'dompurify'
import {
  Copy,
  Edit2,
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

interface ChunkListRowProps {
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

export const ChunkListRow = ({
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
}: ChunkListRowProps) => {
  const { t } = useTranslation()
  const chunkType = normalizeChunkType(chunk.doc_type_kwd)
  const typeStyles = getTypeStyles(chunkType)

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        'border',
        isSelected ? 'bg-state-active' : 'bg-components-card-bg',
        isActive
          ? 'border-2 border-text-accent'
          : 'border-components-card-border',
        isSelected && 'ring-text-accent/50 ring-1',
      )}
      onClick={() => onSelectChunk(chunk)}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onEditChunk(chunk)
      }}
    >
      <span
        className={cn(
          'absolute right-0 top-0 rounded-bl-xl rounded-tr-lg border-b border-l border-border-default px-3 py-1 text-xs font-medium',
          typeStyles.bg,
          typeStyles.text,
        )}
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
          <span className="inline-flex items-center rounded bg-background-subtle px-2 py-1 text-xs font-medium tabular-nums text-text-primary">
            {t('knowledge.chunks.list.itemLabel', { no: sliceNo })}
            {pageNo ? (
              <span className="ml-1.5 text-text-tertiary">
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
            <div className="rounded-lg border border-border-default bg-background-surface px-2 py-1 shadow-md backdrop-blur-sm">
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
              <Edit2 className="h-4 w-4 text-text-accent" />
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
              <Trash2 className="h-4 w-4 text-text-error" />
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
              className="h-full w-full rounded border border-border-default bg-background-subtle object-cover transition-all duration-200 group-hover/thumb:ring-2 group-hover/thumb:ring-text-accent"
              onError={(event) => {
                ;(event.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/0 opacity-0 transition-all duration-200 group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100">
              <ZoomIn className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
          </div>
        )}

        <div className="flex-1 text-sm leading-relaxed text-text-secondary">
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
        <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
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
    <div className="flex flex-shrink-0 items-center gap-1 text-xs text-text-tertiary">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <Tooltip key={`${value}-${index}`} content={value}>
          <span
            className={cn(
              'inline-flex items-center truncate rounded px-2 py-0.5 text-xs',
              variant === 'info'
                ? 'max-w-24 bg-components-badge-info-bg text-components-badge-info-text'
                : 'max-w-32 bg-components-badge-warning-bg text-components-badge-warning-text',
            )}
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
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
        available
          ? 'bg-components-badge-success-bg text-components-badge-success-text'
          : 'bg-components-badge-error-bg text-components-badge-error-text',
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          available ? 'bg-state-success' : 'bg-state-error',
        )}
      />
      {available
        ? t('knowledge.chunks.list.statusEnabled')
        : t('knowledge.chunks.list.statusDisabled')}
    </span>
  )
}

const normalizeChunkType = (type?: string) => {
  const normalized = type?.toLowerCase()
  if (normalized === 'image' || normalized === 'table') return normalized
  return 'text'
}

const getTypeStyles = (type: 'image' | 'table' | 'text') => {
  if (type === 'image') {
    return {
      bg: 'bg-components-badge-warning-bg',
      text: 'text-components-badge-warning-text',
    }
  }
  if (type === 'table') {
    return {
      bg: 'bg-components-badge-success-bg',
      text: 'text-components-badge-success-text',
    }
  }
  return {
    bg: 'bg-background-subtle',
    text: 'text-text-tertiary',
  }
}
