/**
 * 引用面板组件
 * 用于在消息底部展示引用的文档来源，支持按文档分组、折叠展开
 *
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import { useId, useMemo, useState, type FC } from 'react'
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import {
  getDocTypeIcon,
  getDocTypeLabelKey,
  toPlainText,
  truncateText,
} from './reference-meta'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

/**
 * 文档聚合数据类型
 */
export interface DocAgg {
  doc_name: string
  doc_id: string
  count: number
}

export interface ReferencePanelProps {
  /** 引用的 chunks 列表 */
  chunks: ReferenceChunk[]
  variant?: 'card' | 'inline'
  /** 点击 chunk 时的回调 */
  onChunkClick?: (chunk: ReferenceChunk) => void
  /** 自定义类名 */
  className?: string
  /** 每个文档默认显示的 chunk 数量 */
  defaultVisiblePerDoc?: number
  /** 是否默认展开 */
  defaultExpanded?: boolean
}

const FOCUS_RING_CLASS =
  'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden'

interface DocumentGroupData {
  /** 文档名；缺失时为空串，渲染时显示“未知文档” */
  docName: string
  chunks: Array<{ chunk: ReferenceChunk; index: number }>
}

/**
 * 按文档分组 chunks
 */
function groupChunksByDocument(
  chunks: ReferenceChunk[],
): Map<string, DocumentGroupData> {
  const groups = new Map<string, DocumentGroupData>()

  chunks.forEach((chunk, index) => {
    const docId = chunk.document_id || 'unknown'
    const groupKey = JSON.stringify([chunk.dataset_id, docId])
    const existing = groups.get(groupKey)

    if (existing) {
      existing.chunks.push({ chunk, index })
    } else {
      groups.set(groupKey, {
        docName: chunk.document_name || '',
        chunks: [{ chunk, index }],
      })
    }
  })

  return groups
}

/**
 * 单个 Chunk 项组件。来源列表用于阅读与定位片段，不展示检索匹配评分：
 * 评分只在详情侧栏的诊断区展示。
 */
interface ChunkItemProps {
  chunk: ReferenceChunk
  index: number
  onClick?: (chunk: ReferenceChunk) => void
}

const ChunkItem: FC<ChunkItemProps> = ({ chunk, index, onClick }) => {
  const { t } = useTranslation()
  const displayIndex = chunk.reference_index ?? index + 1

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors',
        'hover:bg-state-hover',
        FOCUS_RING_CLASS,
      )}
      onClick={() => onClick?.(chunk)}
    >
      {/* 索引标记 */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-state-focus-10 text-xs font-medium text-text-accent">
        {displayIndex}
      </span>

      {/* 内容区域 */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          {/* 类型标签 */}
          <span className="rounded bg-background-subtle px-1.5 py-0.5 text-xs text-text-tertiary">
            {t(getDocTypeLabelKey(chunk.doc_type))}
          </span>
        </div>
        <ReferenceMetadataBadges metadata={chunk.document_metadata} />
        {/* 内容摘要 */}
        <p className="line-clamp-2 text-sm text-text-secondary">
          {truncateText(toPlainText(chunk.content), 100)}
        </p>
      </div>

      <ChevronRight
        aria-hidden
        className="mt-0.5 size-icon-sm shrink-0 text-text-tertiary"
      />
    </button>
  )
}

/**
 * 文档分组组件
 */
interface DocumentGroupProps {
  docName: string
  chunks: Array<{ chunk: ReferenceChunk; index: number }>
  defaultVisible: number
  inline: boolean
  onChunkClick?: (chunk: ReferenceChunk) => void
}

const DocumentGroup: FC<DocumentGroupProps> = ({
  docName,
  chunks,
  defaultVisible,
  inline,
  onChunkClick,
}) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const visibleChunks = expanded ? chunks : chunks.slice(0, defaultVisible)
  const hasMore = chunks.length > defaultVisible
  const displayName = docName || t('reference.unknownDocument')

  // 获取文档的主要类型图标（取第一个 chunk 的类型）
  const primaryChunk = chunks[0]?.chunk

  return (
    <div
      className={
        inline
          ? 'overflow-hidden border-l border-border-subtle pl-space-xs'
          : 'overflow-hidden rounded-lg border border-components-card-border bg-components-card-bg'
      }
    >
      {/* 文档头部 */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2',
          !inline && 'border-b border-border-subtle bg-background-subtle',
        )}
      >
        {getDocTypeIcon(primaryChunk?.doc_type, docName, 'size-icon-sm')}
        <span
          className="flex-1 truncate text-sm font-medium text-text-primary"
          title={displayName}
        >
          {displayName}
        </span>
        <span className="rounded-full bg-background-default px-1.5 py-0.5 text-xs text-text-tertiary">
          {t('reference.panel.chunkCount', { count: chunks.length })}
        </span>
      </div>

      {/* Chunk 列表 */}
      <div className="divide-y divide-border-subtle">
        {visibleChunks.map(({ chunk, index }) => (
          <ChunkItem
            key={`${chunk.id || chunk.document_id || 'chunk'}-${index}`}
            chunk={chunk}
            index={index}
            onClick={onChunkClick}
          />
        ))}
      </div>

      {/* 展开更多按钮 */}
      {hasMore && (
        <button
          type="button"
          aria-expanded={expanded}
          className={cn(
            'flex w-full items-center justify-center gap-1 border-t border-border-subtle px-3 py-2 text-xs font-medium text-text-accent transition-colors',
            FOCUS_RING_CLASS,
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronDown aria-hidden className="size-icon-xs" />
              {t('reference.panel.showLess')}
            </>
          ) : (
            <>
              {t('reference.panel.showMore', {
                count: chunks.length - defaultVisible,
              })}
              <ChevronRight aria-hidden className="size-icon-xs" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

/**
 * 引用面板组件
 */
export const ReferencePanel: FC<ReferencePanelProps> = ({
  chunks,
  onChunkClick,
  className,
  defaultVisiblePerDoc = 2,
  defaultExpanded = false,
  variant = 'card',
}) => {
  const { t } = useTranslation()
  const contentId = useId()
  const inline = variant === 'inline'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // 按文档分组
  const documentGroups = useMemo(() => groupChunksByDocument(chunks), [chunks])

  const documentCount = documentGroups.size
  const totalChunks = chunks.length

  if (totalChunks === 0) return null

  const ToggleIcon = isExpanded ? ChevronDown : ChevronRight

  return (
    <div className={cn('@container mt-4', className)}>
      {/* 面板头部；窄容器（如 Studio 预览气泡）只显示引用数，标题不折行 */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={cn(
          'flex items-center gap-2 transition-colors',
          inline
            ? 'max-w-full rounded-md py-1 text-text-secondary hover:text-text-primary'
            : 'w-full rounded-lg border border-border-subtle bg-background-subtle px-3 py-2',
          FOCUS_RING_CLASS,
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <BookOpen
          aria-hidden
          className="size-icon-sm shrink-0 text-text-accent"
        />
        <span className="flex-1 text-left text-sm font-medium whitespace-nowrap text-text-primary">
          {t('reference.panel.title')}
        </span>
        <span
          className={cn(
            'shrink-0 text-xs whitespace-nowrap',
            !inline &&
              'rounded-full bg-state-focus-10 px-2 py-0.5 text-text-accent',
          )}
        >
          <span className="hidden @2xs:inline">
            {t('reference.panel.documentCount', { count: documentCount })}
            {' · '}
          </span>
          {t('reference.panel.chunkCount', { count: totalChunks })}
        </span>
        <ToggleIcon
          aria-hidden
          className="size-icon-sm shrink-0 text-text-tertiary"
        />
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div id={contentId} className="mt-2 space-y-2">
          {Array.from(documentGroups.entries()).map(([groupKey, group]) => (
            <DocumentGroup
              key={groupKey}
              inline={inline}
              docName={group.docName}
              chunks={group.chunks}
              defaultVisible={defaultVisiblePerDoc}
              onChunkClick={onChunkClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ReferencePanel
