import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const handleCopy = async () => {
    const bundle = createTraceWorkbenchDebugBundle(viewModel, selectedSpanId)

    try {
      await copyToClipboard(JSON.stringify(bundle, null, 2))
      toast.success(t('agent.traceWorkbench.debug.copied'))
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  return (
    <div className="flex items-center justify-between gap-space-base border-t border-line px-space-lg py-space-base">
      <div className="min-w-0 text-xs text-fg-subtle">
        <div className="font-medium text-fg-muted">
          {t('agent.traceWorkbench.debug.title')}
        </div>
        <p className="mt-space-2xs truncate">
          {t('agent.traceWorkbench.debug.hint')}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-space-xs text-xs text-fg-muted hover:text-fg"
        onClick={handleCopy}
      >
        <Copy className="size-3.5" />
        {t('agent.traceWorkbench.debug.copy')}
      </Button>
    </div>
  )
}
