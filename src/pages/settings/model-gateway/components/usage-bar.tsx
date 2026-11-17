import { cn } from '@/lib/utils'

interface UsageBarProps {
  /** 0–100. */
  percent: number
  /** Accessible name, e.g. "This month 18.6M / 30M". */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

/** A thin meter for quota use; it turns to the warning colour past 80%. */
export function UsageBar({
  percent,
  label,
  size = 'sm',
  className,
}: UsageBarProps) {
  const value = Math.max(0, Math.min(100, percent))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn(
        'w-full overflow-hidden rounded-radius-full bg-components-progress-bg',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-radius-full',
          value > 80 ? 'bg-status-warning' : 'bg-components-progress-fill',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
