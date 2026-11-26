import { useState, type PointerEvent, type ReactNode } from 'react'
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

const LINE_TONE: Record<KpiTone, string> = {
  neutral: 'text-accent-solid',
  info: 'text-accent-solid',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  error: 'text-danger-fg',
}

export interface KpiTrendPoint {
  /** What the description line reads while this point is hovered. */
  label: string
  value: number
}

const WIDTH = 100
const HEIGHT = 28

/** The points as an SVG path from one zero baseline; `null` when flat at zero. */
export function sparklinePath(values: number[]): string | null {
  const peak = Math.max(0, ...values)
  if (values.length < 2 || peak === 0) return null
  const step = WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = (index * step).toFixed(2)
      const y = (HEIGHT - (value / peak) * (HEIGHT - 2) - 1).toFixed(2)
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`
    })
    .join(' ')
}

function Sparkline({
  values,
  active,
  onActive,
  className,
}: {
  values: number[]
  active: number | null
  onActive: (index: number | null) => void
  className: string
}) {
  const path = sparklinePath(values)
  if (!path) return <div className="h-8" aria-hidden="true" />
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    onActive(
      Math.min(
        values.length - 1,
        Math.max(0, Math.round(ratio * (values.length - 1))),
      ),
    )
  }
  const markerX =
    active === null ? null : (active / (values.length - 1)) * WIDTH
  return (
    <div
      aria-hidden="true"
      className={cn('h-8 touch-none', className)}
      onPointerMove={move}
      onPointerLeave={() => onActive(null)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="size-full overflow-visible"
      >
        <path
          d={`${path} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`}
          fill="currentColor"
          opacity={0.12}
        />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {markerX === null ? null : (
          <line
            x1={markerX}
            x2={markerX}
            y1={0}
            y2={HEIGHT}
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  )
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
        <Sparkline
          values={trend.map((item) => item.value)}
          active={active}
          onActive={setActive}
          className={cn('mt-space-sm', LINE_TONE[tone])}
        />
      ) : null}
    </SectionCard>
  )
}
