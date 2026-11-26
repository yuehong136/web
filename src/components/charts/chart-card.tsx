import type { ReactNode } from 'react'
import { BarChart3, LineChart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

export type ChartVariant = 'bar' | 'line'

export interface ChartLegendItem {
  label: ReactNode
  /** A resolved colour from `useChartTheme`. */
  color: string
}

/**
 * One chart of a dashboard: what it measures, the window's total beside the
 * title, a legend naming each colour, and a switch between bars and lines
 * where both read well. Dashboards lay these out in a grid so each question
 * (how much, what it cost, how fast) has its own picture.
 */
export function ChartCard({
  title,
  total,
  totalHint,
  legend,
  variant,
  onVariantChange,
  variantLabels,
  empty,
  className,
  children,
}: {
  title: ReactNode
  /** The headline figure of the window, shown beside the title. */
  total?: ReactNode
  /** What the total counts, when the title does not say it. */
  totalHint?: ReactNode
  legend?: ChartLegendItem[]
  variant?: ChartVariant
  onVariantChange?: (variant: ChartVariant) => void
  /** Names of the switch and its two choices, for assistive technology. */
  variantLabels?: { group: string; bar: string; line: string }
  /** Shown in place of the chart when the window has nothing to draw. */
  empty?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'flex min-w-0 flex-col rounded-radius-xl border border-line bg-surface p-space-lg',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-space-md">
        <div className="min-w-0">
          <h3 className="text-sm text-fg-muted">{title}</h3>
          {total === undefined ? null : (
            <p className="mt-space-xs flex items-baseline gap-space-sm">
              <span className="text-2xl font-semibold text-fg tabular-nums">
                {total}
              </span>
              {totalHint ? (
                <span className="truncate text-xs text-fg-subtle">
                  {totalHint}
                </span>
              ) : null}
            </p>
          )}
        </div>
        {variant && onVariantChange && variantLabels ? (
          <SegmentedControl
            size="sm"
            iconOnly
            aria-label={variantLabels.group}
            value={variant}
            onValueChange={onVariantChange}
            options={[
              {
                value: 'bar',
                label: variantLabels.bar,
                icon: <BarChart3 aria-hidden="true" />,
              },
              {
                value: 'line',
                label: variantLabels.line,
                icon: <LineChart aria-hidden="true" />,
              },
            ]}
          />
        ) : null}
      </div>
      {legend && legend.length > 0 ? (
        <ul className="mt-space-sm flex flex-wrap gap-x-space-md gap-y-space-xs text-xs text-fg-muted">
          {legend.map((item, index) => (
            <li
              key={index}
              className="inline-flex min-w-0 items-center gap-space-xs"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-radius-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-space-md min-w-0 flex-1">
        {empty ? (
          <p className="flex h-52 items-center justify-center text-center text-sm text-fg-subtle">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}
