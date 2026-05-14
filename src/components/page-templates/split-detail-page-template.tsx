import React from 'react'
import { cn } from '@/lib/utils'

interface SplitDetailPageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  leftPane: React.ReactNode
  rightPane: React.ReactNode
  leftWidth?: number | string
  minLeft?: number | string
  /**
   * Visual treatment for the two panes.
   * - `'plain'` (default): panes are transparent and share the template gutter
   *   background. Use when each pane already owns its surface treatment (e.g. an
   *   inner Card / rail / canvas).
   * - `'card'`: each pane gets its own surface (rounded border, surface bg,
   *   gutter padding). Use for form / preview layouts where empty space below
   *   short content would otherwise expose the page-level dark gutter.
   */
  paneVariant?: 'plain' | 'card'
}

export const SplitDetailPageTemplate: React.FC<
  SplitDetailPageTemplateProps
> = ({
  header,
  leftPane,
  rightPane,
  leftWidth = 360,
  minLeft = 280,
  paneVariant = 'plain',
  className,
  ...props
}) => {
  const card = paneVariant === 'card'
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-components-split-pane-bg',
        className,
      )}
      {...props}
    >
      {header}
      <div
        className={cn('flex min-h-0 flex-1', card && 'gap-space-md p-space-md')}
      >
        <aside
          className={cn(
            'min-h-0 shrink-0',
            card
              ? 'rounded-radius-lg flex flex-col overflow-hidden border border-components-console-border bg-components-console-surface'
              : 'scroll-area overflow-auto border-r border-components-split-pane-border',
          )}
          style={{ width: leftWidth, minWidth: minLeft }}
        >
          {card ? (
            <div
              data-scroll-root="split-left"
              className="scroll-area min-h-0 flex-1 overflow-auto"
            >
              {leftPane}
            </div>
          ) : (
            leftPane
          )}
        </aside>
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1',
            card
              ? 'rounded-radius-lg flex flex-col overflow-hidden border border-components-console-border bg-components-console-surface'
              : 'scroll-area overflow-auto',
          )}
        >
          {card ? (
            <div
              data-scroll-root="split-right"
              className="scroll-area min-h-0 flex-1 overflow-auto"
            >
              {rightPane}
            </div>
          ) : (
            rightPane
          )}
        </div>
      </div>
    </div>
  )
}
