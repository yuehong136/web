import { cn } from '@/lib/utils'

interface SpotlightProps {
  className?: string
  opcity?: number
  coverage?: number
}

export default function Spotlight({
  className,
  opcity = 0.7,
  coverage = 70,
}: SpotlightProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        opacity: opcity,
        maskImage: `radial-gradient(circle at 50% 40%, black ${coverage}%, transparent 100%)`,
        WebkitMaskImage: `radial-gradient(circle at 50% 40%, black ${coverage}%, transparent 100%)`,
        background: 'var(--color-surface-primary, transparent)',
      }}
    />
  )
}

