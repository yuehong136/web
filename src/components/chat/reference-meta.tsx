/**
 * 引用展示共享辅助：文档类型图标/标签、相似度颜色/等级、ID 截断。
 * ReferenceMarker 与 ReferenceDetailSheet 共用（原各自维护一份重复实现，
 * 随文件体积拆分合并到此处）。纯函数/纯展示，无业务状态。
 */
import { FileText, FileType, Image, Table2 } from 'lucide-react'

/**
 * 获取文档类型图标
 */
export function getDocTypeIcon(
  docType?: string,
  docName?: string,
  className = 'h-5 w-5',
) {
  // 根据 doc_type 判断
  if (docType === 'table') {
    return (
      <Table2
        className={className}
        style={{ color: 'var(--color-text-accent)' }}
      />
    )
  }
  if (docType === 'image') {
    return (
      <Image
        className={className}
        style={{ color: 'var(--color-text-success)' }}
      />
    )
  }

  // 根据文件扩展名判断
  if (docName) {
    const ext = docName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return (
          <FileText
            className={className}
            style={{ color: 'var(--color-text-error)' }}
          />
        )
      case 'doc':
      case 'docx':
        return (
          <FileText
            className={className}
            style={{ color: 'var(--color-text-accent)' }}
          />
        )
      case 'xls':
      case 'xlsx':
        return (
          <Table2
            className={className}
            style={{ color: 'var(--color-text-success)' }}
          />
        )
      case 'md':
      case 'mdx':
        return (
          <FileType
            className={className}
            style={{ color: 'var(--color-text-secondary)' }}
          />
        )
    }
  }

  return (
    <FileText
      className={className}
      style={{ color: 'var(--color-text-tertiary)' }}
    />
  )
}

/**
 * 获取文档类型标签
 */
export function getDocTypeLabel(docType?: string): string {
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
export function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.8) return 'var(--color-text-success)'
  if (similarity >= 0.6) return 'var(--color-text-accent)'
  return 'var(--color-text-tertiary)'
}

/**
 * 获取相似度等级标签
 */
export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) return '高度匹配'
  if (similarity >= 0.6) return '较为相关'
  return '可能相关'
}

/**
 * 截断 ID 显示
 */
export function truncateId(id: string, maxLength = 12): string {
  if (!id || id.length <= maxLength) return id
  return id.slice(0, maxLength) + '...'
}
