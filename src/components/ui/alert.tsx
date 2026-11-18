import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const base =
    'rounded-radius-lg border px-space-base py-space-sm outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus'
  const variantCls =
    variant === 'destructive'
      ? 'border-danger-line bg-danger-soft text-danger-fg'
      : variant === 'success'
        ? 'border-success-line bg-success-soft text-success-fg'
        : variant === 'warning'
          ? 'border-warning-line bg-warning-soft text-warning-fg'
          : variant === 'info'
            ? 'border-info-line bg-info-soft text-info-fg'
            : 'border-line bg-surface text-fg'

  return <div className={cn(base, variantCls, className)} {...props} />
}

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h5
    className={cn('mb-space-2xs leading-5 font-medium', className)}
    {...props}
  />
)

export const AlertDescription: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ className, ...props }) => (
  <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
)
