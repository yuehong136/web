import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render this many text lines, the last one shorter. */
  lines?: number
}

/**
 * Placeholder shapes while content loads. Size a single block with classes
 * (`h-icon-md w-full`); use `lines` for paragraphs. Decorative: announce the
 * wait on the region that owns it (`aria-busy`), not on each shape.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, lines = 1, ...props }, ref) => {
    if (lines <= 1) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={cn(
            'h-icon-sm skeleton-shimmer rounded-radius-sm motion-reduce:animate-none',
            className,
          )}
          {...props}
        />
      )
    }

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn('space-y-space-sm', className)}
        {...props}
      >
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              'h-icon-sm skeleton-shimmer rounded-radius-sm motion-reduce:animate-none',
              index === lines - 1 ? 'w-3/4' : 'w-full',
            )}
          />
        ))}
      </div>
    )
  },
)
Skeleton.displayName = 'Skeleton'
