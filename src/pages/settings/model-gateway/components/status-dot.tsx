import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONES = {
  success: { dot: 'bg-status-success', text: 'text-status-success' },
  error: { dot: 'bg-status-error', text: 'text-status-error' },
  warning: { dot: 'bg-status-warning', text: 'text-status-warning' },
  neutral: { dot: 'bg-text-tertiary', text: 'text-text-secondary' },
} as const

/** A state as a coloured dot and its label, lighter than a badge in tables. */
export function StatusDot({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONES
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-space-xs text-sm whitespace-nowrap',
        TONES[tone].text,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-radius-full', TONES[tone].dot)}
      />
      {children}
    </span>
  )
}
