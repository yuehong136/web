import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type SummaryListRenderOptions = {
  withDivider: boolean
}

interface SummaryListProps<T> {
  items: T[]
  renderItem: (
    item: T,
    index: number,
    options: SummaryListRenderOptions,
  ) => ReactNode
  empty?: ReactNode
  visibleCount?: number
  className?: string
}

export function SummaryList<T>({
  items,
  renderItem,
  empty,
  visibleCount = 3,
  className,
}: SummaryListProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const visibleItems = items.slice(0, visibleCount)
  const hiddenItems = items.slice(visibleCount)

  if (items.length === 0) {
    return empty ? (
      <div className={cn('px-space-sm pb-space-sm', className)}>{empty}</div>
    ) : null
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('px-space-sm pb-space-sm', className)}
    >
      <div className="pt-space-xs">
        {visibleItems.map((item, index) =>
          renderItem(item, index, { withDivider: index > 0 }),
        )}

        {hiddenItems.length > 0 ? (
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            {hiddenItems.map((item, index) =>
              renderItem(item, index + visibleItems.length, {
                withDivider: true,
              }),
            )}
          </CollapsibleContent>
        ) : null}

        {hiddenItems.length > 0 ? (
          <div className="border-t border-border-subtle pt-space-sm">
            <CollapsibleTrigger
              asChild
              onClick={(event) => event.stopPropagation()}
              className="block cursor-pointer"
            >
              <button
                type="button"
                className={cn(
                  'mx-auto flex size-5 items-center justify-center rounded-radius-full bg-text-secondary text-text-inverted shadow-elevation-low transition-colors',
                  isOpen && 'bg-text-primary',
                )}
              >
                {isOpen ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        ) : null}
      </div>
    </Collapsible>
  )
}
