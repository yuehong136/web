/**
 * 内联引用标记组件
 * 用于在消息内容中展示引用标记，点击或用键盘打开浮层查看引用摘要
 *
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import { useRef, type FC, type ReactNode } from 'react'
import { Copy, ChevronRight, ExternalLink } from 'lucide-react'
import type { Config } from 'dompurify'
import { useTranslation } from 'react-i18next'
import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SafeHtml } from '@/components/ui/safe-html'
import {
  getDocTypeIcon,
  getOriginalSource,
  getOriginalSourceLink,
  toPlainText,
} from './reference-meta'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { getChunkByRefId } from '@/utils/reference-utils'
import { useHoverPopover } from './use-hover-popover'
import { ChunkExcerpt } from '@/components/chat/chunk-excerpt'

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
  children?: ReactNode
}

// 表格预览白名单（chunk 内容来自文档解析，按不可信输入对待）
const TABLE_PREVIEW_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'br'],
  ALLOWED_ATTR: ['rowspan', 'colspan', 'class'],
}

const FOOTER_BUTTON_CLASS = cn(
  'flex items-center gap-space-xs rounded-radius-md px-space-sm py-space-xs text-xs transition-colors hover:bg-fill-hover',
  'focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden',
)

/**
 * 内联引用标记组件。浮层只做阅读时的快速预览，不展示检索匹配评分：
 * 评分只说明检索阶段的排序，放在详情面板的诊断区（ReferenceDiagnostics）。
 */
export const ReferenceMarker: FC<ReferenceMarkerProps> = ({
  index,
  chunk,
  onViewDetail,
  onCopy,
  children,
}) => {
  const { t } = useTranslation()
  const {
    open,
    onOpenChange: changeOpen,
    hoverProps,
    preventHoverFocus,
  } = useHoverPopover()
  const trigger = useRef<HTMLButtonElement>(null)
  const displayIndex =
    chunk?.reference_index !== undefined
      ? chunk.reference_index
      : typeof children === 'number'
        ? children + 1
        : index + 1

  // 找不到对应引用时保留普通上标文本，不做没有操作的按钮
  if (!chunk) {
    return (
      <sup className="mx-space-2xs inline-flex h-icon-sm min-w-icon-sm items-center justify-center rounded-radius-sm bg-sunken px-space-xs font-mono text-xs font-medium text-fg-subtle">
        {displayIndex}
      </sup>
    )
  }

  const documentName = chunk.document_name || t('sources.unknownDocument')
  const label = t('reference.marker.label', {
    index: displayIndex,
    name: documentName,
  })
  const originalSource = getOriginalSource(chunk)
  const originalLink = originalSource && getOriginalSourceLink(originalSource)
  const isTableContent =
    chunk.doc_type === 'table' && chunk.content?.includes('<table')

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      {/* 原生按钮作触发器：键盘可达，引用详情关闭后焦点也能回到这里 */}
      <sup>
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            type="button"
            aria-label={label}
            data-citation-pill
            {...hoverProps}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center align-baseline',
              'mx-space-2xs h-icon-sm min-w-icon-sm px-space-xs',
              'rounded-radius-sm border border-line bg-sunken font-mono text-xs leading-none font-medium text-fg-muted',
              'transition-colors hover:border-action-bg hover:text-accent-fg motion-reduce:transition-none',
              'aria-expanded:border-action-bg aria-expanded:bg-accent-soft aria-expanded:text-accent-fg',
              'focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden',
            )}
          >
            {displayIndex}
          </button>
        </PopoverTrigger>
      </sup>
      <PopoverContent
        aria-label={label}
        className="w-80 overflow-hidden rounded-radius-lg p-0"
        align="start"
        sideOffset={8}
        {...hoverProps}
        onOpenAutoFocus={preventHoverFocus}
      >
        <div className="flex flex-col bg-raised">
          {/* 头部 - 文档信息 */}
          <div className="flex items-center gap-space-sm border-b border-line-subtle bg-sunken px-space-base py-space-sm">
            {getDocTypeIcon(
              chunk.doc_type,
              chunk.document_name,
              'size-icon-sm',
            )}
            <span
              className="block min-w-0 flex-1 truncate text-sm font-medium text-fg"
              title={documentName}
            >
              {documentName}
            </span>
          </div>

          <ReferenceMetadataBadges metadata={chunk.document_metadata} />
          {/* 内容预览 */}
          <div className="px-space-base py-space-base">
            {isTableContent ? (
              <SafeHtml
                className="max-h-32 overflow-auto rounded-radius-md bg-sunken p-space-sm text-sm text-fg"
                html={chunk.content || ''}
                options={TABLE_PREVIEW_PURIFY_OPTIONS}
              />
            ) : (
              <ChunkExcerpt
                chunk={chunk}
                max={200}
                className="m-0 line-clamp-4 text-sm leading-relaxed text-fg-muted"
              />
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-space-xs border-t border-line-subtle px-space-sm py-space-sm">
            <button
              type="button"
              className={cn(FOOTER_BUTTON_CLASS, 'text-fg-muted')}
              onClick={(e) => {
                e.stopPropagation()
                const text = toPlainText(chunk.content)
                if (text) onCopy?.(text)
              }}
            >
              <Copy aria-hidden className="size-icon-xs" />
              {t('sources.copy')}
            </button>

            {originalLink && (
              <a
                className={cn(FOOTER_BUTTON_CLASS, 'text-fg-muted')}
                href={originalLink.href}
                target="_blank"
                rel="noopener noreferrer"
                title={t(originalLink.hintKey)}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink aria-hidden className="size-icon-xs" />
                {t(originalLink.labelKey)}
              </a>
            )}

            <div className="flex-1" />

            <button
              type="button"
              data-reference-details
              className={cn(FOOTER_BUTTON_CLASS, 'font-medium text-accent-fg')}
              onClick={(e) => {
                e.stopPropagation()
                changeOpen(false)
                trigger.current?.focus({ preventScroll: true })
                onViewDetail?.(chunk)
              }}
            >
              {t('sources.details')}
              <ChevronRight aria-hidden className="size-icon-xs" />
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
  return function SupComponent(props: { children?: ReactNode }) {
    const refIndex = parseInt(`${props?.children}` || '0', 10)
    // 与图片轮播同一规则：带 reference_index 的 keyed 引用只按编号精确匹配，
    // 缺号时不按位置回退，否则会指向另一个片段
    const chunk = getChunkByRefId(String(refIndex), references)

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
