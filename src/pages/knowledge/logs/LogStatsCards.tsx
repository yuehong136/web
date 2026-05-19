import { useTranslation } from 'react-i18next'
import { Download, Files, Loader2 } from 'lucide-react'
import {
  LogStatCard,
  LogStatProcess,
  LogStatsSkeleton,
} from './components/log-stat-card'

interface LogStatsCardsProps {
  totalFiles: number
  downloading: number
  downloadSuccess: number
  downloadFailed: number
  processing: number
  processSuccess: number
  processFailed: number
  isLoading?: boolean
}

export function LogStatsCards({
  totalFiles,
  downloading,
  downloadSuccess,
  downloadFailed,
  processing,
  processSuccess,
  processFailed,
  isLoading,
}: LogStatsCardsProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return <LogStatsSkeleton />
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <LogStatCard
        title={t('knowledge.logs.stats.totalFiles')}
        value={totalFiles}
        icon={<Files className="h-5 w-5" />}
        tooltip={t('knowledge.logs.stats.totalFilesTooltip')}
      />

      <LogStatCard
        title={t('knowledge.logs.stats.downloading')}
        value={downloading}
        icon={<Download className="h-5 w-5" />}
        variant="info"
        tooltip={t('knowledge.logs.stats.downloadingTooltip')}
      >
        <LogStatProcess
          success={downloadSuccess}
          failed={downloadFailed}
          successLabel={t('knowledge.logs.stats.success')}
          failedLabel={t('knowledge.logs.stats.failed')}
          successTip={t('knowledge.logs.stats.downloadSuccessTip')}
          failedTip={t('knowledge.logs.stats.downloadFailedTip')}
        />
      </LogStatCard>

      <LogStatCard
        title={t('knowledge.logs.stats.processing')}
        value={processing}
        icon={<Loader2 className="h-5 w-5 animate-spin" />}
        variant="warning"
        tooltip={t('knowledge.logs.stats.processingTooltip')}
      >
        <LogStatProcess
          success={processSuccess}
          failed={processFailed}
          successLabel={t('knowledge.logs.stats.success')}
          failedLabel={t('knowledge.logs.stats.failed')}
          successTip={t('knowledge.logs.stats.processSuccessTip')}
          failedTip={t('knowledge.logs.stats.processFailedTip')}
        />
      </LogStatCard>
    </div>
  )
}
