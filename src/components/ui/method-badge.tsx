import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const methodBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors',
  {
    variants: {
      // Status hues for the common verbs, identity hues for the rest; the
      // same role tokens in light and dark.
      method: {
        GET: 'bg-status-success-subtle text-status-success border-status-success-border',
        POST: 'bg-status-info-subtle text-status-info border-status-info-border',
        PUT: 'bg-status-warning-subtle text-status-warning border-status-warning-border',
        DELETE:
          'bg-status-error-subtle text-status-error border-status-error-border',
        PATCH:
          'bg-components-avatar-7-bg text-components-avatar-7-text border-components-avatar-7-bg',
        HEAD: 'bg-background-subtle text-text-secondary border-border-default',
        OPTIONS:
          'bg-components-avatar-8-bg text-components-avatar-8-text border-components-avatar-8-bg',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      method: 'GET' as const,
      size: 'default' as const,
    },
  },
)

export interface MethodBadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof methodBadgeVariants> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
}

const MethodBadge = React.forwardRef<HTMLSpanElement, MethodBadgeProps>(
  ({ className, method, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(methodBadgeVariants({ method, size }), className)}
      {...props}
    >
      {method}
    </span>
  ),
)

MethodBadge.displayName = 'MethodBadge'

export { MethodBadge, methodBadgeVariants }
