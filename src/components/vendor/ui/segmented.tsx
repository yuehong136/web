import * as React from 'react'
import { cn } from './utils'

type SegmentedContextValue = {
  value: string
  onValueChange?: (value: string) => void
}

const SegmentedContext = React.createContext<SegmentedContextValue | null>(null)

export interface SegmentedProps extends React.ComponentProps<'div'> {
  value: string
  onValueChange?: (value: string) => void
}

export function Segmented({ value, onValueChange, className, children, ...props }: SegmentedProps) {
  return (
    <SegmentedContext.Provider value={{ value, onValueChange }}>
      <div
        role="tablist"
        data-slot="segmented"
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-1 border',
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
        'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border',
        'hover:bg-card/70',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}


