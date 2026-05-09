import { cn } from '@/lib/utils'
import { TraceDebugActions } from './components/trace-debug-actions'
import { TraceEmptyState } from './components/trace-empty-state'
import { TraceHeader } from './components/trace-header'
import { TraceIoPanel } from './components/trace-io-panel'
import { TraceRawPanel } from './components/trace-raw-panel'
import { TraceSpanDetail } from './components/trace-span-detail'
import { TraceSpanTree } from './components/trace-span-tree'
import { TraceSummaryStrip } from './components/trace-summary-strip'
import { useTraceWorkbench } from './hooks/use-trace-workbench'
import type { TraceWorkbenchProps } from './types'

export function TraceWorkbench({
  viewModel,
  isLoading,
  className,
  onRefresh,
}: TraceWorkbenchProps) {
  const state = useTraceWorkbench(viewModel)
  const isEmpty = state.flatSpans.length === 0
  const emptyReason = isLoading ? 'loading' : viewModel.unavailableReason

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-components-split-pane-bg',
        className,
      )}
    >
      <TraceHeader
        viewModel={viewModel}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      <TraceSummaryStrip summary={viewModel.summary} />

      {isEmpty ? (
        <TraceEmptyState reason={emptyReason} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 border-r border-components-split-pane-border bg-components-console-surface">
            <TraceSpanTree
              spans={viewModel.spans}
              selectedSpanId={state.selectedSpanId}
              onSelect={state.selectSpan}
            />
          </aside>

          <main className="min-h-0 overflow-auto">
            <TraceSpanDetail span={state.selectedSpan} />
            <TraceIoPanel span={state.selectedSpan} />
            <TraceRawPanel viewModel={viewModel} span={state.selectedSpan} />
            <TraceDebugActions
              viewModel={viewModel}
              selectedSpanId={state.selectedSpanId}
            />
          </main>
        </div>
      )}
    </div>
  )
}

export type { TraceWorkbenchProps } from './types'
