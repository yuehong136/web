import { cn } from '@/lib/utils'

export interface ReferenceMarkerProps {
  referenceId: string
  displayNumber: number
  documentName?: string
  similarity?: number
  onClick?: (referenceId: string) => void
  className?: string
}

/**
 * 引用标记组件
 * 用于在文本中显示引用标志，支持点击查看详情
 */
export function ReferenceMarker({
  referenceId,
  displayNumber,
  documentName,
  similarity,
  onClick,
  className,
}: ReferenceMarkerProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(referenceId)
    }
  }

  const title = documentName
    ? `引用: ${documentName}${similarity ? ` (相似度: ${Math.round(similarity * 100)}%)` : ''}`
    : '引用'

  return (
    <sup
      className={cn(
        'reference-marker',
        'inline-block rounded px-1 py-0.5 text-xs font-medium',
        'bg-blue-100 text-blue-700 hover:bg-blue-200',
        'cursor-pointer transition-colors duration-200',
        'border border-blue-200 hover:border-blue-300',
        onClick && 'hover:shadow-xs',
        className,
      )}
      title={title}
      onClick={handleClick}
      data-reference-id={referenceId}
      data-document-name={documentName}
      data-similarity={similarity}
    >
      [{displayNumber}]
    </sup>
  )
}

/**
 * 引用列表组件
 * 用于显示所有引用的详细信息
 */
export interface ReferenceListProps {
  references: Array<{
    id: string
    displayNumber: number
    documentName?: string
    content: string
    similarity?: number
    url?: string
  }>
  className?: string
}

export function ReferenceList({ references, className }: ReferenceListProps) {
  if (!references.length) return null

  return (
    <div
      className={cn(
        'reference-list mt-6 border-t border-border-default pt-4',
        className,
      )}
    >
      <h3 className="mb-3 text-sm font-medium text-text-primary">参考文献</h3>
      <div className="space-y-2">
        {references.map((ref) => (
          <div
            key={ref.id}
            className="flex items-start space-x-3 rounded-lg bg-background-subtle p-3 text-sm"
          >
            <span className="inline-block shrink-0 rounded border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
              [{ref.displayNumber}]
            </span>
            <div className="flex-1">
              {ref.documentName && (
                <div className="mb-1 font-medium text-text-primary">
                  {ref.documentName}
                  {ref.similarity && (
                    <span className="ml-2 text-xs text-text-tertiary">
                      相似度: {Math.round(ref.similarity * 100)}%
                    </span>
                  )}
                </div>
              )}
              <div className="line-clamp-3 text-text-secondary">
                {ref.content}
              </div>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-600 hover:text-blue-800"
                >
                  查看来源 →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
