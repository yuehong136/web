import * as React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const SegmentedTabs = Tabs.Root
export const SegmentedTabsContent = Tabs.Content

export const SegmentedTabsList = React.forwardRef<
  React.ElementRef<typeof Tabs.List>,
  React.ComponentPropsWithoutRef<typeof Tabs.List>
>(({ className, ...props }, ref) => (
  <Tabs.List
    ref={ref}
    className={cn(
      'flex shrink-0 gap-space-xs overflow-x-auto border-b border-border-subtle p-space-sm',
      className,
    )}
    {...props}
  />
))
SegmentedTabsList.displayName = 'SegmentedTabsList'

export const SegmentedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof Tabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof Tabs.Trigger>
>(({ className, ...props }, ref) => (
  <Tabs.Trigger
    ref={ref}
    className={cn(
      'flex shrink-0 items-center gap-space-xs rounded-radius-md px-space-sm py-space-sm text-sm font-medium whitespace-nowrap text-text-secondary hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden data-[state=active]:bg-state-active data-[state=active]:text-text-primary',
      className,
    )}
    {...props}
  />
))
SegmentedTabsTrigger.displayName = 'SegmentedTabsTrigger'
