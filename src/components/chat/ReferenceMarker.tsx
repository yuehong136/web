/**
 * 内联引用标记组件
 * 用于在消息内容中展示引用标记，点击或用键盘打开浮层查看引用摘要
 *
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import {
  useEffect,
  useRef,
  useState,
  type FC,
  type PointerEvent,
  type ReactNode,
} from 'react'
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
  truncateText,
} from './reference-meta'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { getChunkByRefId } from '@/utils/reference-utils'

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
  'flex items-center gap-space-xs rounded-radius-md px-space-sm py-space-xs text-xs transition-colors hover:bg-state-hover',
  'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
)
// A pointer resting on the pill previews it; moving away closes it again.
const HOVER_OPEN_DELAY = 350
const HOVER_CLOSE_DELAY = 200

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
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Hover previews must not pull keyboard focus into the popover.
  const openedByHover = useRef(false)
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const hoverOpen = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimer()
    if (open) return
    timer.current = setTimeout(() => {
      openedByHover.current = true
      setOpen(true)
    }, HOVER_OPEN_DELAY)
  }
  const hoverClose = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimer()
    if (!openedByHover.current) return
    timer.current = setTimeout(() => {
      openedByHover.current = false
      setOpen(false)
    }, HOVER_CLOSE_DELAY)
  }
  const changeOpen = (next: boolean) => {
    clearTimer()
    openedByHover.current = false
    setOpen(next)
  }
  const displayIndex =
    chunk?.reference_index !== undefined
      ? chunk.reference_index
      : typeof children === 'number'
        ? children + 1
        : index + 1

  // 找不到对应引用时保留普通上标文本，不做没有操作的按钮
  if (!chunk) {
    return (
      <sup className="mx-space-2xs inline-flex h-icon-sm min-w-icon-sm items-center justify-center rounded-radius-sm bg-background-subtle px-space-xs font-mono text-xs font-medium text-text-tertiary">
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
            onPointerEnter={hoverOpen}
            onPointerLeave={hoverClose}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center align-baseline',
              'mx-space-2xs h-icon-sm min-w-icon-sm px-space-xs',
              'rounded-radius-sm border border-border-default bg-background-subtle font-mono text-xs leading-none font-medium text-text-secondary',
              'transition-colors hover:border-components-button-primary-bg hover:text-text-accent motion-reduce:transition-none',
              'aria-expanded:border-components-button-primary-bg aria-expanded:bg-state-selected-bg aria-expanded:text-state-selected-text',
              'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
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
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onOpenAutoFocus={(event) => {
          if (openedByHover.current) event.preventDefault()
        }}
      >
        <div className="flex flex-col bg-components-card-bg">
          {/* 头部 - 文档信息 */}
          <div className="flex items-center gap-space-sm border-b border-border-subtle bg-background-subtle px-space-base py-space-sm">
            {getDocTypeIcon(
              chunk.doc_type,
              chunk.document_name,
              'size-icon-sm',
            )}
            <span
              className="block min-w-0 flex-1 truncate text-sm font-medium text-text-primary"
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
                className="max-h-32 overflow-auto rounded-radius-md bg-background-subtle p-space-sm text-sm text-text-primary"
                html={chunk.content || ''}
                options={TABLE_PREVIEW_PURIFY_OPTIONS}
              />
            ) : (
              <p className="m-0 line-clamp-4 text-sm leading-relaxed text-text-secondary">
                {truncateText(toPlainText(chunk.content), 200)}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-space-xs border-t border-border-subtle px-space-sm py-space-sm">
            <button
              type="button"
              className={cn(FOOTER_BUTTON_CLASS, 'text-text-secondary')}
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
                className={cn(FOOTER_BUTTON_CLASS, 'text-text-secondary')}
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
              className={cn(
                FOOTER_BUTTON_CLASS,
                'font-medium text-text-accent',
              )}
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
