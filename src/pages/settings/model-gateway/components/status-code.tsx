import { badgeVariants } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusTone } from '../utils'

const VARIANTS = {
  success: 'success',
  warning: 'warning',
  error: 'destructive',
  neutral: 'secondary',
} as const

/** An HTTP status as a small lozenge; the number itself carries the meaning. */
export function StatusCode({
  code,
  className,
}: {
  code: number
  className?: string
}) {
  return (
    <span
      className={cn(
        badgeVariants({ variant: VARIANTS[statusTone(code)] }),
        'font-mono tabular-nums',
        className,
      )}
    >
      {code}
    </span>
  )
}
