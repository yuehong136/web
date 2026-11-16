import type { Config } from 'dompurify'
import { Copy, Edit2, Maximize2, Trash2 } from 'lucide-react'
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
  /** The source panel shows this chunk's highlighted position. */
  isLocated?: boolean
  isMutationPending?: boolean
  textMode: TextMode
  onSelectChunk: (chunk: ChunkData) => void
  onEditChunk: (chunk: ChunkData) => void
  onToggleChunkStatus: (chunk: ChunkData) => void
  onDeleteChunk: (chunkId: string) => void
  onCheckboxChange: (chunkId: string, checked: boolean) => void
  onPreviewImage: (url: string) => void
}

function ActionButton({
  label,
  tooltip,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string
  tooltip?: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip content={tooltip ?? label}>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        className={cn(
          'text-text-tertiary hover:text-text-primary',
          danger && 'hover:text-status-error',
        )}
      >
        {children}
      </Button>
    </Tooltip>
  )
}

/**
 * One chunk as a card: select, number and position, actions and the
 * retrieval switch; the content (click to inspect and locate it in the
 * source, double-click to edit), its image, keywords and questions.
 */
export const ChunkListRow = ({
  chunk,
  sliceNo,
  pageNo,
  isActive,
  isSelected,
  isLocated = false,
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
  const meta = [
    pageNo ? t('knowledge.chunks.list.pageLabel', { page: pageNo }) : null,
    t(`knowledge.chunks.list.type.${chunkType}`),
    t('knowledge.chunks.list.characters', { count: characterCount }),
    available ? null : t('knowledge.chunks.list.statusDisabled'),
  ].filter(Boolean)

  return (
    <article
      data-chunk-id={chunk.chunk_id}
      data-active={isActive || undefined}
      className={cn(
        'flex flex-col gap-space-sm rounded-radius-xl border px-space-base py-space-sm transition-[border-color,background-color,box-shadow] duration-150',
        isActive
          ? 'border-state-focus bg-state-selected-bg shadow-elevation-low'
          : isSelected
            ? 'border-state-focus-subtle bg-background-surface'
            : 'border-border-subtle bg-background-surface hover:border-border-strong',
        !available && !isActive && 'opacity-70',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-space-sm gap-y-space-2xs">
        <Checkbox
          checked={isSelected}
          disabled={isMutationPending}
          aria-label={t('knowledge.chunks.list.selectChunk', { no: sliceNo })}
          onCheckedChange={(checked) =>
            onCheckboxChange(chunk.chunk_id, checked === true)
          }
        />
        <span className="font-mono text-xs font-medium text-text-primary">
          #{sliceNo}
        </span>
        <span className="min-w-0 truncate text-xs text-text-tertiary tabular-nums">
          {meta.join(' · ')}
        </span>
        {isLocated ? (
          <span className="inline-flex h-5 items-center rounded-radius-full border border-state-focus-subtle bg-state-focus-10 px-space-sm text-xs text-text-accent">
            {t('knowledge.chunks.list.located')}
          </span>
        ) : null}
        <span className="flex-1" aria-hidden="true" />
        <div className="flex items-center gap-space-2xs">
          <ActionButton
            label={t('knowledge.chunks.list.editChunk')}
            disabled={isMutationPending}
            onClick={() => onEditChunk(chunk)}
          >
            <Edit2 className="size-icon-sm" aria-hidden="true" />
          </ActionButton>
          <ActionButton
            label={t('knowledge.chunks.list.copyId')}
            tooltip={t('knowledge.chunks.list.copyIdTooltip', {
              id: chunk.chunk_id,
            })}
            onClick={() => {
              void copyToClipboard(chunk.chunk_id)
                .then(() => {
                  toast.success(t('knowledge.chunks.list.copySuccess'))
                })
                .catch(() => {
                  toast.error(t('knowledge.chunks.list.copyError'))
                })
            }}
          >
            <Copy className="size-icon-sm" aria-hidden="true" />
          </ActionButton>
          <ActionButton
            label={t('knowledge.chunks.list.deleteChunk')}
            disabled={isMutationPending}
            danger
            onClick={() => onDeleteChunk(chunk.chunk_id)}
          >
            <Trash2 className="size-icon-sm" aria-hidden="true" />
          </ActionButton>
          <Tooltip
            content={t(
              available
                ? 'knowledge.chunks.list.statusEnabled'
                : 'knowledge.chunks.list.statusDisabled',
            )}
          >
            <Switch
              checked={available}
              disabled={isMutationPending}
              size="sm"
              className="ml-space-xs"
              onCheckedChange={() => onToggleChunkStatus(chunk)}
              aria-label={`${t('knowledge.chunks.list.itemLabel', { no: sliceNo })} ${t('knowledge.chunks.list.statusEnabled')}`}
            />
          </Tooltip>
        </div>
      </div>

      <div className="flex min-w-0 items-start gap-space-md">
        {chunk.img_id && (
          <button
            type="button"
            aria-label={t('knowledge.chunks.list.previewImage')}
            className="group/thumb relative w-28 shrink-0 overflow-hidden rounded-radius-md border border-border-subtle bg-background-subtle outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus"
            onClick={() => onPreviewImage(chunk.img_id)}
          >
            <DocumentImage
              source={{ kind: 'dataset', imageId: chunk.img_id }}
              retryable={false}
              alt={t('knowledge.chunks.list.thumbnailAlt')}
              className="max-h-32 min-h-16 w-full object-cover"
            />
            <span className="absolute right-space-xs bottom-space-xs flex size-5 items-center justify-center rounded-radius-sm bg-background-surface text-text-secondary shadow-elevation-low">
              <Maximize2 className="size-icon-xs" aria-hidden="true" />
            </span>
          </button>
        )}

        <button
          type="button"
          aria-label={t('knowledge.chunks.list.inspectChunk', { no: sliceNo })}
          aria-pressed={isActive}
          aria-expanded={expanded}
          className="min-w-0 flex-1 cursor-pointer rounded-radius-sm text-left text-sm leading-relaxed text-text-primary outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus"
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

      {chunk.important_kwd?.length || chunk.question_kwd?.length ? (
        <ul
          aria-label={t('knowledge.chunks.list.keywordsAndQuestions')}
          className="flex flex-wrap gap-space-xs"
        >
          {(chunk.important_kwd ?? []).map((value, index) => (
            <KeywordChip
              key={`k-${index}-${value}`}
              label={index === 0 ? t('knowledge.chunks.list.keywords') : null}
              value={value}
            />
          ))}
          {(chunk.question_kwd ?? []).map((value, index) => (
            <KeywordChip
              key={`q-${index}-${value}`}
              label={index === 0 ? t('knowledge.chunks.list.questions') : null}
              value={value}
            />
          ))}
        </ul>
      ) : null}
    </article>
  )
}

/** A keyword or question; the first of each kind carries the kind's name. */
const KeywordChip = ({
  label,
  value,
}: {
  label: string | null
  value: string
}) => (
  <li className="inline-flex h-5.5 max-w-full min-w-0 items-center gap-space-xs rounded-radius-full border border-border-subtle bg-background-subtle px-space-sm text-xs text-text-secondary">
    {label ? (
      <span className="shrink-0 text-text-tertiary">{label}</span>
    ) : null}
    <span className="truncate" title={value}>
      {value}
    </span>
  </li>
)

const normalizeChunkType = (type?: string) => {
  const normalized = type?.toLowerCase()
  if (normalized === 'image' || normalized === 'table') return normalized
  return 'text'
}
