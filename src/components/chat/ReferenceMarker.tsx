import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
/**
 * 内联引用标记组件
 * 用于在消息内容中展示引用标记，支持悬浮显示详情
 *
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, ChevronRight, ExternalLink } from 'lucide-react'
import type { Config } from 'dompurify'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SafeHtml } from '@/components/ui/safe-html'
import { getDocTypeIcon, getSimilarityColor } from './reference-meta'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ReferenceMarkerProps {
  /** 引用索引（从 0 开始） */
  index: number
  /** 引用 chunk 数据 */
  chunk: ReferenceChunk | undefined
  /** 查看详情回调 */
  onViewDetail?: (chunk: ReferenceChunk) => void
  /** 复制内容回调 */
  onCopy?: (content: string) => void
  /** XMarkdown 组件传入的 children */
  children?: React.ReactNode
}

/**
 * 截取内容摘要
 */
function truncateContent(content: string, maxLength = 150): string {
  if (!content) return ''
  // 移除 HTML 标签
  const textContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (textContent.length <= maxLength) return textContent
  return textContent.slice(0, maxLength) + '...'
}

// 表格预览白名单（chunk 内容来自文档解析，按不可信输入对待）
const TABLE_PREVIEW_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'br'],
  ALLOWED_ATTR: ['rowspan', 'colspan', 'class'],
}

/**
 * 内联引用标记组件
 */
export const ReferenceMarker: React.FC<ReferenceMarkerProps> = ({
  index,
  chunk,
  onViewDetail,
  onCopy,
  children,
}) => {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const displayIndex =
    chunk?.reference_index !== undefined
      ? chunk.reference_index
      : typeof children === 'number'
        ? children + 1
        : index + 1

  // 如果找不到对应引用，显示普通上标
  if (!chunk) {
    return (
      <sup
        className="mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-xs font-medium"
        style={{
          backgroundColor: 'var(--color-background-subtle)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {displayIndex}
      </sup>
    )
  }

  const similarity =
    typeof chunk.similarity === 'number' &&
    Number.isFinite(chunk.similarity) &&
    chunk.similarity >= 0 &&
    chunk.similarity <= 1
      ? chunk.similarity
      : undefined
  const similarityLabel =
    similarity === undefined
      ? t('sources.unavailable')
      : new Intl.NumberFormat(i18n.resolvedLanguage || i18n.language, {
          style: 'percent',
          maximumFractionDigits: 0,
        }).format(similarity)
  const similarityColor = getSimilarityColor(similarity ?? 0)
  const isTableContent =
    chunk.doc_type === 'table' && chunk.content?.includes('<table')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* 原生按钮作触发器：键盘可达，引用详情关闭后焦点也能回到这里 */}
      <sup>
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            type="button"
            aria-label={t('sources.citationLabel', { index: displayIndex })}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center',
              'mx-0.5 -mt-1 h-[20px] min-w-[20px] px-1.5',
              'rounded-md text-xs font-semibold',
              'transition-all duration-200 ease-out',
              'hover:scale-110 hover:shadow-xs',
              'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
            )}
            style={{
              backgroundColor: 'var(--color-state-focus-10)',
              color: 'var(--color-text-accent)',
              borderColor: 'var(--color-border-accent)',
            }}
          >
            {displayIndex}
          </button>
        </PopoverTrigger>
      </sup>
      <PopoverContent
        className="w-80 overflow-hidden rounded-xl p-0"
        align="start"
        sideOffset={8}
      >
        <div
          className="flex flex-col"
          style={{ backgroundColor: 'var(--color-components-card-bg)' }}
        >
          {/* 头部 - 文档信息 + 相似度 badge */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5"
            style={{
              borderBottom: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-background-subtle)',
            }}
          >
            {getDocTypeIcon(chunk.doc_type, chunk.document_name, 'h-4 w-4')}
            <div className="min-w-0 flex-1">
              <span
                className="block truncate text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
                title={chunk.document_name}
              >
                {chunk.document_name || t('sources.unknownDocument')}
              </span>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: similarityColor,
                // 反色文字随主题翻转（浅色白字、暗色深字），三档相似度底色上都可读
                color: 'var(--color-text-inverted)',
              }}
            >
              {similarityLabel}
            </span>
          </div>

          <ReferenceMetadataBadges metadata={chunk.document_metadata} />
          {/* 内容预览 */}
          <div className="px-3.5 py-3">
            {isTableContent ? (
              <SafeHtml
                className="max-h-32 overflow-auto rounded-md p-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-background-subtle)',
                  color: 'var(--color-text-primary)',
                }}
                html={chunk.content || ''}
                options={TABLE_PREVIEW_PURIFY_OPTIONS}
              />
            ) : (
              <p
                className="m-0 line-clamp-4 text-sm leading-[1.7]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {truncateContent(chunk.content || '', 200)}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div
            className="flex items-center gap-1 px-2.5 py-2"
            style={{
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            <button
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:opacity-80"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (chunk.content) {
                  const textContent = chunk.content
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                  onCopy?.(textContent)
                }
              }}
            >
              <Copy className="h-3 w-3" />
              {t('sources.copy')}
            </button>

            {chunk.document_id && (
              <a
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:opacity-80"
                href={`/document/${encodeURIComponent(chunk.document_id)}/preview?${new URLSearchParams({ name: chunk.document_name || '' })}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                {t('sources.viewDocument')}
              </a>
            )}

            <div className="flex-1" />

            <button
              type="button"
              data-reference-details
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                color: 'var(--color-text-accent)',
                backgroundColor: 'var(--color-state-focus-10)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                trigger.current?.focus({ preventScroll: true })
                onViewDetail?.(chunk)
              }}
            >
              {t('sources.details')}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * 创建用于 XMarkdown 的 sup 组件渲染函数
 */
export function createReferenceMarkerComponent(
  references: ReferenceChunk[],
  options?: {
    onViewDetail?: (chunk: ReferenceChunk) => void
    onCopy?: (content: string) => void
  },
) {
  return function SupComponent(props: { children?: React.ReactNode }) {
    const refIndex = parseInt(`${props?.children}` || '0', 10)
    const chunk =
      references.find((item) => item.reference_index === refIndex) ||
      references[refIndex]

    return (
      <ReferenceMarker
        index={refIndex}
        chunk={chunk}
        onViewDetail={options?.onViewDetail}
        onCopy={options?.onCopy}
      >
        {props?.children}
      </ReferenceMarker>
    )
  }
}

export default ReferenceMarker
