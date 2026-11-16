import { useState, type ReactNode } from 'react'
import { ChevronRight, LoaderCircle, Search, Sparkles } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import '@/components/chat/app-chat-message.css'

interface ProcessDisclosureProps {
  children: ReactNode
  kind: 'thinking' | 'retrieving'
  title: string
  loading: boolean
}

/** One collapsed line; the reader can expand it at any time, also while streaming. */
export function ProcessDisclosure({
  children,
  kind,
  title,
  loading,
}: ProcessDisclosureProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = loading
    ? LoaderCircle
    : kind === 'retrieving'
      ? Search
      : Sparkles
  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      data-process-kind={kind}
      aria-busy={loading}
      className="text-sm text-text-secondary"
    >
      <CollapsibleTrigger className="group inline-flex min-h-[var(--control-height-sm)] max-w-full items-center gap-space-xs rounded-radius-sm text-start hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus">
        <Icon
          aria-hidden="true"
          className={cn(
            'size-icon-sm shrink-0 text-text-tertiary',
            loading && 'animate-spin motion-reduce:animate-none',
          )}
        />
        <span aria-live="polite" className={cn(loading && 'text-shimmer')}>
          {title}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-icon-xs shrink-0 text-text-tertiary transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-space-xs max-h-64 overflow-y-auto overscroll-contain border-s border-border-default ps-space-md text-text-secondary">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
