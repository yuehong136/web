import { useTranslation } from 'react-i18next'
import { Clock, Database } from 'lucide-react'
import {
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { DialogApp } from '@/types/api'
import type { TimeFormatType } from './AppCard'

export function AppStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={
        status === '1'
          ? 'rounded-radius-full bg-status-success-subtle px-space-sm py-space-2xs text-xs text-status-success'
          : 'rounded-radius-full bg-background-subtle px-space-sm py-space-2xs text-xs text-text-secondary'
      }
    >
      {t(
        status === '1'
          ? 'studio.filters.published'
          : status === '0'
            ? 'studio.filters.draft'
            : 'studio.filters.unknown',
      )}
    </span>
  )
}
export function AppMetadata({
  app,
  timeFormat,
}: {
  app: DialogApp
  timeFormat: TimeFormatType
}) {
  const { t } = useTranslation()
  const timestamp = Number.isFinite(app.update_time)
    ? app.update_time
    : new Date(app.update_date).getTime()
  const valid =
    Number.isFinite(timestamp) && timestamp >= 0 && timestamp <= 4102444800000
  const formatted = valid
    ? (timeFormat === 'relative'
        ? formatRelativeTime
        : timeFormat === 'compact'
          ? formatTimestampCompact
          : formatTimestampDetailed)(timestamp)
    : t('studio.card.noUpdateTime')
  return (
    <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs text-xs text-text-tertiary">
      <span
        className="inline-flex items-center gap-space-xs"
        aria-label={t('studio.card.knowledgeCount', {
          count: app.kb_ids?.length ?? 0,
        })}
      >
        <Database className="size-icon-xs" aria-hidden="true" />
        {t('studio.card.knowledgeCount', { count: app.kb_ids?.length ?? 0 })}
      </span>
      <span className="inline-flex min-w-0 items-center gap-space-xs">
        <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
        <time dateTime={valid ? new Date(timestamp).toISOString() : undefined}>
          {formatted}
        </time>
      </span>
    </div>
  )
}
