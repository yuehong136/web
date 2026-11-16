import type * as React from 'react'
import { Tooltip } from './tooltip'

interface NavigationTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  enabled?: boolean
}

/**
 * @deprecated Use `<Tooltip side="right" asChild portal>`. Kept only until
 * `patterns/context-rail.tsx` moves to Tooltip; do not add new callers.
 */
export const NavigationTooltip: React.FC<NavigationTooltipProps> = ({
  content,
  children,
  enabled = true,
}) => (
  <Tooltip
    content={content}
    side="right"
    sideOffset={12}
    delayDuration={100}
    asChild
    portal
    disabled={!enabled}
  >
    {children}
  </Tooltip>
)
