import { useTranslation } from 'react-i18next'
import type { IDocumentInfoFilter } from '@/types/api'
import { TaskStatus, TaskStatusConfig } from '../constants'
import { StatusDot } from '../document-status-cell'

// Ready first, then what needs attention.
const ORDER: TaskStatus[] = [
  TaskStatus.DONE,
  TaskStatus.RUNNING,
  TaskStatus.FAIL,
  TaskStatus.UNSTART,
  TaskStatus.CANCEL,
]

/**
 * Whole-base parse counts beside the title ("4 completed · 1 running"), from
 * the filter facets the page already loads. Hidden until they arrive.
 */
export function DocumentStatusSummary({
  filterOptions,
}: {
  filterOptions: IDocumentInfoFilter | null
}) {
  const { t } = useTranslation()
  const counts = filterOptions?.run_status ?? {}
  const items = ORDER.map((status) => ({
    status,
    count: Number(counts[status] ?? 0),
  })).filter(({ count }) => count > 0)
  if (!items.length) return null
  return (
    <ul
      data-slot="document-status-summary"
      aria-label={t('knowledge.documents.statusSummary.label')}
      className="flex flex-wrap items-center gap-x-space-md gap-y-space-2xs text-xs text-fg-muted"
    >
      {items.map(({ status, count }) => (
        <li key={status} className="inline-flex items-center gap-space-xs">
          <StatusDot status={status} />
          <span className="tabular-nums">
            {t('knowledge.documents.statusSummary.item', {
              count,
              status: t(TaskStatusConfig[status].textKey),
            })}
          </span>
        </li>
      ))}
    </ul>
  )
}
