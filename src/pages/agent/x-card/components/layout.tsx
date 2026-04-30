import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Tabs as UITabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  alignClassMap,
  justifyClassMap,
  toArray,
  toChildList,
  toDisplayString,
  type CommonProps,
} from './shared'

export function XCardRow({
  align = 'stretch',
  children,
  justify = 'start',
}: CommonProps & {
  align?: keyof typeof alignClassMap
  justify?: keyof typeof justifyClassMap
}) {
  return (
    <div className={cn('flex flex-wrap gap-space-sm', alignClassMap[align], justifyClassMap[justify])}>
      {children}
    </div>
  )
}

export function XCardColumn({
  align = 'stretch',
  children,
  justify = 'start',
}: CommonProps & {
  align?: keyof typeof alignClassMap
  justify?: keyof typeof justifyClassMap
}) {
  return (
    <div className={cn('flex flex-col gap-space-sm', alignClassMap[align], justifyClassMap[justify])}>
      {children}
    </div>
  )
}

export function XCardList({
  align = 'stretch',
  children,
  direction = 'vertical',
  items,
}: CommonProps & {
  align?: keyof typeof alignClassMap
  direction?: 'horizontal' | 'vertical'
  items?: unknown
}) {
  const itemList = toArray(items)
  const isHorizontal = direction === 'horizontal'
  const content = children || itemList.map((item, index) => (
    <div
      key={index}
      className="rounded-radius-md border border-border-subtle bg-surface-secondary px-space-sm py-space-xs text-sm text-text-primary"
    >
      {toDisplayString(item) || JSON.stringify(item)}
    </div>
  ))

  return (
    <div className={cn('flex gap-space-sm', isHorizontal ? 'flex-row flex-wrap' : 'flex-col', alignClassMap[align])}>
      {content}
    </div>
  )
}

export function XCardCard({ children }: CommonProps) {
  return (
    <section className="rounded-radius-lg border border-border-default bg-surface-primary p-space-base shadow-elevation-low">
      <div className="space-y-space-sm">{children}</div>
    </section>
  )
}

export function XCardTabs({
  children,
  tabTitles = [],
}: CommonProps & {
  tabTitles?: unknown[]
}) {
  const childList = toChildList(children)
  const titles = tabTitles.map(toDisplayString)
  const firstValue = titles[0] || 'tab-0'

  return (
    <UITabs defaultValue={firstValue}>
      <TabsList className="max-w-full flex-wrap justify-start">
        {childList.map((_, index) => {
          const title = titles[index] || `Tab ${index + 1}`
          return (
            <TabsTrigger key={title} value={title}>
              {title}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {childList.map((child, index) => {
        const title = titles[index] || `Tab ${index + 1}`
        return (
          <TabsContent key={title} value={title}>
            {child}
          </TabsContent>
        )
      })}
    </UITabs>
  )
}

export function XCardModal({ children }: CommonProps) {
  const [open, setOpen] = useState(false)
  const childList = toChildList(children)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{childList[0] || 'Open'}</DialogTrigger>
      <DialogContent>{childList[1]}</DialogContent>
    </Dialog>
  )
}

export function XCardDivider({ axis }: { axis?: unknown }) {
  const direction = toDisplayString(axis)
  return (
    <Separator
      orientation={direction === 'vertical' ? 'vertical' : 'horizontal'}
      className={direction === 'vertical' ? 'min-h-space-lg' : undefined}
    />
  )
}
