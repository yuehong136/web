import { useTranslation } from 'react-i18next'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TraceJsonViewer } from './trace-json-viewer'
import { MessageMemoryOperations } from './message-memory-operations'

interface TraceIoPanelProps {
  span?: TraceSpanViewModel
  mode?: 'both' | 'input' | 'output'
}

export function TraceIoPanel({ span, mode = 'both' }: TraceIoPanelProps) {
  const { t } = useTranslation()
  const showInput = mode === 'both' || mode === 'input'
  const showOutput = mode === 'both' || mode === 'output'

  return (
    <div className="grid items-start gap-space-base p-space-lg 2xl:grid-cols-2">
      {showInput ? (
        <TraceJsonViewer
          title={t('agent.traceWorkbench.io.input')}
          value={span?.input}
          emptyLabel={t('agent.traceWorkbench.io.inputEmpty')}
          height="min(520px, calc(100vh - 430px))"
          dedupeArrays
          className={mode === 'input' ? '2xl:col-span-2' : undefined}
        />
      ) : null}
      {showOutput ? (
        <div
          className={
            mode === 'output'
              ? 'min-w-0 space-y-space-base 2xl:col-span-2'
              : 'min-w-0 space-y-space-base'
          }
        >
          <MessageMemoryOperations
            output={span?.output}
            componentType={span?.componentType}
          />
          <TraceJsonViewer
            title={t('agent.traceWorkbench.io.output')}
            value={span?.output}
            emptyLabel={t('agent.traceWorkbench.io.outputEmpty')}
            height="min(520px, calc(100vh - 430px))"
            dedupeArrays
            className={mode === 'output' ? '2xl:col-span-2' : undefined}
          />
        </div>
      ) : null}
    </div>
  )
}
