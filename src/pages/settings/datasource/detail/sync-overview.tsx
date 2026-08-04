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
): string | null {
  if (!refreshFreq) return null

  const scheduled = logs.find(
    (log) => log.status === DataSourceStatus.SCHEDULED,
  )
  if (!scheduled?.update_date) return null

  const scheduledAt = new Date(scheduled.update_date).getTime()
  if (Number.isNaN(scheduledAt)) return null
  return formatDate(scheduledAt + refreshFreq * 60_000)
}

export function SyncOverview({ status, logs, refreshFreq }: SyncOverviewProps) {
  const { t } = useTranslation()
  const latestCompleted = logs.find(
    (log) => log.status === DataSourceStatus.COMPLETED,
  )
  const estimatedNextSync = getEstimatedNextSync(logs, refreshFreq)

  return (
    <SectionCard
      title={t('datasource.syncOverview')}
      actions={<DataSourceStatusBadge status={status} />}
      className="h-fit"
    >
      <div className="gap-space-lg flex flex-col">
        <div className="gap-space-base grid sm:grid-cols-2 xl:grid-cols-1">
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
            value={estimatedNextSync || t('datasource.waitingForSchedule')}
            detail={
              refreshFreq
                ? t('datasource.syncEveryMinutes', { count: refreshFreq })
                : undefined
            }
          />
        </div>

        <div className="gap-space-sm rounded-radius-lg p-space-base flex items-start bg-status-info-subtle text-status-info">
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
    <div className="gap-space-base flex items-start">
      <div className="rounded-radius-lg flex h-10 w-10 shrink-0 items-center justify-center bg-background-subtle text-text-secondary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-space-xs break-words text-sm font-medium text-text-primary">
          {value}
        </p>
        {detail ? (
          <p className="mt-space-xs text-xs text-text-tertiary">{detail}</p>
        ) : null}
      </div>
    </div>
  )
}
