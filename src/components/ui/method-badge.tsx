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
        GET: 'bg-success-soft text-success-fg border-success-line',
        POST: 'bg-info-soft text-info-fg border-info-line',
        PUT: 'bg-warning-soft text-warning-fg border-warning-line',
        DELETE: 'bg-danger-soft text-danger-fg border-danger-line',
        PATCH: 'bg-avatar-7-bg text-avatar-7-fg border-avatar-7-bg',
        HEAD: 'bg-sunken text-fg-muted border-line',
        OPTIONS: 'bg-avatar-8-bg text-avatar-8-fg border-avatar-8-bg',
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
