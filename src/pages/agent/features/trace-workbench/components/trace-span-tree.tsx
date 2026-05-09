import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TraceSpanRow } from './trace-span-row'

interface TraceSpanTreeProps {
  spans: TraceSpanViewModel[]
  selectedSpanId?: string
  onSelect: (spanId: string) => void
}

function TraceSpanBranch({
  span,
  selectedSpanId,
  onSelect,
}: {
  span: TraceSpanViewModel
  selectedSpanId?: string
  onSelect: (spanId: string) => void
}) {
  return (
    <div>
      <TraceSpanRow
        span={span}
        selected={span.id === selectedSpanId}
        onSelect={onSelect}
      />
      {span.children.length ? (
        <div className="ml-space-md border-l border-border-subtle">
          {span.children.map((child) => (
            <TraceSpanBranch
              key={child.id}
              span={child}
              selectedSpanId={selectedSpanId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TraceSpanTree({
  spans,
  selectedSpanId,
  onSelect,
}: TraceSpanTreeProps) {
  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="px-space-base py-space-sm border-b border-border-subtle">
        <h4 className="text-sm font-semibold text-text-primary">Span Tree</h4>
      </div>
      <div className="divide-y divide-border-subtle">
        {spans.map((span) => (
          <TraceSpanBranch
            key={span.id}
            span={span}
            selectedSpanId={selectedSpanId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
