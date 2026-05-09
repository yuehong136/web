import { Copy, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import type { TraceRunViewModel } from '@/pages/agent/adapters/trace'
import { createTraceWorkbenchDebugBundle } from '../hooks/use-trace-workbench'

interface TraceDebugActionsProps {
  viewModel: TraceRunViewModel
  selectedSpanId?: string
}

export function TraceDebugActions({
  viewModel,
  selectedSpanId,
}: TraceDebugActionsProps) {
  const handleCopy = async () => {
    const bundle = createTraceWorkbenchDebugBundle(viewModel, selectedSpanId)

    try {
      await copyToClipboard(JSON.stringify(bundle, null, 2))
      toast.success('Debug bundle 已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <div className="gap-space-base px-space-lg py-space-base flex items-center justify-between border-t border-components-split-pane-border">
      <div className="min-w-0 text-xs text-text-tertiary">
        <div className="gap-space-xs flex items-center font-medium text-text-secondary">
          <ShieldCheck className="size-4" />
          Debug bundle
        </div>
        <p className="mt-space-2xs truncate">
          token、api key、password、secret、authorization、cookie 已脱敏。
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="size-4" />
        复制
      </Button>
    </div>
  )
}
