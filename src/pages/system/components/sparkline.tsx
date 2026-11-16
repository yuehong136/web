import { cn } from '@/lib/utils'

const WIDTH = 64
const HEIGHT = 20

/**
 * A tiny trend line in plain SVG (no chart library). It inherits the text
 * colour, so callers tint it with a token class. Needs at least two points.
 */
export function Sparkline({
  values,
  label,
  className,
}: {
  values: readonly number[]
  /** Spoken summary, e.g. "Latency trend: 12 to 30 ms". */
  label: string
  className?: string
}) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = WIDTH / (values.length - 1)
  const points = values
    .map((value, index) => {
      const x = index * step
      // Keep a 2px margin so the stroke is never clipped.
      const y = HEIGHT - 2 - ((value - min) / span) * (HEIGHT - 4)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('h-5 w-16 shrink-0 overflow-visible', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
