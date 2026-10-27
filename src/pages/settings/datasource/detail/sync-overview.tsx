import { useEffect, useState } from 'react'
import { Activity, CalendarClock, FileCheck2, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns'
import { formatDate } from '@/lib/utils'
import { DataSourceStatus, type IDataSourceLog } from '../types'
import {
  DataSourceStatusBadge,
  getDataSourceStatusLabel,
} from './status-display'

interface SyncOverviewProps {
  status: DataSourceStatus
  logs: IDataSourceLog[]
  refreshFreq?: number
}

function getEstimatedNextSync(
  logs: IDataSourceLog[],
  refreshFreq?: number,
): number | null {
  if (refreshFreq == null) return null

  const scheduled = logs.find(
    (log) =>
      log.task_type !== 'prune' && log.status === DataSourceStatus.SCHEDULED,
  )
  if (!scheduled?.update_date) return null

  const scheduledAt = new Date(scheduled.update_date).getTime()
  if (Number.isNaN(scheduledAt)) return null
  const next = scheduledAt + refreshFreq * 60_000
  return next
}

export function SyncOverview({ status, logs, refreshFreq }: SyncOverviewProps) {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000)
    return () => window.clearInterval(timer)
  }, [])
  const latestCompleted = logs.find(
    (log) =>
      log.task_type !== 'prune' && log.status === DataSourceStatus.COMPLETED,
  )
  const estimatedNextSync = getEstimatedNextSync(logs, refreshFreq)

  return (
    <SectionCard
      title={t('datasource.syncOverview')}
      actions={<DataSourceStatusBadge status={status} />}
      className="h-fit"
    >
      <div className="flex flex-col gap-space-lg">
        <div className="grid gap-space-base sm:grid-cols-2 xl:grid-cols-1">
          <OverviewItem
            icon={<Activity className="size-icon-md" aria-hidden="true" />}
            label={t('datasource.currentState')}
            value={getDataSourceStatusLabel(t, status)}
          />
          <OverviewItem
            icon={<FileCheck2 className="size-icon-md" aria-hidden="true" />}
            label={t('datasource.lastSuccessfulSync')}
            value={
              latestCompleted?.update_date
                ? formatDate(latestCompleted.update_date)
                : t('datasource.notAvailable')
            }
            detail={
              latestCompleted
                ? t('datasource.lastSyncSummary', {
                    added: latestCompleted.new_docs_indexed || 0,
                    total: latestCompleted.total_docs_indexed || 0,
                  })
                : undefined
            }
          />
          <OverviewItem
            icon={<CalendarClock className="size-icon-md" aria-hidden="true" />}
            label={t('datasource.nextEstimatedSync')}
            value={
              estimatedNextSync == null
                ? t('datasource.waitingForSchedule')
                : estimatedNextSync <= now
                  ? t('datasource.readyToRun')
                  : formatDate(estimatedNextSync)
            }
            detail={
              refreshFreq
                ? t('datasource.syncEveryMinutes', { count: refreshFreq })
                : undefined
            }
          />
        </div>

        <div className="flex items-start gap-space-sm rounded-radius-lg bg-status-info-subtle p-space-base text-status-info">
          <Info
            className="mt-space-xs size-icon-sm shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed">
            {t('datasource.zeroChangesExplanation')}
          </p>
        </div>
      </div>
    </SectionCard>
  )
}

function OverviewItem({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="flex items-start gap-space-base">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-lg bg-background-subtle text-text-secondary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-space-xs text-sm font-medium break-words text-text-primary">
          {value}
        </p>
        {detail ? (
          <p className="mt-space-xs text-xs text-text-tertiary">{detail}</p>
        ) : null}
      </div>
    </div>
  )
}
