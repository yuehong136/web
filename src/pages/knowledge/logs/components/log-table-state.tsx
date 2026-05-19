import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'

interface LogTableEmptyStateProps {
  message?: string
}

export function LogTableEmptyState({ message }: LogTableEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <FileText className="mb-3 h-12 w-12 text-text-tertiary opacity-30" />
      <p className="text-sm text-text-tertiary">
        {message || t('knowledge.logs.table.empty')}
      </p>
    </div>
  )
}

interface LogTableSkeletonProps {
  rows?: number
}

export function LogTableSkeleton({ rows = 5 }: LogTableSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-radius-lg h-12 animate-pulse bg-background-subtle"
        />
      ))}
    </div>
  )
}
