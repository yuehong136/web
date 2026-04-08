/**
 * 引用详情侧边栏组件
 * 用于展示单个引用的完整详情，从右侧滑出
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
  Database,
  Hash,
  Layers,
  Check,
  ExternalLink,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ReferenceDetailSheetProps {
  /** 是否打开 */
  open: boolean
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void
  /** 当前选中的 chunk */
  chunk: ReferenceChunk | null
  /** 所有 chunks（用于显示同文档其他引用） */
  allChunks?: ReferenceChunk[]
  /** 复制成功回调 */
  onCopySuccess?: () => void
}

/**
 * 获取文档类型图标
 */
function getDocTypeIcon(docType?: string, docName?: string) {
  if (docType === 'table') {
    return <Table2 className="h-5 w-5" style={{ color: 'var(--color-text-accent)' }} />
  }
  if (docType === 'image') {
    return <Image className="h-5 w-5" style={{ color: 'var(--color-text-success)' }} />
  }
  
  if (docName) {
    const ext = docName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <FileText className="h-5 w-5" style={{ color: 'var(--color-text-error)' }} />
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5" style={{ color: 'var(--color-text-accent)' }} />
      case 'xls':
      case 'xlsx':
        return <Table2 className="h-5 w-5" style={{ color: 'var(--color-text-success)' }} />
      case 'md':
      case 'mdx':
        return <FileType className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
    }
  }
  
  return <FileText className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} />
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
 * 安全渲染 HTML 内容
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'br', 'p', 'div', 'span', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['rowspan', 'colspan', 'class', 'style'],
  })
}

/**
 * 截断 ID 显示
 */
function truncateId(id: string, maxLength = 12): string {
  if (!id || id.length <= maxLength) return id
  return id.slice(0, maxLength) + '...'
}

/**
 * 元数据项组件
 */
interface MetadataItemProps {
  icon: React.ReactNode
  label: string
  value: string
  copyable?: boolean
  onCopy?: () => void
}

const MetadataItem: React.FC<MetadataItemProps> = ({ 
  icon, 
  label, 
  value, 
  copyable = false,
  onCopy 
}) => {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopy = async () => {
    try {
      await copyToClipboard(value)
      setCopied(true)
      toast.success('已复制')
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }
  
  return (
    <div className="flex items-start gap-2 py-2">
      <span style={{ color: 'var(--color-text-tertiary)' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div 
          className="text-xs mb-0.5"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-mono truncate"
            style={{ color: 'var(--color-text-secondary)' }}
            title={value}
          >
            {truncateId(value, 24)}
          </span>
          {copyable && (
            <button
              className="flex-shrink-0 p-1 rounded transition-colors"
              style={{ color: copied ? 'var(--color-text-success)' : 'var(--color-text-tertiary)' }}
              onClick={handleCopy}
              title="复制"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 引用详情侧边栏组件
 */
export const ReferenceDetailSheet: React.FC<ReferenceDetailSheetProps> = ({
  open,
  onOpenChange,
  chunk,
  allChunks,
  onCopySuccess
}) => {
  const [contentCopied, setContentCopied] = React.useState(false)
  
  // 获取同文档的其他引用 - hooks 必须在条件返回之前调用
  const relatedChunks = React.useMemo(() => {
    if (!allChunks || !chunk?.document_id) return []
    return allChunks.filter(
      c => c.document_id === chunk.document_id && c.id !== chunk.id
    ).slice(0, 3)
  }, [allChunks, chunk])
  
  const handleCopyContent = React.useCallback(async () => {
    if (!chunk?.content) return
    const textContent = chunk.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    try {
      await copyToClipboard(textContent)
      setContentCopied(true)
      toast.success('已复制内容')
      onCopySuccess?.()
      setTimeout(() => setContentCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }, [chunk?.content, onCopySuccess])
  
  // 条件返回必须在所有 hooks 之后
  if (!chunk) return null
  
  const similarity = chunk.similarity ?? 0
  const similarityPercent = Math.round(similarity * 100)
  const similarityColor = getSimilarityColor(similarity)
  const isHtmlContent = chunk.content?.includes('<')
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md overflow-y-auto p-0"
        style={{ backgroundColor: 'var(--color-background-body)' }}
      >
        {/* 头部 */}
        <SheetHeader 
          className="px-4 py-3 sticky top-0 z-10"
          style={{ 
            backgroundColor: 'var(--color-background-surface)',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          <div className="flex items-center gap-3">
            {getDocTypeIcon(chunk.doc_type, chunk.document_name)}
            <div className="flex-1 min-w-0">
              <SheetTitle 
                className="text-base font-semibold truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {chunk.document_name || '未知文档'}
              </SheetTitle>
              <SheetDescription className="sr-only">
                引用内容详情，包含相似度、内容和元数据信息
              </SheetDescription>
              <div className="flex items-center gap-2 mt-0.5">
                <span 
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: 'var(--color-background-subtle)',
                    color: 'var(--color-text-tertiary)'
                  }}
                >
                  {getDocTypeLabel(chunk.doc_type)}
                </span>
              </div>
            </div>
            {chunk.document_id && (
              <button
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors"
                style={{
                  color: 'var(--color-text-accent)',
                  backgroundColor: 'var(--color-state-focus-10)',
                }}
                onClick={() => {
                  const params = new URLSearchParams()
                  if (chunk.document_name) params.set('name', chunk.document_name)
                  window.open(
                    `/document/${chunk.document_id}/preview?${params.toString()}`,
                    '_blank',
                  )
                }}
                title="在新标签页中查看完整文档"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                查看原文
              </button>
            )}
          </div>
        </SheetHeader>
        
        <div className="px-4 py-4 space-y-4">
          {/* 相似度 */}
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--color-background-subtle)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                相似度
              </span>
              <span 
                className="text-sm font-semibold"
                style={{ color: similarityColor }}
              >
                {similarityPercent}% · {getSimilarityLabel(similarity)}
              </span>
            </div>
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-background-default)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${similarityPercent}%`,
                  backgroundColor: similarityColor
                }}
              />
            </div>
            
            {/* 详细相似度信息 */}
            {(chunk.vector_similarity !== undefined || chunk.term_similarity !== undefined) && (
              <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                {chunk.vector_similarity !== undefined && (
                  <div>
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>向量相似度</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {Math.round(chunk.vector_similarity * 100)}%
                    </div>
                  </div>
                )}
                {chunk.term_similarity !== undefined && (
                  <div>
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>词汇相似度</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {Math.round(chunk.term_similarity * 100)}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 内容 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                内容
              </span>
              <button
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
                style={{ 
                  color: contentCopied ? 'var(--color-text-success)' : 'var(--color-text-tertiary)',
                  backgroundColor: 'var(--color-background-subtle)'
                }}
                onClick={handleCopyContent}
              >
                {contentCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {contentCopied ? '已复制' : '复制'}
              </button>
            </div>
            <div 
              className="p-3 rounded-lg overflow-auto max-h-80"
              style={{ 
                backgroundColor: 'var(--color-background-subtle)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              {isHtmlContent ? (
                <div 
                  className="prose prose-sm max-w-none"
                  style={{ color: 'var(--color-text-primary)' }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(chunk.content || '') }}
                />
              ) : (
                <p 
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {chunk.content || '无内容'}
                </p>
              )}
            </div>
          </div>
          
          {/* 元数据 */}
          <div>
            <div 
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              元数据
            </div>
            <div 
              className="rounded-lg divide-y"
              style={{ 
                backgroundColor: 'var(--color-background-subtle)',
                border: '1px solid var(--color-border-subtle)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div className="px-3">
                <MetadataItem
                  icon={<Hash className="h-4 w-4" />}
                  label="Chunk ID"
                  value={chunk.id}
                  copyable
                  onCopy={onCopySuccess}
                />
              </div>
              <div className="px-3">
                <MetadataItem
                  icon={<FileText className="h-4 w-4" />}
                  label="文档 ID"
                  value={chunk.document_id}
                  copyable
                  onCopy={onCopySuccess}
                />
              </div>
              <div className="px-3">
                <MetadataItem
                  icon={<Database className="h-4 w-4" />}
                  label="数据集 ID"
                  value={chunk.dataset_id}
                  copyable
                  onCopy={onCopySuccess}
                />
              </div>
              {chunk.image_id && (
                <div className="px-3">
                  <MetadataItem
                    icon={<Image className="h-4 w-4" />}
                    label="图片 ID"
                    value={chunk.image_id}
                    copyable
                    onCopy={onCopySuccess}
                  />
                </div>
              )}
              {chunk.positions && chunk.positions.length > 0 && (
                <div className="px-3">
                  <MetadataItem
                    icon={<Layers className="h-4 w-4" />}
                    label="位置信息"
                    value={JSON.stringify(chunk.positions)}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* 同文档其他引用 */}
          {relatedChunks.length > 0 && (
            <div>
              <div 
                className="text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                同文档其他引用 ({relatedChunks.length})
              </div>
              <div className="space-y-2">
                {relatedChunks.map((relatedChunk, index) => (
                  <div 
                    key={relatedChunk.id || index}
                    className="p-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--color-background-subtle)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: 'var(--color-background-default)',
                          color: 'var(--color-text-tertiary)'
                        }}
                      >
                        {getDocTypeLabel(relatedChunk.doc_type)}
                      </span>
                      <span 
                        className="text-xs font-medium"
                        style={{ color: getSimilarityColor(relatedChunk.similarity ?? 0) }}
                      >
                        {Math.round((relatedChunk.similarity ?? 0) * 100)}%
                      </span>
                    </div>
                    <p 
                      className="text-xs line-clamp-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {(relatedChunk.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ReferenceDetailSheet
