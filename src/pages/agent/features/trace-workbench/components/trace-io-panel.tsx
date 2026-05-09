import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TraceJsonViewer } from './trace-json-viewer'

interface TraceIoPanelProps {
  span?: TraceSpanViewModel
  mode?: 'both' | 'input' | 'output'
}

export function TraceIoPanel({ span, mode = 'both' }: TraceIoPanelProps) {
  const showInput = mode === 'both' || mode === 'input'
  const showOutput = mode === 'both' || mode === 'output'

  return (
    <div className="gap-space-base p-space-lg grid items-start 2xl:grid-cols-2">
      {showInput ? (
        <TraceJsonViewer
          title="输入"
          value={span?.input}
          emptyLabel="未记录输入"
          height="min(520px, calc(100vh - 430px))"
          dedupeArrays
          className={mode === 'input' ? '2xl:col-span-2' : undefined}
        />
      ) : null}
      {showOutput ? (
        <TraceJsonViewer
          title="输出"
          value={span?.output}
          emptyLabel="未记录输出"
          height="min(520px, calc(100vh - 430px))"
          dedupeArrays
          className={mode === 'output' ? '2xl:col-span-2' : undefined}
        />
      ) : null}
    </div>
  )
}
