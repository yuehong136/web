import * as React from 'react'
import { cn } from './utils'

type SegmentedContextValue = {
  value: string
  onValueChange?: (value: string) => void
  block?: boolean
}

const SegmentedContext = React.createContext<SegmentedContextValue | null>(null)

export interface SegmentedProps extends React.ComponentProps<'div'> {
  value: string
  onValueChange?: (value: string) => void
  /** 是否占满容器宽度，子项平分空间 */
  block?: boolean
}

export function Segmented({ value, onValueChange, block, className, children, ...props }: SegmentedProps) {
  return (
    <SegmentedContext.Provider value={{ value, onValueChange, block }}>
      <div
        role="tablist"
        data-slot="segmented"
        className={cn(
          'bg-[var(--color-components-segmented-bg)] text-[var(--color-components-segmented-item-text)] inline-flex h-9 items-center justify-center rounded-xl p-1 border border-[var(--color-components-segmented-border)]',
          block ? 'w-full' : 'w-fit',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SegmentedContext.Provider>
  )
}

export interface SegmentedItemProps extends React.ComponentProps<'button'> {
  value: string
}

export function SegmentedItem({ value, className, children, ...props }: SegmentedItemProps) {
  const ctx = React.useContext(SegmentedContext)
  const active = ctx?.value === value
  return (
    <button
      role="tab"
      aria-selected={active}
      data-state={active ? 'active' : 'inactive'}
      onClick={(e) => {
        props.onClick?.(e)
        if (ctx?.onValueChange) ctx.onValueChange(value)
      }}
      className={cn(
        'inline-flex h-7 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium border border-transparent',
        'text-[var(--color-components-segmented-item-text)]',
        'data-[state=active]:bg-[var(--color-components-segmented-item-bg-active)] data-[state=active]:text-[var(--color-components-segmented-item-text-active)]',
        'hover:bg-[var(--color-components-segmented-item-bg-hover)]',
        ctx?.block && 'flex-1',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}


