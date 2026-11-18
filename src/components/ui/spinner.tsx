import * as React from 'react'
import { LoaderCircle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'shrink-0 animate-spin text-accent-solid motion-reduce:animate-none',
  {
    variants: {
      size: {
        sm: 'size-icon-sm',
        md: 'size-icon-md',
        lg: 'size-icon-xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface SpinnerProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Visible text next to the spinner. Without it the spinner is decorative
   * and the surrounding control (e.g. a busy button) carries the status.
   */
  label?: React.ReactNode
  /** Stack the label under the spinner, for panel-level waits. */
  stacked?: boolean
}

/** The inline loading indicator: one rotating ring in the spinner colour. */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, label, stacked = false, ...props }, ref) => {
    if (!label) {
      return (
        <span
          ref={ref}
          className={cn('inline-flex', className)}
          aria-hidden="true"
          {...props}
        >
          <LoaderCircle className={spinnerVariants({ size })} />
        </span>
      )
    }

    return (
      <span
        ref={ref}
        role="status"
        className={cn(
          'inline-flex items-center gap-space-sm text-sm text-fg-muted',
          stacked && 'flex-col',
          className,
        )}
        {...props}
      >
        <LoaderCircle
          className={spinnerVariants({ size })}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
    )
  },
)
Spinner.displayName = 'Spinner'

export { spinnerVariants }
