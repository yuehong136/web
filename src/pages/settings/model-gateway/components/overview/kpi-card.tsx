import { useState, type ReactNode } from 'react'
import { Sparkline, useChartTheme, type ChartTheme } from '@/components/charts'
import { SectionCard } from '@/components/patterns'
import { cn } from '@/lib/utils'

export type KpiTone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

const ICON_TONE: Record<KpiTone, string> = {
  neutral: 'bg-sunken text-fg-muted',
  info: 'bg-info-soft text-info-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  error: 'bg-danger-soft text-danger-fg',
}

const lineColor = (tone: KpiTone, theme: ChartTheme) =>
  tone === 'warning'
    ? theme.warning
    : tone === 'error'
      ? theme.danger
      : tone === 'success'
        ? theme.success
        : theme.accent

export interface KpiTrendPoint {
  /** What the description line reads while this point is hovered. */
  label: string
  value: number
}

/**
 * One number of the window with how it moved through it. Pointing at the
 * trend swaps the description for that moment's value, so the line under the
 * number always says what is being looked at.
 */
export function KpiCard({
  title,
  value,
  description,
  icon,
  tone = 'neutral',
  trend,
}: {
  title: string
  value: ReactNode
  description: ReactNode
  icon: ReactNode
  tone?: KpiTone
  trend?: KpiTrendPoint[]
}) {
  const theme = useChartTheme()
  const [active, setActive] = useState<number | null>(null)
  const point = active === null ? undefined : trend?.[active]
  return (
    <SectionCard padding="default">
      <div className="flex items-start justify-between gap-space-md">
        <div className="flex min-w-0 flex-col gap-space-xs">
          <p className="text-sm text-fg-muted">{title}</p>
          <p className="text-2xl font-semibold text-fg tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-radius-lg',
            ICON_TONE[tone],
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          'mt-space-xs truncate text-sm tabular-nums',
          point ? 'text-fg' : 'text-fg-muted',
        )}
      >
        {point ? point.label : description}
      </p>
      {trend ? (
        <div className="mt-space-sm">
          <Sparkline
            values={trend.map((item) => item.value)}
            color={lineColor(tone, theme)}
            onActive={setActive}
          />
        </div>
      ) : null}
    </SectionCard>
  )
}
