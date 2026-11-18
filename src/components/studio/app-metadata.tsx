import { useTranslation } from 'react-i18next'
import { BookOpen, Clock, Database } from 'lucide-react'
import { ResourceChip } from '@/components/patterns/resource-card'
import {
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { TimeFormatType } from '@/stores/studio'
import type { DialogApp } from '@/types/api'
import { StatusDot } from './collection-identity'

export function AppStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  return (
    <StatusDot
      tone={status === '1' ? 'success' : status === '0' ? 'warning' : 'neutral'}
      label={t(
        status === '1'
          ? 'studio.filters.published'
          : status === '0'
            ? 'studio.filters.draft'
            : 'studio.filters.unknown',
      )}
    />
  )
}

/** Linked knowledge bases as a card chip. */
export function AppKnowledgeChip({ app }: { app: DialogApp }) {
  const { t } = useTranslation()
  const count = app.kb_ids?.length ?? 0
  return (
    <ResourceChip
      icon={<BookOpen aria-hidden="true" className="text-avatar-5-fg" />}
    >
      {count
        ? t('studio.card.knowledgeLinked', { count })
        : t('studio.card.noKnowledge')}
    </ResourceChip>
  )
}

function AppUpdated({
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
    <span className="inline-flex min-w-0 items-center gap-space-xs">
      <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
      <time
        className="truncate"
        dateTime={valid ? new Date(timestamp).toISOString() : undefined}
      >
        {formatted}
      </time>
    </span>
  )
}

/**
 * Knowledge-base count and update time. `compact` fits a list row; `card`
 * leaves the count to `AppKnowledgeChip` and keeps only the time.
 */
export function AppMetadata({
  app,
  timeFormat,
  compact = false,
  card = false,
}: {
  app: DialogApp
  timeFormat: TimeFormatType
  compact?: boolean
  card?: boolean
}) {
  const { t } = useTranslation()
  if (card) return <AppUpdated app={app} timeFormat={timeFormat} />
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
      <AppUpdated app={app} timeFormat={timeFormat} />
    </>
  )
}
