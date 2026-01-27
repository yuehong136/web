/**
 * @deprecated 此组件已废弃，请使用 ReferenceMarker 组件代替
 * @see {@link ./ReferenceMarker.tsx} 新版内联引用标记组件
 * 
 * 内联引用组件
 * 用于在消息内容中展示引用标记，支持悬浮显示详情
 * 参考 ragflow 的引用交互设计和 @ant-design/x Sources 组件
 */
import React from 'react'
import { FileText, ExternalLink, Info } from 'lucide-react'
import { Sources } from '@ant-design/x'
import type { SourcesProps } from '@ant-design/x'
import type { ComponentProps } from '@ant-design/x-markdown'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface InlineSourceRefProps {
  /** 引用索引（从 0 开始） */
  index: number
  /** 引用数据列表 */
  references: ReferenceChunk[]
  /** 点击引用时的回调 */
  onReferenceClick?: (reference: ReferenceChunk, index: number) => void
  /** 显示模式: inline 内联 Sources, popover 悬浮卡片, badge 徽章 */
  mode?: 'inline' | 'popover' | 'badge'
  /** XMarkdown 组件传入的 children */
  children?: React.ReactNode
}

/**
 * 获取文档图标
 */
function getDocIcon(docName?: string) {
  if (!docName) return <FileText className="h-3 w-3" />
  
  const ext = docName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return <FileText className="h-3 w-3 text-red-500" />
    case 'doc':
    case 'docx':
      return <FileText className="h-3 w-3 text-blue-500" />
    default:
      return <FileText className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
  }
}

/**
 * 截取内容摘要
 */
function truncateContent(content: string, maxLength = 200): string {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

/**
 * 内联引用组件 - 使用 @ant-design/x Sources inline 模式
 */
export function InlineSourceRef({
  index,
  references,
  onReferenceClick,
  mode = 'inline',
  children
}: InlineSourceRefProps) {
  const reference = references[index]
  
  // 如果找不到对应引用，显示普通上标
  if (!reference) {
    return <sup className="text-blue-500">{children}</sup>
  }
  
  // inline 模式 - 使用 Sources 组件的 inline 属性
  if (mode === 'inline') {
    const items: SourcesProps['items'] = [{
      key: reference.id || `ref-${index}`,
      title: reference.document_name || `来源 ${index + 1}`,
      icon: getDocIcon(reference.document_name),
      description: truncateContent(reference.content || ''),
      url: reference.url || undefined
    }]
    
    return (
      <Sources
        activeKey={index}
        title={children}
        items={items}
        inline={true}
        onClick={() => onReferenceClick?.(reference, index)}
      />
    )
  }
  
  // popover 模式 - 使用悬浮卡片展示详情（参考 ragflow）
  if (mode === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <sup
            className={cn(
              "inline-flex items-center justify-center cursor-pointer",
              "min-w-[18px] h-[18px] px-1 mx-0.5 -mt-1",
              "text-xs font-medium rounded",
              "bg-blue-100 text-blue-700 hover:bg-blue-200",
              "dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50",
              "transition-colors"
            )}
            onClick={() => onReferenceClick?.(reference, index)}
          >
            {typeof children === 'number' ? children + 1 : children}
          </sup>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div 
            className="p-4"
            style={{ backgroundColor: 'var(--color-components-card-bg)' }}
          >
            {/* 文档标题 */}
            <div className="flex items-center gap-2 mb-2">
              {getDocIcon(reference.document_name)}
              <span 
                className="font-medium text-sm truncate flex-1"
                style={{ color: 'var(--color-text-primary)' }}
                title={reference.document_name}
              >
                {reference.document_name || '未知文档'}
              </span>
              {reference.url && (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink 
                    className="h-3.5 w-3.5" 
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                </a>
              )}
            </div>
            
            {/* 内容摘要 */}
            {reference.content && (
              <div 
                className="text-sm leading-relaxed line-clamp-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {reference.content}
              </div>
            )}
            
            {/* 相似度信息 */}
            {reference.similarity !== undefined && (
              <div 
                className="mt-2 pt-2 text-xs flex items-center gap-1"
                style={{ 
                  borderTop: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-tertiary)'
                }}
              >
                <Info className="h-3 w-3" />
                <span>相似度: {(reference.similarity * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
  
  // badge 模式 - 简单的徽章样式
  return (
    <sup
      className={cn(
        "inline-flex items-center justify-center cursor-pointer",
        "min-w-[16px] h-[16px] px-1 mx-0.5",
        "text-[10px] font-medium rounded-full",
        "bg-blue-100 text-blue-600 hover:bg-blue-200",
        "dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50",
        "transition-colors"
      )}
      title={reference.document_name || `来源 ${index + 1}`}
      onClick={() => onReferenceClick?.(reference, index)}
    >
      {typeof children === 'number' ? children + 1 : children}
    </sup>
  )
}

/**
 * 创建用于 XMarkdown 的 sup 组件渲染函数
 * 根据引用列表生成对应的内联引用组件
 */
export function createSupComponent(
  references: ReferenceChunk[],
  options?: {
    mode?: InlineSourceRefProps['mode']
    onReferenceClick?: InlineSourceRefProps['onReferenceClick']
  }
) {
  return function SupComponent(props: ComponentProps) {
    const refIndex = parseInt(`${props?.children}` || '0', 10)
    
    return (
      <InlineSourceRef
        index={refIndex}
        references={references}
        mode={options?.mode || 'inline'}
        onReferenceClick={options?.onReferenceClick}
      >
        {props?.children}
      </InlineSourceRef>
    )
  }
}

export default InlineSourceRef
