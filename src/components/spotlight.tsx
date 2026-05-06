import { cn } from '@/lib/utils'

interface SpotlightProps {
  className?: string
  opcity?: number
  coverage?: number
  X?: string
  Y?: string
}

export default function Spotlight({
  className,
  opcity = 0.7,
  coverage = 70,
  X = '50%',
  Y = '190%',
}: SpotlightProps) {
  const opacityPercent = `${Math.round(opcity * 100)}%`

  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        background: `radial-gradient(circle at ${X} ${Y}, color-mix(in srgb, var(--color-components-canvas-spotlight) ${opacityPercent}, transparent) 0%, transparent ${coverage}%)`,
      }}
    />
  )
}
