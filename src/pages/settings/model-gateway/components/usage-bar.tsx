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
    <div className={cn('w-full', className)}>
      {/* Screen readers get a native meter; the bar below is its picture. */}
      <meter className="sr-only" min={0} max={100} value={value}>
        {label}
      </meter>
      <div
        aria-hidden="true"
        className={cn(
          'w-full overflow-hidden rounded-radius-full bg-fill-pressed',
          size === 'sm' ? 'h-1.5' : 'h-2',
        )}
      >
        <div
          className={cn(
            'h-full rounded-radius-full',
            value > 80 ? 'bg-warning-fg' : 'bg-accent-solid',
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
