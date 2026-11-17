import React from 'react'
import { cn } from '@/lib/utils'

interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4
  children: React.ReactNode
}

const columnClasses: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

export const StatGrid: React.FC<StatGridProps> = ({
  columns = 4,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('mb-6 grid gap-4', columnClasses[columns], className)}
      {...props}
    >
      {children}
    </div>
  )
}

StatGrid.displayName = 'StatGrid'
