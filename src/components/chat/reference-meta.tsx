/**
 * 引用展示共享辅助：文档类型图标与标签、纯文本摘要、ID 截断和打开原文。
 * ReferenceMarker、ReferencePanel 与 ReferenceDetailSheet 共用（原先各自
 * 维护一份重复实现）。纯函数/纯展示，无业务状态。
 */
import { FileText, FileType, Image, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

/**
 * 文档类型图标。仅作装饰：文档名和类型标签另以文字给出。
 */
export function getDocTypeIcon(
  docType?: string,
  docName?: string,
  className = 'size-icon-md',
) {
  const iconClass = (color: string) => cn('shrink-0', color, className)

  if (docType === 'table') {
    return <Table2 aria-hidden className={iconClass('text-text-accent')} />
  }
  if (docType === 'image') {
    return <Image aria-hidden className={iconClass('text-text-success')} />
  }

  switch (docName?.split('.').pop()?.toLowerCase()) {
    case 'pdf':
      return <FileText aria-hidden className={iconClass('text-text-error')} />
    case 'doc':
    case 'docx':
      return <FileText aria-hidden className={iconClass('text-text-accent')} />
    case 'xls':
    case 'xlsx':
      return <Table2 aria-hidden className={iconClass('text-text-success')} />
    case 'md':
    case 'mdx':
      return (
        <FileType aria-hidden className={iconClass('text-text-secondary')} />
      )
  }

  return <FileText aria-hidden className={iconClass('text-text-tertiary')} />
}

/**
 * 文档类型标签的 i18n key
 */
export function getDocTypeLabelKey(docType?: string): string {
  switch (docType) {
    case 'table':
      return 'reference.docType.table'
    case 'image':
      return 'reference.docType.image'
    default:
      return 'reference.docType.text'
  }
}

/**
 * 去掉 HTML 标签并合并空白，得到按纯文本展示或复制的内容
 */
export function toPlainText(content?: string | null): string {
  if (!content) return ''
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 截取摘要
 */
export function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`
}

/**
 * 截断 ID 显示
 */
export function truncateId(id: string, maxLength = 12): string {
  if (!id || id.length <= maxLength) return id
  return id.slice(0, maxLength) + '...'
}

/**
 * 在新标签页打开文档预览。预览页展示完整文档，不会定位到引用片段。
 */
export function openDocumentPreview(
  chunk: Pick<ReferenceChunk, 'document_id' | 'document_name'>,
) {
  if (!chunk.document_id) return
  const params = new URLSearchParams()
  if (chunk.document_name) params.set('name', chunk.document_name)
  window.open(
    `/document/${encodeURIComponent(chunk.document_id)}/preview?${params.toString()}`,
    '_blank',
  )
}
