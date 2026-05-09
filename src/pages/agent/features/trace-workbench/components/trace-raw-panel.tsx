import { useState } from 'react'
import { ChevronDown, Code2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type {
  TraceRunViewModel,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'

function formatPayload(value: unknown) {
  if (value === undefined || value === null) {
    return '接口未提供'
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function RawBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-radius-md bg-surface-primary border border-border-subtle">
      <div className="px-space-base py-space-sm border-b border-border-subtle text-sm font-semibold text-text-primary">
        {title}
      </div>
      <pre className="p-space-base max-h-[260px] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-text-secondary">
        {formatPayload(value)}
      </pre>
    </div>
  )
}

export function TraceRawPanel({
  viewModel,
  span,
}: {
  viewModel: TraceRunViewModel
  span?: TraceSpanViewModel
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="px-space-lg py-space-base border-t border-components-split-pane-border">
        <CollapsibleTrigger className="gap-space-base flex w-full items-center justify-between text-left">
          <span className="gap-space-xs flex items-center text-sm font-semibold text-text-primary">
            <Code2 className="size-4 text-text-tertiary" />
            Raw
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-text-tertiary transition-transform',
              open ? 'rotate-180' : undefined,
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-space-base gap-space-base grid">
            <RawBlock title="Selected Span Raw" value={span?.raw} />
            <RawBlock title="Run Raw" value={viewModel.raw} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
