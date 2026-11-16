import { useTranslation } from 'react-i18next'
import type { IngestionSummary } from '@/api/knowledge'
import { InlineStats } from '@/components/patterns'
import { Skeleton } from '@/components/ui/skeleton'

interface LogStatsCardsProps {
  summary?: IngestionSummary | null
  isLoading?: boolean
}

/**
 * The knowledge base's ingestion summary as one InlineStats line. Every
 * figure comes from the same dataset-wide summary request.
 */
export function LogStatsCards({ summary, isLoading }: LogStatsCardsProps) {
  const { t } = useTranslation()
  if (isLoading) return <Skeleton className="h-4 w-64" />
  if (!summary) return null
  const format = (value: number) => value.toLocaleString()

  return (
    <InlineStats
      aria-label={t('knowledge.logs.stats.label')}
      items={[
        {
          key: 'files',
          label: t('knowledge.logs.stats.totalFiles'),
          value: format(summary.doc_num),
        },
        {
          key: 'chunks',
          label: t('knowledge.list.stats.totalChunks'),
          value: format(summary.chunk_num),
        },
        {
          key: 'processing',
          label: t('knowledge.logs.stats.processing'),
          value: format(summary.status.running_count),
          tone: summary.status.running_count > 0 ? 'info' : 'default',
        },
        {
          key: 'success',
          label: t('knowledge.logs.stats.success'),
          value: format(summary.status.done_count),
          tone: 'success',
        },
        {
          key: 'failed',
          label: t('knowledge.logs.stats.failed'),
          value: format(summary.status.fail_count),
          tone: summary.status.fail_count > 0 ? 'error' : 'default',
        },
      ]}
    />
  )
}
