import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  Clock3,
  Loader2,
} from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { DataSourceStatus } from '../types'

const STATUS_VARIANTS: Record<DataSourceStatus, BadgeProps['variant']> = {
  [DataSourceStatus.PENDING]: 'secondary',
  [DataSourceStatus.RUNNING]: 'default',
  [DataSourceStatus.SCHEDULED]: 'blue',
  [DataSourceStatus.PAUSED]: 'warning',
  [DataSourceStatus.COMPLETED]: 'success',
  [DataSourceStatus.FAILED]: 'destructive',
}

export function isDataSourceActive(status?: DataSourceStatus): boolean {
  return (
    status === DataSourceStatus.RUNNING || status === DataSourceStatus.SCHEDULED
  )
}

export function getDataSourceStatusLabel(
  t: TFunction,
  status?: DataSourceStatus,
): string {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return t('datasource.statusRunning')
    case DataSourceStatus.SCHEDULED:
      return t('datasource.statusScheduled')
    case DataSourceStatus.PAUSED:
      return t('datasource.statusPaused')
    case DataSourceStatus.COMPLETED:
      return t('datasource.statusCompleted')
    case DataSourceStatus.FAILED:
      return t('datasource.statusFailed')
    default:
      return t('datasource.statusPending')
  }
}

export function DataSourceStatusBadge({
  status = DataSourceStatus.PENDING,
}: {
  status?: DataSourceStatus
}) {
  const { t } = useTranslation()

  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {getDataSourceStatusLabel(t, status)}
    </Badge>
  )
}

export function DataSourceStatusIcon({ status }: { status: DataSourceStatus }) {
  switch (status) {
    case DataSourceStatus.COMPLETED:
      return <CheckCircle2 className="size-icon-sm text-status-success" />
    case DataSourceStatus.FAILED:
      return <AlertCircle className="size-icon-sm text-status-error" />
    case DataSourceStatus.RUNNING:
      return <Loader2 className="size-icon-sm animate-spin text-status-info" />
    case DataSourceStatus.SCHEDULED:
      return <CalendarClock className="size-icon-sm text-status-info" />
    case DataSourceStatus.PAUSED:
      return <CirclePause className="size-icon-sm text-status-warning" />
    default:
      return <Clock3 className="size-icon-sm text-text-tertiary" />
  }
}
