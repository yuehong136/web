import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import {
  segmentedItemVariants,
  segmentedListVariants,
} from './segmented-control'

type TabsVariant = 'underline' | 'segmented'

const TabsVariantContext = React.createContext<TabsVariant>('underline')

export type TabsProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
>

export interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
> {
  /**
   * `underline` (default) for section tabs over a panel; `segmented` for a
   * compact switch inside toolbars and narrow panes.
   */
  variant?: TabsVariant
}

export type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>

export type TabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>

/**
 * Radix Tabs: arrow keys (and Home/End) move between triggers, the active
 * trigger owns the tab stop, and panels are labelled by their trigger.
 * `value`/`defaultValue`/`onValueChange` behave as before.
 */
export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>((props, ref) => <TabsPrimitive.Root ref={ref} {...props} />)
Tabs.displayName = 'Tabs'

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = 'underline', ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      data-variant={variant}
      className={cn(
        variant === 'segmented'
          ? segmentedListVariants()
          : // DreamJira tab bar: text tabs over a hairline, 16px apart.
            'inline-flex min-h-[var(--control-height-lg)] max-w-full items-stretch gap-space-md border-b border-line',
        className,
      )}
      {...props}
    />
  </TabsVariantContext.Provider>
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        variant === 'segmented'
          ? segmentedItemVariants()
          : [
              // The 2px indicator overlaps the bar's hairline.
              '-mb-px inline-flex shrink-0 items-center justify-center gap-space-xs border-b-2 border-transparent px-space-2xs text-sm font-medium whitespace-nowrap text-fg-muted',
              'outline-hidden transition-colors duration-(--motion-fast) motion-reduce:transition-none',
              'focus-ring-inset hover:text-fg focus-visible:rounded-radius-sm',
              'disabled:pointer-events-none disabled:opacity-50',
              'data-[state=active]:border-fg data-[state=active]:text-fg',
              "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
            ],
        className,
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-space-sm focus-ring', className)}
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'
