import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONES = {
  success: { dot: 'bg-success-fg', text: 'text-success-fg' },
  error: { dot: 'bg-danger-fg', text: 'text-danger-fg' },
  warning: { dot: 'bg-warning-fg', text: 'text-warning-fg' },
  neutral: { dot: 'bg-fg-subtle', text: 'text-fg-muted' },
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
