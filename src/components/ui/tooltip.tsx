'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { CircleHelp } from 'lucide-react'

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-auto rounded-md whitespace-pre-wrap border border-border px-3 py-1.5 text-sm text-text-primary shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[30vw]',
      className,
    )}
    style={{ backgroundColor: 'var(--color-components-popover-bg, #ffffff)' }}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// 简化的 Tooltip 组件 API（兼容现有代码）
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  delayHide?: number
  maxWidth?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const side = position

  return (
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help">{children}</span>
        </TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

// 表单问号提示组件（与 ragflow 一致）
export const FormTooltip: React.FC<{ tooltip: React.ReactNode }> = ({ tooltip }) => {
  return (
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault()
          }}
          className="inline-flex"
        >
          <CircleHelp className="w-3 h-3 ml-1 text-text-tertiary hover:text-text-secondary transition-colors" />
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export { TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider }
