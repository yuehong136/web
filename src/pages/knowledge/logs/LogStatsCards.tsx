import { useTranslation } from 'react-i18next'
import { Files, Layers, Loader2 } from 'lucide-react'
import type { IngestionSummary } from '@/api/knowledge'
import {
  LogStatCard,
  LogStatProcess,
  LogStatsSkeleton,
} from './components/log-stat-card'

interface LogStatsCardsProps {
  summary?: IngestionSummary | null
  isLoading?: boolean
}

export function LogStatsCards({ summary, isLoading }: LogStatsCardsProps) {
  const { t } = useTranslation()
  if (isLoading) return <LogStatsSkeleton />
  if (!summary) return null

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <LogStatCard
        title={t('knowledge.logs.stats.totalFiles')}
        value={summary.doc_num}
        icon={<Files className="h-5 w-5" />}
      />
      <LogStatCard
        title={t('knowledge.list.stats.totalChunks')}
        value={summary.chunk_num}
        icon={<Layers className="h-5 w-5" />}
      />
      <LogStatCard
        title={t('knowledge.logs.stats.processing')}
        value={summary.status.running_count}
        icon={<Loader2 className="h-5 w-5" />}
        variant="warning"
        tooltip={t('knowledge.logs.stats.processingTooltip')}
      >
        <LogStatProcess
          success={summary.status.done_count}
          failed={summary.status.fail_count}
          successLabel={t('knowledge.logs.stats.success')}
          failedLabel={t('knowledge.logs.stats.failed')}
          successTip={t('knowledge.logs.stats.processSuccessTip')}
          failedTip={t('knowledge.logs.stats.processFailedTip')}
        />
      </LogStatCard>
    </div>
  )
}
