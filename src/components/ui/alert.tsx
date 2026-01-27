import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

export const Alert: React.FC<AlertProps> = ({ className, variant = 'default', ...props }) => {
  const base = 'rounded-md border p-4 focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none'
  const variantCls =
    variant === 'destructive'
      ? 'border-components-alert-error-border bg-components-alert-error-bg text-components-alert-error-text'
      : variant === 'success'
      ? 'border-components-alert-success-border bg-components-alert-success-bg text-components-alert-success-text'
      : variant === 'warning'
      ? 'border-components-alert-warning-border bg-components-alert-warning-bg text-components-alert-warning-text'
      : variant === 'info'
      ? 'border-components-alert-info-border bg-components-alert-info-bg text-components-alert-info-text'
      : 'border-border bg-card text-foreground'

  return <div className={cn(base, variantCls, className)} {...props} />
}

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
)

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
)


