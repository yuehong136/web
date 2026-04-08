/**
 * 内联引用标记组件
 * 用于在消息内容中展示引用标记，支持悬浮显示详情
 * 
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import React from 'react'
import { 
  FileText, 
  Table2, 
  Image, 
  Copy,
  FileType,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
 * 获取文档类型图标
 */
function getDocTypeIcon(docType?: string, docName?: string) {
  // 根据 doc_type 判断
  if (docType === 'table') {
    return <Table2 className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
  }
  if (docType === 'image') {
    return <Image className="h-4 w-4" style={{ color: 'var(--color-text-success)' }} />
  }
  
  // 根据文件扩展名判断
  if (docName) {
    const ext = docName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <FileText className="h-4 w-4" style={{ color: 'var(--color-text-error)' }} />
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
      case 'xls':
      case 'xlsx':
        return <Table2 className="h-4 w-4" style={{ color: 'var(--color-text-success)' }} />
      case 'md':
      case 'mdx':
        return <FileType className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
    }
  }
  
  return <FileText className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
}

/**
 * 获取文档类型标签
 */
function getDocTypeLabel(docType?: string): string {
  switch (docType) {
    case 'table':
      return '表格'
    case 'image':
      return '图片'
    default:
      return '文本'
  }
}

/**
 * 获取相似度颜色
 */
function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return 'var(--color-text-success)'
  if (similarity >= 0.6) return 'var(--color-text-accent)'
  return 'var(--color-text-tertiary)'
}

/**
 * 获取相似度等级标签
 */
function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) return '高度匹配'
  if (similarity >= 0.6) return '较为相关'
  return '可能相关'
}

/**
 * 截取内容摘要
 */
function truncateContent(content: string, maxLength = 150): string {
  if (!content) return ''
  // 移除 HTML 标签
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (textContent.length <= maxLength) return textContent
  return textContent.slice(0, maxLength) + '...'
}

/**
 * 安全渲染 HTML 内容（用于表格预览）
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'br'],
    ALLOWED_ATTR: ['rowspan', 'colspan', 'class'],
  })
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
  const displayIndex = typeof children === 'number' ? children + 1 : (index + 1)
  
  // 如果找不到对应引用，显示普通上标
  if (!chunk) {
    return (
      <sup 
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 mx-0.5 text-xs font-medium rounded"
        style={{ 
          backgroundColor: 'var(--color-background-subtle)',
          color: 'var(--color-text-tertiary)'
        }}
      >
        {displayIndex}
      </sup>
    )
  }

  const similarity = chunk.similarity ?? 0
  const similarityPercent = Math.round(similarity * 100)
  const similarityColor = getSimilarityColor(similarity)
  const isTableContent = chunk.doc_type === 'table' && chunk.content?.includes('<table')
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <sup
          className={cn(
            "inline-flex items-center justify-center cursor-pointer",
            "min-w-[20px] h-[20px] px-1.5 mx-0.5 -mt-1",
            "text-xs font-semibold rounded-md",
            "transition-all duration-200 ease-out",
            "hover:scale-110 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-offset-1"
          )}
          style={{ 
            backgroundColor: 'var(--color-state-focus-10)',
            color: 'var(--color-text-accent)',
            borderColor: 'var(--color-border-accent)',
          }}
        >
          {displayIndex}
        </sup>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 overflow-hidden rounded-xl" 
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
              backgroundColor: 'var(--color-background-subtle)'
            }}
          >
            {getDocTypeIcon(chunk.doc_type, chunk.document_name)}
            <div className="flex-1 min-w-0">
              <span 
                className="font-medium text-sm truncate block"
                style={{ color: 'var(--color-text-primary)' }}
                title={chunk.document_name}
              >
                {chunk.document_name || '未知文档'}
              </span>
            </div>
            <span 
              className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: similarityColor,
                color: '#fff',
                opacity: 0.9,
              }}
            >
              {similarityPercent}%
            </span>
          </div>
          
          {/* 内容预览 */}
          <div className="px-3.5 py-3">
            {isTableContent ? (
              <div 
                className="text-sm overflow-auto max-h-32 rounded-md p-2"
                style={{ 
                  backgroundColor: 'var(--color-background-subtle)',
                  color: 'var(--color-text-primary)'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(chunk.content || '') 
                }}
              />
            ) : (
              <p 
                className="text-sm leading-[1.7] line-clamp-4 m-0"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors hover:opacity-80"
              style={{ 
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (chunk.content) {
                  const textContent = chunk.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                  onCopy?.(textContent)
                }
              }}
            >
              <Copy className="h-3 w-3" />
              复制
            </button>
            
            {chunk.document_id && (
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors hover:opacity-80"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  const params = new URLSearchParams()
                  if (chunk.document_name) params.set('name', chunk.document_name)
                  window.open(
                    `/document/${chunk.document_id}/preview?${params.toString()}`,
                    '_blank',
                  )
                }}
              >
                <ExternalLink className="h-3 w-3" />
                原文
              </button>
            )}

            <div className="flex-1" />

            <button
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors hover:opacity-80"
              style={{ 
                color: 'var(--color-text-accent)',
                backgroundColor: 'var(--color-state-focus-10)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                onViewDetail?.(chunk)
              }}
            >
              详情
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
  }
) {
  return function SupComponent(props: { children?: React.ReactNode }) {
    const refIndex = parseInt(`${props?.children}` || '0', 10)
    const chunk = references[refIndex]
    
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
