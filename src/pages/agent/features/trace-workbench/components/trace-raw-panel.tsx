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
  return (
    <div className="gap-space-base p-space-lg grid">
      <TraceJsonViewer title="当前节点" value={span?.raw} height={260} />
      <TraceJsonViewer title="本次运行" value={viewModel.raw} height={320} />
    </div>
  )
}
