'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { CircleHelp } from 'lucide-react'
import { KbdShortcut } from './kbd'
import { useActivePortalTheme, usePortalContainer } from './portal-theme'

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

/** DreamJira tooltip: a small surface card, not an inverted bubble. */
const tooltipContentClass =
  'z-50 max-w-sm overflow-auto rounded-radius-md border border-border-default bg-components-popover-bg px-space-sm py-space-xs text-xs leading-4 whitespace-pre-wrap text-text-primary shadow-elevation-medium animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 motion-reduce:animate-none'

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipContentClass, className)}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/**
 * Tooltip content rendered into the theme scope's portal container, for
 * triggers inside clipped or transformed containers such as navigation rails.
 */
const TooltipPortalContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>((props, ref) => {
  const container = usePortalContainer()
  const theme = useActivePortalTheme(true)
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipContent ref={ref} data-theme={theme} {...props} />
    </TooltipPrimitive.Portal>
  )
})
TooltipPortalContent.displayName = 'TooltipPortalContent'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  /** Preferred side; `position` is the older name for the same prop. */
  side?: TooltipSide
  /** @deprecated Use `side`. */
  position?: TooltipSide
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  /** Keys shown after the label, e.g. `['Ctrl', 'B']`. */
  shortcut?: string | readonly string[]
  /**
   * Use the child itself as the trigger. Without it the child is wrapped in a
   * span, which suits text and disabled controls that cannot take focus.
   */
  asChild?: boolean
  /** Render the label into the portal container instead of in place. */
  portal?: boolean
  /** Show the child without a tooltip. */
  disabled?: boolean
  delayDuration?: number
  className?: string
  /** @deprecated Has no effect. */
  delayHide?: number
  /** @deprecated Has no effect; use `className`. */
  maxWidth?: string
}

/** One-line API: a label, optional shortcut and side around a trigger. */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side,
  position,
  align,
  sideOffset,
  shortcut,
  asChild = false,
  portal = false,
  disabled = false,
  delayDuration = 200,
  className,
}) => {
  if (disabled) return <>{children}</>
  const Content = portal ? TooltipPortalContent : TooltipContent
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          {asChild ? (
            children
          ) : (
            <span className="inline-flex cursor-help">{children}</span>
          )}
        </TooltipTrigger>
        <Content
          side={side ?? position ?? 'top'}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            shortcut && 'flex items-center gap-space-sm',
            className,
          )}
        >
          {shortcut ? (
            <>
              <span className="min-w-0">{content}</span>
              <KbdShortcut keys={shortcut} />
            </>
          ) : (
            content
          )}
        </Content>
      </TooltipRoot>
    </TooltipProvider>
  )
}

// 表单问号提示组件（与 ragflow 一致）
export const FormTooltip: React.FC<{ tooltip: React.ReactNode }> = ({
  tooltip,
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault()
            }}
            className="inline-flex cursor-help"
          >
            <CircleHelp className="ml-space-xs size-icon-xs text-text-tertiary transition-colors hover:text-text-secondary" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortalContent,
  TooltipProvider,
}
