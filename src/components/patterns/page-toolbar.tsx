import React from 'react'
import { cn } from '@/lib/utils'

interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode
  right?: React.ReactNode
  sticky?: boolean
}

export const PageToolbar: React.FC<PageToolbarProps> = ({
  left,
  right,
  sticky = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'z-10 flex items-center justify-between gap-space-base border-b border-components-page-toolbar-border px-space-lg py-space-sm text-components-page-toolbar-text',
        sticky && 'sticky top-0',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-space-sm">{left}</div>
      {right ? <div className="flex shrink-0 items-center gap-space-sm">{right}</div> : null}
    </div>
  )
}
