import { useTranslation } from 'react-i18next'
import { Clock, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { TimeFormatType } from '@/stores/studio'
import type { DialogApp } from '@/types/api'

export function AppStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <Badge variant={status === '1' ? 'success' : 'secondary'}>
      {t(
        status === '1'
          ? 'studio.filters.published'
          : status === '0'
            ? 'studio.filters.draft'
            : 'studio.filters.unknown',
      )}
    </Badge>
  )
}

/** Knowledge-base count and update time; `compact` fits a list row. */
export function AppMetadata({
  app,
  timeFormat,
  compact = false,
}: {
  app: DialogApp
  timeFormat: TimeFormatType
  compact?: boolean
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
  const knowledge = t('studio.card.knowledgeCount', {
    count: app.kb_ids?.length ?? 0,
  })
  return (
    <>
      <span
        className="inline-flex items-center gap-space-xs"
        title={compact ? knowledge : undefined}
      >
        <Database className="size-icon-xs shrink-0" aria-hidden="true" />
        {compact ? (
          <>
            <span className="sr-only">{knowledge}</span>
            <span aria-hidden="true">{app.kb_ids?.length ?? 0}</span>
          </>
        ) : (
          knowledge
        )}
      </span>
      <span className="inline-flex min-w-0 items-center gap-space-xs">
        <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
        <time
          className="truncate"
          dateTime={valid ? new Date(timestamp).toISOString() : undefined}
        >
          {formatted}
        </time>
      </span>
    </>
  )
}
