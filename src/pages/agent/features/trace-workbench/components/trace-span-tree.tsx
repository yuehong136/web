import { useTranslation } from 'react-i18next'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TraceSpanRow } from './trace-span-row'

interface TraceSpanTreeProps {
  spans: TraceSpanViewModel[]
  selectedSpanId?: string
  totalDuration?: number
  onSelect: (spanId: string) => void
}

function TraceSpanBranch({
  span,
  selectedSpanId,
  totalDuration,
  onSelect,
  depth = 0,
  isLast = false,
}: {
  span: TraceSpanViewModel
  selectedSpanId?: string
  totalDuration?: number
  onSelect: (spanId: string) => void
  depth?: number
  isLast?: boolean
}) {
  return (
    <div>
      <TraceSpanRow
        span={span}
        selected={span.id === selectedSpanId}
        onSelect={onSelect}
        depth={depth}
        isLast={isLast && span.children.length === 0}
        totalDuration={totalDuration}
      />
      {span.children.length ? (
        <div>
          {span.children.map((child, index) => (
            <TraceSpanBranch
              key={child.id}
              span={child}
              selectedSpanId={selectedSpanId}
              totalDuration={totalDuration}
              onSelect={onSelect}
              depth={depth + 1}
              isLast={isLast && index === span.children.length - 1}
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
  totalDuration,
  onSelect,
}: TraceSpanTreeProps) {
  const { t } = useTranslation()

  return (
    <div className="max-h-[calc(100vh-260px)] overflow-auto">
      <div className="border-b border-border-subtle px-space-base py-space-sm">
        <h4 className="text-sm font-semibold text-text-primary">
          {t('agent.traceWorkbench.spanTree.title')}
        </h4>
        <div className="mt-space-xs grid grid-cols-[32px_minmax(0,1fr)] text-[11px] text-text-caption">
          <span />
          <span className="grid grid-cols-[minmax(132px,0.92fr)_minmax(100px,1fr)_72px]">
            <span>{t('agent.trace.node')}</span>
            <span>{t('agent.traceWorkbench.spanTree.waterfall')}</span>
            <span className="text-right">
              {t('agent.traceWorkbench.spanTree.latency')}
            </span>
          </span>
        </div>
      </div>
      <div className="py-space-sm">
        {spans.map((span, index) => (
          <TraceSpanBranch
            key={span.id}
            span={span}
            selectedSpanId={selectedSpanId}
            totalDuration={totalDuration}
            onSelect={onSelect}
            isLast={index === spans.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
