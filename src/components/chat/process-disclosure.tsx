import { useState, type ReactNode } from 'react'
import { Brain, ChevronDown, LoaderCircle, Search } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface ProcessDisclosureProps {
  children: ReactNode
  kind: 'thinking' | 'retrieving'
  title: string
  loading: boolean
}

/** Collapsed by default; user choice remains available throughout streaming. */
export function ProcessDisclosure({
  children,
  kind,
  title,
  loading,
}: ProcessDisclosureProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = loading ? LoaderCircle : kind === 'retrieving' ? Search : Brain
  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      data-process-kind={kind}
      aria-busy={loading}
      className={cn(
        'border-s-2 ps-space-sm',
        kind === 'retrieving'
          ? 'border-status-success text-status-success'
          : 'border-border-default text-text-secondary',
      )}
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-space-xs rounded-radius-sm py-space-xs text-start text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus">
        <Icon
          aria-hidden="true"
          className={cn('size-icon-sm shrink-0', loading && 'animate-spin')}
        />
        <span aria-live="polite">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className="ms-auto size-icon-sm transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="max-h-64 overflow-y-auto overscroll-contain text-sm text-text-secondary">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
