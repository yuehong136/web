import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TraceDebugActions } from './components/trace-debug-actions'
import { TraceEmptyState } from './components/trace-empty-state'
import { TraceErrorPanel } from './components/trace-error-panel'
import { TraceHeader } from './components/trace-header'
import { TraceInsightPanel } from './components/trace-insight-panel'
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
  const { t } = useTranslation()
  const state = useTraceWorkbench(viewModel)
  const isEmpty = state.flatSpans.length === 0
  const emptyReason = isLoading ? 'loading' : viewModel.unavailableReason

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-canvas', className)}>
      <TraceHeader
        viewModel={viewModel}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      <TraceSummaryStrip summary={viewModel.summary} />

      {isEmpty ? (
        <TraceEmptyState reason={emptyReason} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 items-start xl:grid-cols-[minmax(320px,34fr)_minmax(0,66fr)]">
          <aside className="max-h-[calc(100vh-244px)] self-start overflow-hidden border-r border-line bg-surface">
            <TraceSpanTree
              spans={viewModel.spans}
              selectedSpanId={state.selectedSpanId}
              totalDuration={viewModel.summary.totalDuration}
              onSelect={state.selectSpan}
            />
          </aside>

          <main className="min-h-0 overflow-auto bg-canvas">
            <TraceSpanDetail span={state.selectedSpan} />
            <Tabs defaultValue="payload" className="min-h-0">
              <div className="px-space-lg pt-space-base">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="payload">
                    {t('agent.traceWorkbench.tabs.payload')}
                  </TabsTrigger>
                  <TabsTrigger value="context">
                    {t('agent.traceWorkbench.tabs.context')}
                  </TabsTrigger>
                  <TabsTrigger value="output">
                    {t('agent.traceWorkbench.tabs.output')}
                  </TabsTrigger>
                  <TabsTrigger value="raw">
                    {t('agent.traceWorkbench.tabs.raw')}
                  </TabsTrigger>
                  <TabsTrigger value="errors">
                    {t('agent.traceWorkbench.tabs.errors')}
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="payload" className="mt-0">
                <TraceIoPanel span={state.selectedSpan} mode="input" />
              </TabsContent>
              <TabsContent value="context" className="mt-0">
                <TraceInsightPanel span={state.selectedSpan} />
              </TabsContent>
              <TabsContent value="output" className="mt-0">
                <TraceIoPanel span={state.selectedSpan} mode="output" />
              </TabsContent>
              <TabsContent value="raw" className="mt-0">
                <TraceRawPanel
                  viewModel={viewModel}
                  span={state.selectedSpan}
                />
              </TabsContent>
              <TabsContent value="errors" className="mt-0">
                <TraceErrorPanel
                  viewModel={viewModel}
                  span={state.selectedSpan}
                />
              </TabsContent>
            </Tabs>
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
