import type { ReactNode } from 'react'
import type { Config } from 'dompurify'
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
import { DocumentImage } from '@/components/knowledge/document-image'
import { Button, Checkbox, Switch, Tooltip } from '@/components/ui'
import { SafeHtml } from '@/components/ui/safe-html'
import { cn, copyToClipboard } from '@/lib/utils'
import type { ChunkData, TextMode } from '../types'

// 文档解析内容是不可信输入；阅读区只允许高亮和强调标签。
const CHUNK_CONTENT_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: ['em', 'strong', 'b', 'i', 'br'],
  ALLOWED_ATTR: [],
}

interface ChunkListRowProps {
  chunk: ChunkData
  sliceNo: number
  pageNo?: number
  isActive: boolean
  isSelected: boolean
  isMutationPending?: boolean
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
  isMutationPending = false,
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
  const expanded = textMode === 'full' || isActive
  const available = chunk.available_int === 1
  const characterCount = chunk.content_with_weight.replace(
    /<[^>]*>/g,
    '',
  ).length

  return (
    <article
      className={cn(
        'border-b border-l-2 border-b-border-subtle border-l-transparent px-space-md py-space-lg transition-colors',
        isActive && 'border-l-state-focus bg-state-selected-bg',
        isSelected && 'bg-state-selected-bg',
      )}
      data-chunk-id={chunk.chunk_id}
    >
      <div className="mb-space-base flex flex-wrap items-center justify-between gap-x-space-base gap-y-space-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
          <Checkbox
            checked={isSelected}
            disabled={isMutationPending}
            aria-label={t('knowledge.chunks.list.selectChunk', { no: sliceNo })}
            onCheckedChange={(checked) =>
              onCheckboxChange(chunk.chunk_id, checked === true)
            }
          />
          <span className="inline-flex shrink-0 items-center gap-space-sm text-xs font-medium whitespace-nowrap text-text-primary tabular-nums">
            {t('knowledge.chunks.list.itemLabel', { no: sliceNo })}
            {pageNo ? (
              <span className="font-normal text-text-tertiary">
                {t('knowledge.chunks.list.pageSuffix', { page: pageNo })}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-text-tertiary">
            {t(`knowledge.chunks.list.type.${chunkType}`)}
          </span>
          <span className="text-xs whitespace-nowrap text-text-tertiary tabular-nums">
            {t('knowledge.chunks.list.characters', { count: characterCount })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <div className="mr-space-sm flex items-center gap-space-sm">
            <span
              className={cn(
                'text-xs whitespace-nowrap',
                available ? 'text-status-success' : 'text-text-tertiary',
              )}
            >
              {t(
                available
                  ? 'knowledge.chunks.list.statusEnabled'
                  : 'knowledge.chunks.list.statusDisabled',
              )}
            </span>
            <Switch
              checked={available}
              disabled={isMutationPending}
              size="sm"
              onCheckedChange={() => onToggleChunkStatus(chunk)}
              aria-label={`${t('knowledge.chunks.list.itemLabel', { no: sliceNo })} ${t('knowledge.chunks.list.statusEnabled')}`}
            />
          </div>
          <Tooltip
            content={t('knowledge.chunks.list.copyIdTooltip', {
              id: chunk.chunk_id,
            })}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                void copyToClipboard(chunk.chunk_id)
                  .then(() => {
                    toast.success(t('knowledge.chunks.list.copySuccess'))
                  })
                  .catch(() => {
                    toast.error(t('knowledge.chunks.list.copyError'))
                  })
              }}
              aria-label={t('knowledge.chunks.list.copyId')}
            >
              <Copy className="size-icon-sm" aria-hidden="true" />
            </Button>
          </Tooltip>
          <Tooltip content={t('knowledge.chunks.list.editChunk')}>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isMutationPending}
              onClick={() => onEditChunk(chunk)}
              aria-label={t('knowledge.chunks.list.editChunk')}
            >
              <Edit2 className="size-icon-sm" aria-hidden="true" />
            </Button>
          </Tooltip>
          <Tooltip content={t('knowledge.chunks.list.deleteChunk')}>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isMutationPending}
              onClick={() => onDeleteChunk(chunk.chunk_id)}
              aria-label={t('knowledge.chunks.list.deleteChunk')}
              className="text-text-tertiary hover:text-status-error"
            >
              <Trash2 className="size-icon-sm" aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex min-w-0 items-start gap-space-md">
        {chunk.img_id && (
          <button
            type="button"
            aria-label={t('knowledge.chunks.list.previewImage')}
            className="group/thumb relative w-20 shrink-0 overflow-hidden rounded-radius-md border border-border-subtle bg-background-subtle focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
            onClick={() => onPreviewImage(chunk.img_id)}
          >
            <DocumentImage
              source={{ kind: 'dataset', imageId: chunk.img_id }}
              retryable={false}
              alt={t('knowledge.chunks.list.thumbnailAlt')}
              className="max-h-32 min-h-16 w-full object-cover"
            />
            <span className="absolute right-space-xs bottom-space-xs rounded-radius-sm bg-background-surface p-space-xs text-text-secondary">
              <ZoomIn className="size-icon-sm" aria-hidden="true" />
            </span>
          </button>
        )}

        <button
          type="button"
          aria-label={t('knowledge.chunks.list.inspectChunk', { no: sliceNo })}
          aria-pressed={isActive}
          aria-expanded={expanded}
          className="min-w-0 flex-1 cursor-pointer rounded-radius-sm text-left text-sm leading-7 text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
          onClick={() => onSelectChunk(chunk)}
          onDoubleClick={() => {
            if (!isMutationPending) onEditChunk(chunk)
          }}
        >
          <SafeHtml
            className={cn(
              'wrap-anywhere whitespace-pre-wrap',
              !expanded && 'line-clamp-3',
            )}
            html={chunk.content_with_weight}
            options={CHUNK_CONTENT_PURIFY_OPTIONS}
          />
        </button>
      </div>

      {((chunk.important_kwd && chunk.important_kwd.length > 0) ||
        (chunk.question_kwd && chunk.question_kwd.length > 0)) && (
        <div className="mt-space-md space-y-space-sm">
          {chunk.important_kwd && chunk.important_kwd.length > 0 && (
            <KeywordRow
              icon={<Key className="size-icon-sm" aria-hidden="true" />}
              label={t('knowledge.chunks.list.keywords')}
              values={chunk.important_kwd}
            />
          )}
          {chunk.question_kwd && chunk.question_kwd.length > 0 && (
            <KeywordRow
              icon={
                <MessageCircleQuestion
                  className="size-icon-sm"
                  aria-hidden="true"
                />
              }
              label={t('knowledge.chunks.list.questions')}
              values={chunk.question_kwd}
            />
          )}
        </div>
      )}
    </article>
  )
}

interface KeywordRowProps {
  icon: ReactNode
  label: string
  values: string[]
}

const KeywordRow = ({ icon, label, values }: KeywordRowProps) => (
  <div className="flex flex-wrap items-start gap-space-sm">
    <div className="flex shrink-0 items-center gap-space-xs py-space-2xs text-xs text-text-tertiary">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex min-w-0 flex-1 flex-wrap gap-space-xs">
      {values.map((value, index) => (
        <Tooltip key={`${value}-${index}`} content={value}>
          <span className="max-w-full truncate rounded-radius-sm bg-background-subtle px-space-sm py-space-2xs text-xs text-text-secondary">
            {value}
          </span>
        </Tooltip>
      ))}
    </div>
  </div>
)

const normalizeChunkType = (type?: string) => {
  const normalized = type?.toLowerCase()
  if (normalized === 'image' || normalized === 'table') return normalized
  return 'text'
}
