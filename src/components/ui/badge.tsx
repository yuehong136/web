import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
}

const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
          'bg-green-100 text-green-800 hover:bg-green-200': variant === 'success',
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': variant === 'warning',
          'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }