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
    return <Image aria-hidden className={iconClass('text-status-success')} />
  }

  switch (docName?.split('.').pop()?.toLowerCase()) {
    case 'pdf':
      return <FileText aria-hidden className={iconClass('text-status-error')} />
    case 'doc':
    case 'docx':
      return <FileText aria-hidden className={iconClass('text-text-accent')} />
    case 'xls':
    case 'xlsx':
      return <Table2 aria-hidden className={iconClass('text-status-success')} />
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

export type OriginalSource =
  | { kind: 'document'; documentId: string; documentName?: string }
  | { kind: 'web'; url: string }

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value !== ''

/** 只放行 http(s) 链接；url 来自检索结果，按不可信输入对待 */
function toWebUrl(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null
  } catch {
    return null
  }
}

/**
 * 引用的原文入口。知识库切片打开文档预览（展示完整文档，不定位到片段）；
 * 联网检索结果没有知识库文档（知识库 ID 为空、文档 ID 是临时值），打开它的
 * 来源网页；两者都没有时返回 null，不提供原文入口。
 */
export function getOriginalSource(
  chunk: Pick<
    ReferenceChunk,
    'dataset_id' | 'document_id' | 'document_name' | 'url'
  >,
): OriginalSource | null {
  if (
    isNonEmptyString(chunk.dataset_id) &&
    isNonEmptyString(chunk.document_id)
  ) {
    return {
      kind: 'document',
      documentId: chunk.document_id,
      documentName: chunk.document_name || undefined,
    }
  }
  const url = toWebUrl(chunk.url)
  return url ? { kind: 'web', url } : null
}

/**
 * 在新标签页打开原文；外部网页不带 opener 与 referrer。
 */
export function openOriginalSource(source: OriginalSource) {
  if (source.kind === 'web') {
    window.open(source.url, '_blank', 'noopener,noreferrer')
    return
  }
  const params = new URLSearchParams()
  if (source.documentName) params.set('name', source.documentName)
  window.open(
    `/document/${encodeURIComponent(source.documentId)}/preview?${params.toString()}`,
    '_blank',
  )
}

/** 原文按钮的说明文案 key */
export function getOriginalSourceHintKey(source: OriginalSource): string {
  return source.kind === 'web'
    ? 'reference.openWebSourceHint'
    : 'reference.openOriginalHint'
}
