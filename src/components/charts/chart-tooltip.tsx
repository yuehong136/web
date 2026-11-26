import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ChartTooltipRow {
  label: ReactNode
  value: ReactNode
  /** The series colour, as a resolved value from `useChartTheme`. */
  color?: string
  /** The headline figure of the tooltip. */
  strong?: boolean
}

/**
 * What a chart says about the point under the pointer: a heading and one row
 * per figure. Charts pass it as the content of Recharts' `Tooltip`, so every
 * chart in the product reads the same way.
 */
export function ChartTooltipCard({
  title,
  rows,
  className,
}: {
  title: ReactNode
  rows: ChartTooltipRow[]
  className?: string
}) {
  return (
    <div
      data-testid="chart-tooltip"
      className={cn(
        'min-w-44 rounded-radius-md border border-line bg-raised px-space-md py-space-sm text-xs shadow-elevation-medium',
        className,
      )}
    >
      <div className="mb-space-xs font-medium text-fg">{title}</div>
      <dl className="flex flex-col gap-space-xs">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-space-lg"
          >
            <dt className="inline-flex items-center gap-space-xs text-fg-muted">
              {row.color ? (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-radius-sm"
                  style={{ backgroundColor: row.color }}
                />
              ) : null}
              {row.label}
            </dt>
            <dd
              className={cn(
                'text-fg tabular-nums',
                row.strong && 'font-semibold',
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
