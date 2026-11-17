import { useTranslation } from 'react-i18next'
import type {
  TraceRunViewModel,
  TraceSpanViewModel,
} from '@/pages/agent/adapters/trace'
import { TraceJsonViewer } from './trace-json-viewer'

export function TraceRawPanel({
  viewModel,
  span,
}: {
  viewModel: TraceRunViewModel
  span?: TraceSpanViewModel
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-space-base p-space-lg">
      <TraceJsonViewer
        title={t('agent.traceWorkbench.raw.currentSpan')}
        value={span?.raw}
        height={260}
      />
      <TraceJsonViewer
        title={t('agent.traceWorkbench.raw.run')}
        value={viewModel.raw}
        height={320}
      />
    </div>
  )
}
