import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { cn } from '@/lib/utils'
import { PREFIX, formatCount, formatPercent } from '../../utils'
import { StatusCode } from '../status-code'

/** Rate limits and timeouts pass; upstream faults do not; the rest is the caller's request. */
const segmentTone = (status: number) =>
  status === 429 || status === 408
    ? 'bg-warning-fg'
    : status >= 500
      ? 'bg-danger-fg'
      : 'bg-fg-subtle'

/**
 * What the failed calls of the window failed with: one bar split by status
 * and error code, and the same split as a list. Pointing at a row picks its
 * share out of the bar.
 */
export function ErrorBreakdown({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const [active, setActive] = useState<number | null>(null)
  const rows = overview.errors_by_code
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <SectionCard
      padding="default"
      title={t(`${PREFIX}.overview.errorBreakdown`)}
    >
      {total === 0 ? (
        <p className="py-space-xl text-center text-sm text-fg-subtle">
          {t(`${PREFIX}.overview.failureNone`)}
        </p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="flex h-2 gap-0.5 overflow-hidden rounded-radius-full"
          >
            {rows.map((row, index) => (
              <div
                key={`${row.status_code}-${row.code}`}
                className={cn(
                  'h-full min-w-1 transition-opacity',
                  segmentTone(row.status_code),
                  active !== null && active !== index && 'opacity-30',
                )}
                style={{ width: `${(row.count / total) * 100}%` }}
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
                  className={cn(
                    'size-2 shrink-0 rounded-radius-sm',
                    segmentTone(row.status_code),
                  )}
                />
                <StatusCode code={row.status_code} />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-fg">
                  {row.code ?? t(`${PREFIX}.common.unknown`)}
                </span>
                <span className="shrink-0 text-sm text-fg-muted tabular-nums">
                  {t(`${PREFIX}.overview.errorShare`, {
                    count: formatCount(row.count),
                    share: formatPercent(row.count / total, 0),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  )
}
