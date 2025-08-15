import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ className, viewportClassName, children, ...props }) => {
  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      <div className={cn('h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-components-scrollbar-thumb scrollbar-track-components-scrollbar-track', viewportClassName)}>
        {children}
      </div>
    </div>
  )
}


