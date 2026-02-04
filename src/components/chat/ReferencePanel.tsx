/**
 * 引用面板组件
 * 用于在消息底部展示引用的文档来源，支持按文档分组、折叠展开
 * 
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import React from 'react'
import { 
  FileText, 
  Table2, 
  Image, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  FileType
} from 'lucide-react'
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
  /** 文档聚合数据（可选） */
  docAggs?: DocAgg[]
  /** 点击 chunk 时的回调 */
  onChunkClick?: (chunk: ReferenceChunk) => void
  /** 自定义类名 */
  className?: string
  /** 每个文档默认显示的 chunk 数量 */
  defaultVisiblePerDoc?: number
  /** 是否默认展开 */
  defaultExpanded?: boolean
}

/**
 * 获取文档类型图标
 */
function getDocTypeIcon(docType?: string, docName?: string, size: 'sm' | 'md' = 'sm') {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  
  if (docType === 'table') {
    return <Table2 className={sizeClass} style={{ color: 'var(--color-text-accent)' }} />
  }
  if (docType === 'image') {
    return <Image className={sizeClass} style={{ color: 'var(--color-text-success)' }} />
  }
  
  if (docName) {
    const ext = docName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <FileText className={sizeClass} style={{ color: 'var(--color-text-error)' }} />
      case 'doc':
      case 'docx':
        return <FileText className={sizeClass} style={{ color: 'var(--color-text-accent)' }} />
      case 'xls':
      case 'xlsx':
        return <Table2 className={sizeClass} style={{ color: 'var(--color-text-success)' }} />
      case 'md':
      case 'mdx':
        return <FileType className={sizeClass} style={{ color: 'var(--color-text-secondary)' }} />
    }
  }
  
  return <FileText className={sizeClass} style={{ color: 'var(--color-text-tertiary)' }} />
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
 * 截取内容摘要
 */
function truncateContent(content: string, maxLength = 80): string {
  if (!content) return ''
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (textContent.length <= maxLength) return textContent
  return textContent.slice(0, maxLength) + '...'
}

/**
 * 按文档分组 chunks
 */
function groupChunksByDocument(
  chunks: ReferenceChunk[],
  docAggs?: DocAgg[]
): Map<string, { docName: string; docId: string; chunks: Array<{ chunk: ReferenceChunk; index: number }> }> {
  const groups = new Map<string, { docName: string; docId: string; chunks: Array<{ chunk: ReferenceChunk; index: number }> }>()
  
  chunks.forEach((chunk, index) => {
    const docId = chunk.document_id || 'unknown'
    const existing = groups.get(docId)
    
    if (existing) {
      existing.chunks.push({ chunk, index })
    } else {
      groups.set(docId, {
        docName: chunk.document_name || '未知文档',
        docId,
        chunks: [{ chunk, index }]
      })
    }
  })
  
  return groups
}

/**
 * 单个 Chunk 项组件
 */
interface ChunkItemProps {
  chunk: ReferenceChunk
  index: number
  onClick?: (chunk: ReferenceChunk) => void
}

const ChunkItem: React.FC<ChunkItemProps> = ({ chunk, index, onClick }) => {
  const similarity = chunk.similarity ?? 0
  const similarityPercent = Math.round(similarity * 100)
  const similarityColor = getSimilarityColor(similarity)
  
  return (
    <button
      className={cn(
        "w-full flex items-start gap-2 px-3 py-2 text-left rounded-md transition-colors",
        "hover:bg-[var(--color-state-hover)]"
      )}
      onClick={() => onClick?.(chunk)}
    >
      {/* 索引标记 */}
      <span 
        className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-xs font-medium rounded"
        style={{ 
          backgroundColor: 'var(--color-state-focus-10)',
          color: 'var(--color-text-accent)'
        }}
      >
        {index + 1}
      </span>
      
      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* 类型标签 */}
          <span 
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ 
              backgroundColor: 'var(--color-background-subtle)',
              color: 'var(--color-text-tertiary)'
            }}
          >
            {getDocTypeLabel(chunk.doc_type)}
          </span>
          {/* 相似度 */}
          <span 
            className="text-xs font-medium"
            style={{ color: similarityColor }}
          >
            {similarityPercent}%
          </span>
        </div>
        {/* 内容摘要 */}
        <p 
          className="text-sm line-clamp-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {truncateContent(chunk.content || '', 100)}
        </p>
      </div>
      
      <ChevronRight 
        className="flex-shrink-0 h-4 w-4 mt-0.5" 
        style={{ color: 'var(--color-text-tertiary)' }}
      />
    </button>
  )
}

/**
 * 文档分组组件
 */
interface DocumentGroupProps {
  docName: string
  docId: string
  chunks: Array<{ chunk: ReferenceChunk; index: number }>
  defaultVisible: number
  onChunkClick?: (chunk: ReferenceChunk) => void
}

const DocumentGroup: React.FC<DocumentGroupProps> = ({
  docName,
  docId,
  chunks,
  defaultVisible,
  onChunkClick
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const visibleChunks = expanded ? chunks : chunks.slice(0, defaultVisible)
  const hasMore = chunks.length > defaultVisible
  
  // 获取文档的主要类型图标（取第一个 chunk 的类型）
  const primaryChunk = chunks[0]?.chunk
  
  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: 'var(--color-components-card-bg)',
        border: '1px solid var(--color-components-card-border)'
      }}
    >
      {/* 文档头部 */}
      <div 
        className="flex items-center gap-2 px-3 py-2"
        style={{ 
          backgroundColor: 'var(--color-background-subtle)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        {getDocTypeIcon(primaryChunk?.doc_type, docName, 'md')}
        <span 
          className="flex-1 font-medium text-sm truncate"
          style={{ color: 'var(--color-text-primary)' }}
          title={docName}
        >
          {docName}
        </span>
        <span 
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ 
            backgroundColor: 'var(--color-background-default)',
            color: 'var(--color-text-tertiary)'
          }}
        >
          {chunks.length} 条引用
        </span>
      </div>
      
      {/* Chunk 列表 */}
      <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
        {visibleChunks.map(({ chunk, index }) => (
          <ChunkItem
            key={chunk.id || `chunk-${index}`}
            chunk={chunk}
            index={index}
            onClick={onChunkClick}
          />
        ))}
      </div>
      
      {/* 展开更多按钮 */}
      {hasMore && (
        <button
          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors"
          style={{ 
            color: 'var(--color-text-accent)',
            borderTop: '1px solid var(--color-border-subtle)'
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              收起
            </>
          ) : (
            <>
              查看更多 ({chunks.length - defaultVisible} 条)
              <ChevronRight className="h-3 w-3" />
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
export const ReferencePanel: React.FC<ReferencePanelProps> = ({
  chunks,
  docAggs,
  onChunkClick,
  className,
  defaultVisiblePerDoc = 2,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  
  // 按文档分组
  const documentGroups = React.useMemo(
    () => groupChunksByDocument(chunks, docAggs),
    [chunks, docAggs]
  )
  
  const documentCount = documentGroups.size
  const totalChunks = chunks.length
  
  if (totalChunks === 0) return null
  
  return (
    <div className={cn("mt-4", className)}>
      {/* 面板头部 */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{ 
          backgroundColor: 'var(--color-background-subtle)',
          border: '1px solid var(--color-border-subtle)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <BookOpen 
          className="h-4 w-4" 
          style={{ color: 'var(--color-text-accent)' }}
        />
        <span 
          className="flex-1 text-left text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          引用来源
        </span>
        <span 
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ 
            backgroundColor: 'var(--color-state-focus-10)',
            color: 'var(--color-text-accent)'
          }}
        >
          {documentCount} 个文档 · {totalChunks} 条引用
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
        ) : (
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
        )}
      </button>
      
      {/* 展开内容 */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {Array.from(documentGroups.entries()).map(([_docId, group]) => (
            <DocumentGroup
              key={group.docId}
              docName={group.docName}
              docId={group.docId}
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
