import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { ChartCard, useChartTheme } from '@/components/charts'
import { cn } from '@/lib/utils'
import { PREFIX, formatCount, formatPercent } from '../../utils'
import { StatusCode } from '../status-code'

/**
 * What the failed calls of the window failed with: one bar split by status
 * and error code, and the same split as a list. Rate limits and timeouts
 * pass, upstream faults do not, the rest is the caller's request; each kind
 * has its colour. Pointing at a row picks its share out of the bar.
 */
export function ErrorBreakdown({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const theme = useChartTheme()
  const [active, setActive] = useState<number | null>(null)
  const rows = overview.errors_by_code
  const listed = rows.reduce((sum, row) => sum + row.count, 0)
  const colorOf = (status: number) =>
    status === 429 || status === 408
      ? theme.warning
      : status >= 500
        ? theme.danger
        : theme.tick
  return (
    <ChartCard
      title={t(`${PREFIX}.overview.errorBreakdown`)}
      total={formatCount(overview.totals.errors)}
      totalHint={t(`${PREFIX}.overview.errorTotal`)}
      empty={listed === 0 ? t(`${PREFIX}.overview.failureNone`) : null}
    >
      <div
        aria-hidden="true"
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-radius-full"
      >
        {rows.map((row, index) => (
          <div
            key={`${row.status_code}-${row.code}`}
            className={cn(
              'h-full min-w-1 transition-opacity',
              active !== null && active !== index && 'opacity-30',
            )}
            style={{
              width: `${(row.count / listed) * 100}%`,
              backgroundColor: colorOf(row.status_code),
            }}
          />
        ))}
      </div>
      <ul
        className="mt-space-md flex flex-col"
        onPointerLeave={() => setActive(null)}
      >
        {rows.map((row, index) => (
          <li
            key={`${row.status_code}-${row.code}`}
            className={cn(
              '-mx-space-sm flex items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs',
              active === index && 'bg-fill-hover',
            )}
            onPointerEnter={() => setActive(index)}
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-radius-full"
              style={{ backgroundColor: colorOf(row.status_code) }}
            />
            <StatusCode code={row.status_code} />
            <span
              className="min-w-0 flex-1 truncate font-mono text-sm text-fg"
              title={row.code ?? undefined}
            >
              {row.code ?? t(`${PREFIX}.common.unknown`)}
            </span>
            <span className="shrink-0 text-sm text-fg-muted tabular-nums">
              {t(`${PREFIX}.overview.errorShare`, {
                count: formatCount(row.count),
                share: formatPercent(row.count / listed, 0),
              })}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}
