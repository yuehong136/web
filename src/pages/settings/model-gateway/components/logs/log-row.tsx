import type { TFunction } from 'i18next'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayLog } from '@/api/model-gateway'
import { TableCell, TableRow } from '@/components/ui/table'
import { getCurrentLanguage } from '@/locales/i18n'
import {
  PREFIX,
  endpointLabel,
  formatCount,
  formatDuration,
  formatInstant,
} from '../../utils'
import { formatCost } from '../../pricing'
import { retriesOf } from '../../routing'
import { StatusCode } from '../status-code'

/** "1,204 → 386", "2,048 in" for embeddings, or "Unknown". */
export function usageText(t: TFunction, log: GatewayLog): string {
  if (log.prompt_tokens === null && log.completion_tokens === null)
    return log.total_tokens === null
      ? t(`${PREFIX}.common.unknown`)
      : formatCount(log.total_tokens)
  if (log.completion_tokens === null)
    return t(`${PREFIX}.logs.usageInput`, {
      prompt: formatCount(log.prompt_tokens ?? 0),
    })
  return t(`${PREFIX}.logs.usageValue`, {
    prompt: log.prompt_tokens === null ? '-' : formatCount(log.prompt_tokens),
    completion: formatCount(log.completion_tokens),
  })
}

/**
 * The time of day for today's calls; earlier ones lead with their date, so a
 * 7 or 30 day list never shows two days as one.
 */
export function rowTime(value: string | null, now: Date = new Date()): string {
  if (!value) return '-'
  const date = new Date(value)
  const sameDay = date.toDateString() === now.toDateString()
  return new Intl.DateTimeFormat(getCurrentLanguage(), {
    ...(sameDay ? {} : { month: '2-digit', day: '2-digit' }),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function LogRow({
  log,
  selected,
  onSelect,
}: {
  log: GatewayLog
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  return (
    <TableRow
      data-state={selected ? 'selected' : undefined}
      className="cursor-pointer"
      onClick={onSelect}
    >
      <TableCell className="py-space-sm whitespace-nowrap">
        <button
          type="button"
          aria-pressed={selected}
          aria-label={t(`${PREFIX}.logs.rowLabel`, {
            time: formatInstant(log.started_at) ?? '',
            key: log.key_name,
            model: log.model ?? '',
            status: log.status_code,
          })}
          title={formatInstant(log.started_at) ?? undefined}
          className="rounded-radius-sm font-mono text-xs text-fg-muted outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus"
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          {rowTime(log.started_at)}
        </button>
      </TableCell>
      <TableCell>
        <StatusCode code={log.status_code} />
      </TableCell>
      <TableCell className="max-w-40 truncate text-sm text-fg">
        {log.key_name}
      </TableCell>
      <TableCell className="max-w-56">
        <div className="truncate font-mono text-sm text-fg">
          {log.model ?? '-'}
        </div>
        <div className="text-xs text-fg-subtle">
          {endpointLabel(t, log)}
          {retriesOf(log) > 0
            ? ` · ${t(`${PREFIX}.logs.retried`, { count: retriesOf(log) })}`
            : ''}
        </div>
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-fg-muted tabular-nums">
        {usageText(t, log)}
      </TableCell>
      <TableCell className="text-right text-sm whitespace-nowrap text-fg-muted tabular-nums">
        {log.cost === null || log.cost === undefined
          ? t(`${PREFIX}.common.empty`)
          : formatCost(log.cost)}
      </TableCell>
      <TableCell className="text-right text-sm whitespace-nowrap text-fg-muted tabular-nums">
        {formatDuration(log.duration_ms)}
      </TableCell>
      <TableCell className="w-8 text-fg-subtle">
        <ChevronRight className="size-icon-sm" aria-hidden="true" />
      </TableCell>
    </TableRow>
  )
}
