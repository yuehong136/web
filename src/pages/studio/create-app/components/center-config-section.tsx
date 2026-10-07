import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { ReactNode } from 'react'

interface CenterConfigSectionProps {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  extra?: ReactNode
  children: ReactNode
}
export function CenterConfigSection({
  title,
  open,
  onOpenChange,
  extra,
  children,
}: CenterConfigSectionProps) {
  const id = useId()
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="border-t border-border-subtle"
    >
      <div className="flex items-center gap-space-sm">
        <CollapsibleTrigger
          id={id}
          className="flex min-w-0 flex-1 items-center justify-between gap-space-sm py-space-base text-left text-sm font-semibold text-text-primary focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:outline-hidden"
        >
          {title}
          <ChevronDown
            aria-hidden
            className={`size-icon-sm shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        {extra}
      </div>
      <CollapsibleContent
        aria-labelledby={id}
        className="space-y-space-lg pb-space-lg"
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
