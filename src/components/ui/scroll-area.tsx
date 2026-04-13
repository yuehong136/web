import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string
  viewportRef?: React.Ref<HTMLDivElement>
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({
  className,
  viewportClassName,
  viewportRef,
  children,
  ...props
}) => {
  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      <div
        ref={viewportRef}
        className={cn(
          'h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-components-scrollbar-thumb scrollbar-track-components-scrollbar-track',
          viewportClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

