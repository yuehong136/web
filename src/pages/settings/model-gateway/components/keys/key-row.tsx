import type { TFunction } from 'i18next'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayKey } from '@/api/model-gateway'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn, formatRelativeTime } from '@/lib/utils'
import { scopeOfKey } from '../../catalog'
import { PREFIX, daysLeft, formatCompact, quotaPercent } from '../../utils'
import { StatusDot } from '../status-dot'
import { UsageBar } from '../usage-bar'
import { KeyScopeCell } from './key-scope-cell'

const STATUS_TONE = {
  active: 'success',
  disabled: 'neutral',
  revoked: 'error',
} as const

/** "89 days left", turning to a warning within a week. */
export function expiryText(
  t: TFunction,
  key: GatewayKey,
  now: number = Date.now(),
): { text: string; tone: 'normal' | 'warning' | 'error' } {
  const days = daysLeft(key, now)
  if (days === null)
    return { text: t(`${PREFIX}.keys.neverExpires`), tone: 'normal' }
  if (days < 0) return { text: t(`${PREFIX}.keys.expired`), tone: 'error' }
  if (days === 0)
    return { text: t(`${PREFIX}.keys.expiresToday`), tone: 'warning' }
  return {
    text: t(`${PREFIX}.keys.daysLeft`, { count: days }),
    tone: days < 7 ? 'warning' : 'normal',
  }
}

/** "This month 18.6M / 30M", or `null` for a key without a quota. */
export function quotaText(t: TFunction, key: GatewayKey): string | null {
  if (key.token_quota === null || key.quota_period === null) return null
  return t(`${PREFIX}.quota.usage.${key.quota_period}`, {
    used: formatCompact(key.quota_used ?? 0),
    quota: formatCompact(key.token_quota),
  })
}

export function KeyRow({
  gatewayKey: key,
  catalog,
  selected,
  compact = false,
  onSelect,
}: {
  gatewayKey: GatewayKey
  catalog: GatewayCatalog
  selected: boolean
  /** Leaves out the last-use and chevron columns beside the detail panel. */
  compact?: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const quota = quotaText(t, key)
  const percent = quotaPercent(key)
  const expiry = expiryText(t, key)
  return (
    <TableRow
      data-state={selected ? 'selected' : undefined}
      className="cursor-pointer"
      onClick={onSelect}
    >
      <TableCell className="max-w-48 py-space-sm">
        <button
          type="button"
          aria-pressed={selected}
          className="flex max-w-full min-w-0 flex-col items-start rounded-radius-sm text-left outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus"
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          <span className="flex max-w-full min-w-0 items-center gap-space-xs">
            <StatusDot tone={STATUS_TONE[key.status]}>
              <span className="sr-only">
                {t(`${PREFIX}.keyStatus.${key.status}`)}
              </span>
            </StatusDot>
            <span className="truncate text-sm font-medium text-fg">
              {key.name}
            </span>
          </span>
          <span className="truncate pl-space-md font-mono text-xs text-fg-subtle">
            {key.redacted_key}
          </span>
        </button>
      </TableCell>
      <TableCell className="min-w-44">
        <KeyScopeCell catalog={catalog} scope={scopeOfKey(key)} />
      </TableCell>
      <TableCell className="min-w-36">
        {quota && percent !== null ? (
          <div className="space-y-space-xs">
            <div className="text-sm whitespace-nowrap text-fg tabular-nums">
              {quota}
            </div>
            <UsageBar percent={percent} label={quota} className="max-w-40" />
          </div>
        ) : (
          <span className="text-sm text-fg-subtle">
            {t(`${PREFIX}.keys.noQuota`)}
          </span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          'text-sm whitespace-nowrap',
          expiry.tone === 'normal' && 'text-fg-muted',
          expiry.tone === 'warning' && 'font-medium text-warning-fg',
          expiry.tone === 'error' && 'text-danger-fg',
        )}
      >
        {expiry.text}
      </TableCell>
      {compact ? null : (
        <>
          <TableCell className="text-sm whitespace-nowrap text-fg-muted">
            {key.last_used_at
              ? formatRelativeTime(new Date(key.last_used_at).getTime())
              : t(`${PREFIX}.keys.neverUsed`)}
          </TableCell>
          <TableCell className="w-8 text-fg-subtle">
            <ChevronRight className="size-icon-sm" aria-hidden="true" />
          </TableCell>
        </>
      )}
    </TableRow>
  )
}
