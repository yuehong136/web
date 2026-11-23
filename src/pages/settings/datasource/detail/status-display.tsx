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
import { Badge, badgeLook, type BadgeLook } from '@/components/ui/badge'
import {
  StatusDot,
  type StatusDotTone,
} from '@/components/studio/collection-identity'
import { DataSourceStatus } from '../types'

const STATUS_VARIANTS: Record<DataSourceStatus, BadgeLook> = {
  [DataSourceStatus.PENDING]: 'secondary',
  [DataSourceStatus.RUNNING]: 'default',
  [DataSourceStatus.SCHEDULED]: 'blue',
  [DataSourceStatus.PAUSED]: 'warning',
  [DataSourceStatus.COMPLETED]: 'success',
  [DataSourceStatus.FAILED]: 'destructive',
}

// A sync run is a background job, not an AI moment, so running reads as info.
const STATUS_TONES: Record<DataSourceStatus, StatusDotTone> = {
  [DataSourceStatus.PENDING]: 'neutral',
  [DataSourceStatus.RUNNING]: 'info',
  [DataSourceStatus.SCHEDULED]: 'info',
  [DataSourceStatus.PAUSED]: 'warning',
  [DataSourceStatus.COMPLETED]: 'success',
  [DataSourceStatus.FAILED]: 'error',
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
    <Badge {...badgeLook(STATUS_VARIANTS[status])}>
      {getDataSourceStatusLabel(t, status)}
    </Badge>
  )
}

/** The status as a labelled dot, for connector cards and the detail header. */
export function DataSourceStatusDot({
  status = DataSourceStatus.PENDING,
  className,
}: {
  status?: DataSourceStatus
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <StatusDot
      tone={STATUS_TONES[status]}
      label={getDataSourceStatusLabel(t, status)}
      className={className}
    />
  )
}

export function DataSourceStatusIcon({ status }: { status: DataSourceStatus }) {
  switch (status) {
    case DataSourceStatus.COMPLETED:
      return <CheckCircle2 className="size-icon-sm text-success-fg" />
    case DataSourceStatus.FAILED:
      return <AlertCircle className="size-icon-sm text-danger-fg" />
    case DataSourceStatus.RUNNING:
      return <Loader2 className="size-icon-sm animate-spin text-info-fg" />
    case DataSourceStatus.SCHEDULED:
      return <CalendarClock className="size-icon-sm text-info-fg" />
    case DataSourceStatus.PAUSED:
      return <CirclePause className="size-icon-sm text-warning-fg" />
    default:
      return <Clock3 className="size-icon-sm text-fg-subtle" />
  }
}
