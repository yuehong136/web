import React from 'react'
import { cn } from '@/lib/utils'

interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode
  right?: React.ReactNode
  sticky?: boolean
  wrap?: boolean
  surface?: 'default' | 'plain'
}

export const PageToolbar: React.FC<PageToolbarProps> = ({
  left,
  right,
  sticky = false,
  wrap = false,
  surface = 'default',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'z-10 flex items-center justify-between gap-space-base text-components-page-toolbar-text',
        surface !== 'plain' &&
          'border-b border-components-page-toolbar-border px-space-lg py-space-sm',
        sticky && 'sticky top-0',
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-space-sm',
          wrap && 'basis-60',
        )}
      >
        {left}
      </div>
      {right ? (
        <div
          className={cn(
            'flex items-center gap-space-sm',
            wrap ? 'min-w-0 flex-wrap' : 'shrink-0',
          )}
        >
          {right}
        </div>
      ) : null}
    </div>
  )
}
