import { useTranslation } from 'react-i18next'
import { ScrollText } from 'lucide-react'
import { PageEmptyState } from '@/components/patterns'
import { Skeleton } from '@/components/ui/skeleton'

interface LogTableEmptyStateProps {
  message?: string
}

export function LogTableEmptyState({ message }: LogTableEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <PageEmptyState
      compact
      icon={<ScrollText className="size-icon-lg" />}
      title={message || t('knowledge.logs.table.empty')}
    />
  )
}

interface LogTableSkeletonProps {
  rows?: number
}

export function LogTableSkeleton({ rows = 5 }: LogTableSkeletonProps) {
  return (
    <div className="flex flex-col gap-space-sm p-space-md">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  )
}
