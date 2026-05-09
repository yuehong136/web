import { Copy } from 'lucide-react'
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
        <div className="font-medium text-text-secondary">脱敏调试包</div>
        <p className="mt-space-2xs truncate">
          仅用于排查，敏感字段会在复制前脱敏。
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="px-space-xs h-7 text-xs text-text-secondary hover:text-text-primary"
        onClick={handleCopy}
      >
        <Copy className="size-3.5" />
        复制调试包
      </Button>
    </div>
  )
}
