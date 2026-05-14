import React from 'react'
import { cn } from '@/lib/utils'

interface ConsolePageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  toolbar?: React.ReactNode
  rail?: React.ReactNode
  children: React.ReactNode
  /**
   * Controls the body (children) overflow strategy.
   * - `'auto'` (default, legacy): body scrolls if children grow beyond available height.
   *   Use for pages that don't self-manage scroll (e.g. simple content lists).
   * - `'hidden'`: body never scrolls itself; children are required to be `h-full`
   *   and self-manage scroll regions. Prefer this for any layout whose child
   *   pages already declare `h-full overflow-hidden` (settings / search / detail shells).
   */
  bodyOverflow?: 'auto' | 'hidden'
}

export const ConsolePageTemplate: React.FC<ConsolePageTemplateProps> = ({
  header,
  toolbar,
  rail,
  children,
  bodyOverflow = 'auto',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 overflow-hidden bg-components-console-bg',
        className,
      )}
      {...props}
    >
      {rail}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {header}
        {toolbar}
        <div
          className={cn(
            'min-h-0 flex-1',
            bodyOverflow === 'hidden' ? 'overflow-hidden' : 'overflow-auto',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
