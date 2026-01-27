/**
 * @deprecated 此组件已废弃，请使用 ReferencePanel 组件代替
 * @see {@link ./ReferencePanel.tsx} 新版引用面板组件
 * 
 * 参考文献列表组件
 * 参考 ragflow 的 ReferenceDocumentList 组件设计
 * 用于在消息底部展示引用的文档来源
 */
import React from 'react'
import { FileText, ExternalLink, ChevronRight } from 'lucide-react'
import { Sources } from '@ant-design/x'
import type { SourcesProps } from '@ant-design/x'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ReferenceDocument {
  doc_id: string
  doc_name: string
  count?: number
  url?: string
}

export interface ReferenceDocumentListProps {
  /** 引用的文档列表 */
  documents?: ReferenceDocument[]
  /** 引用的 chunks 列表（可选，用于获取更详细信息） */
  chunks?: ReferenceChunk[]
  /** 显示模式: card 卡片模式, sources 使用 @ant-design/x Sources 组件 */
  mode?: 'card' | 'sources'
  /** 点击文档时的回调 */
  onDocumentClick?: (document: ReferenceDocument) => void
  /** 自定义类名 */
  className?: string
  /** 最大显示数量 */
  maxItems?: number
  /** 是否显示展开按钮 */
  collapsible?: boolean
}

/**
 * 从 chunks 中提取唯一的文档聚合信息
 */
export function extractDocumentsFromChunks(chunks: ReferenceChunk[]): ReferenceDocument[] {
  const docMap = new Map<string, ReferenceDocument>()
  
  chunks.forEach(chunk => {
    if (!chunk.document_id) return
    
    const existing = docMap.get(chunk.document_id)
    if (existing) {
      existing.count = (existing.count || 1) + 1
    } else {
      docMap.set(chunk.document_id, {
        doc_id: chunk.document_id,
        doc_name: chunk.document_name || '未知文档',
        count: 1,
        url: chunk.url || undefined
      })
    }
  })
  
  return Array.from(docMap.values())
}

/**
 * 获取文档图标（根据文件类型）
 */
function getDocumentIcon(docName: string) {
  const ext = docName.split('.').pop()?.toLowerCase()
  
  // 可以根据扩展名返回不同的图标
  switch (ext) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />
    case 'doc':
    case 'docx':
      return <FileText className="h-4 w-4 text-blue-500" />
    case 'xls':
    case 'xlsx':
      return <FileText className="h-4 w-4 text-green-500" />
    case 'ppt':
    case 'pptx':
      return <FileText className="h-4 w-4 text-orange-500" />
    case 'md':
    case 'txt':
      return <FileText className="h-4 w-4 text-gray-500" />
    default:
      return <FileText className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
  }
}

/**
 * 卡片模式下的文档项组件
 */
function DocumentCard({ 
  document, 
  onClick 
}: { 
  document: ReferenceDocument
  onClick?: (document: ReferenceDocument) => void 
}) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        "border hover:border-blue-300"
      )}
      style={{ 
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: 'var(--color-components-card-border)'
      }}
      onClick={() => onClick?.(document)}
    >
      <CardContent className="p-2 flex items-center gap-2">
        {getDocumentIcon(document.doc_name)}
        <span 
          className="text-sm truncate flex-1"
          style={{ color: 'var(--color-text-primary)' }}
          title={document.doc_name}
        >
          {document.doc_name}
        </span>
        {document.count && document.count > 1 && (
          <span 
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ 
              backgroundColor: 'var(--color-background-subtle)',
              color: 'var(--color-text-tertiary)'
            }}
          >
            {document.count}
          </span>
        )}
        {document.url && (
          <ExternalLink 
            className="h-3 w-3 flex-shrink-0" 
            style={{ color: 'var(--color-text-tertiary)' }} 
          />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 参考文献列表组件
 */
export function ReferenceDocumentList({
  documents,
  chunks,
  mode = 'sources',
  onDocumentClick,
  className,
  maxItems = 10,
  collapsible = true
}: ReferenceDocumentListProps) {
  const [expanded, setExpanded] = React.useState(false)
  
  // 如果提供了 chunks 但没有 documents，则从 chunks 中提取
  const docList = React.useMemo(() => {
    if (documents && documents.length > 0) return documents
    if (chunks && chunks.length > 0) return extractDocumentsFromChunks(chunks)
    return []
  }, [documents, chunks])
  
  if (docList.length === 0) return null
  
  // 确定要显示的文档
  const displayDocs = collapsible && !expanded 
    ? docList.slice(0, maxItems) 
    : docList
  const hasMore = collapsible && docList.length > maxItems
  
  // Sources 模式 - 使用 @ant-design/x 的 Sources 组件
  if (mode === 'sources') {
    const sourceItems: SourcesProps['items'] = docList.map((doc, index) => ({
      key: doc.doc_id || `doc-${index}`,
      title: doc.doc_name,
      icon: getDocumentIcon(doc.doc_name),
      description: doc.count && doc.count > 1 ? `引用 ${doc.count} 次` : undefined,
      url: doc.url
    }))
    
    return (
      <div className={cn("mt-3", className)}>
        <Sources
          title={`引用了 ${docList.length} 个来源`}
          items={sourceItems}
          onClick={(item) => {
            const doc = docList.find(d => d.doc_id === item.key || d.doc_name === item.title)
            if (doc) onDocumentClick?.(doc)
          }}
        />
      </div>
    )
  }
  
  // Card 模式 - 卡片列表（参考 ragflow 样式）
  return (
    <div className={cn("mt-3", className)}>
      <div 
        className="text-xs font-medium mb-2 flex items-center gap-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <FileText className="h-3 w-3" />
        <span>引用来源 ({docList.length})</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {displayDocs.map((doc, index) => (
          <DocumentCard
            key={doc.doc_id || `doc-${index}`}
            document={doc}
            onClick={onDocumentClick}
          />
        ))}
        
        {hasMore && !expanded && (
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--color-background-subtle)',
              color: 'var(--color-text-secondary)'
            }}
            onClick={() => setExpanded(true)}
          >
            <span>还有 {docList.length - maxItems} 个</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}

export default ReferenceDocumentList
