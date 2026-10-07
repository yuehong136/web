/**
 * 内联引用标记组件
 * 用于在消息内容中展示引用标记，点击或用键盘打开浮层查看引用摘要
 *
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import type { FC, ReactNode } from 'react'
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
  getOriginalSourceHintKey,
  openOriginalSource,
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
  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:opacity-80',
  'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
)

/**
 * 内联引用标记组件。浮层只做阅读时的快速预览，不展示检索匹配评分：
 * 评分只说明检索阶段的排序，放在详情侧栏的诊断区（ReferenceDiagnostics）。
 */
export const ReferenceMarker: FC<ReferenceMarkerProps> = ({
  index,
  chunk,
  onViewDetail,
  onCopy,
  children,
}) => {
  const { t } = useTranslation()
  const displayIndex =
    chunk?.reference_index !== undefined
      ? chunk.reference_index
      : typeof children === 'number'
        ? children + 1
        : index + 1

  // 找不到对应引用时保留普通上标文本，不做没有操作的按钮
  if (!chunk) {
    return (
      <sup className="mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-background-subtle px-1 text-xs font-medium text-text-tertiary">
        {displayIndex}
      </sup>
    )
  }

  const documentName = chunk.document_name || t('reference.unknownDocument')
  const label = t('reference.marker.label', {
    index: displayIndex,
    name: documentName,
  })
  const originalSource = getOriginalSource(chunk)
  const isTableContent =
    chunk.doc_type === 'table' && chunk.content?.includes('<table')

  return (
    <Popover>
      {/* 原生按钮作触发器：键盘可达，引用详情关闭后焦点也能回到这里 */}
      <sup>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center',
              'mx-0.5 -mt-1 h-[20px] min-w-[20px] px-1.5',
              'rounded-md bg-state-focus-10 text-xs font-semibold text-text-accent',
              'transition-all duration-200 ease-out',
              'hover:scale-110 hover:shadow-xs',
              'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
            )}
          >
            {displayIndex}
          </button>
        </PopoverTrigger>
      </sup>
      <PopoverContent
        aria-label={label}
        className="w-80 overflow-hidden rounded-xl p-0"
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col bg-components-card-bg">
          {/* 头部 - 文档信息 */}
          <div className="flex items-center gap-2.5 border-b border-border-subtle bg-background-subtle px-3.5 py-2.5">
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
          <div className="px-3.5 py-3">
            {isTableContent ? (
              <SafeHtml
                className="max-h-32 overflow-auto rounded-md bg-background-subtle p-2 text-sm text-text-primary"
                html={chunk.content || ''}
                options={TABLE_PREVIEW_PURIFY_OPTIONS}
              />
            ) : (
              <p className="m-0 line-clamp-4 text-sm leading-[1.7] text-text-secondary">
                {truncateText(toPlainText(chunk.content), 200)}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 border-t border-border-subtle px-2.5 py-2">
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
              {t('reference.marker.copy')}
            </button>

            {originalSource && (
              <button
                type="button"
                className={cn(FOOTER_BUTTON_CLASS, 'text-text-secondary')}
                title={t(getOriginalSourceHintKey(originalSource))}
                onClick={(e) => {
                  e.stopPropagation()
                  openOriginalSource(originalSource)
                }}
              >
                <ExternalLink aria-hidden className="size-icon-xs" />
                {t('reference.marker.openOriginal')}
              </button>
            )}

            <div className="flex-1" />

            <button
              type="button"
              className={cn(
                FOOTER_BUTTON_CLASS,
                'gap-1 bg-state-focus-10 font-medium text-text-accent',
              )}
              onClick={(e) => {
                e.stopPropagation()
                onViewDetail?.(chunk)
              }}
            >
              {t('reference.marker.details')}
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
