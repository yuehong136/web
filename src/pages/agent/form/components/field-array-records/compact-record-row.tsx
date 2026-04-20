import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ChevronDown, Trash2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'

type CompactRecordRowProps = {
  children: ReactNode
  advanced?: ReactNode
  chip?: ReactNode
  defaultAdvancedOpen?: boolean
  onRemove?: () => void
  canRemove?: boolean
  className?: string
  gridClassName?: string
}

export function CompactRecordRow({
  children,
  advanced,
  chip,
  defaultAdvancedOpen = false,
  onRemove,
  canRemove = true,
  className,
  gridClassName,
}: CompactRecordRowProps) {
  const [advancedOpen, setAdvancedOpen] = useState(defaultAdvancedOpen)

  const hasAdvanced = Boolean(advanced)

  return (
    <div
      className={cn(
        'rounded-radius-md border border-border-default bg-surface-secondary/40 px-space-sm py-space-xs',
        className,
      )}
    >
      <div className="flex items-center gap-space-xs">
        <div
          className={cn('flex-1 min-w-0 flex items-center gap-space-sm', gridClassName)}
        >
          {children}
        </div>

        {chip && (
          <span className="rounded-radius-sm border border-border-default px-space-xs py-[2px] text-xs text-text-secondary whitespace-nowrap">
            {chip}
          </span>
        )}

        {hasAdvanced && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-label="Toggle advanced"
            aria-expanded={advancedOpen}
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                advancedOpen && 'rotate-180',
              )}
            />
          </Button>
        )}

        {canRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Remove"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {hasAdvanced && (
        <Collapsible open={advancedOpen}>
          <CollapsibleContent className="mt-space-sm border-t border-border-default pt-space-sm">
            {advanced}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
