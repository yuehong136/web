import { Button } from '@/components/ui/button'
import { downloadJsonFile } from '@/lib/download'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { AgentTraceItem } from '@/types/agent'
import { Copy, Download, RefreshCcw, RotateCcw } from 'lucide-react'
import type { LogDetailSource, LogDetailViewModel } from '../types'

interface LogDetailActionsProps {
  source: LogDetailSource
  viewModel: LogDetailViewModel
  onRefetchTrace: () => void
}

function collectTracePaths(items: AgentTraceItem[], prefix = ''): string[] {
  return items.flatMap((item) => {
    const name = item.component_name || item.component_id || 'Unknown'
    const path = prefix ? `${prefix} > ${name}` : name
    return [path, ...collectTracePaths(item.traces || [], path)]
  })
}

async function copyText(text: string, successMessage: string) {
  await copyToClipboard(text)
  toast.success(successMessage)
}

export function LogDetailActions({
  source,
  viewModel,
  onRefetchTrace,
}: LogDetailActionsProps) {
  const rawJson = viewModel.rawSession || viewModel
  const terminalWithEmptyTrace =
    (viewModel.status === 'success' || viewModel.status === 'error') &&
    viewModel.traceItems.length === 0 &&
    viewModel.traceUnavailableReason !== 'no-message-id'

  return (
    <div className="flex flex-wrap items-center gap-space-xs">
      {viewModel.sessionId ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void copyText(viewModel.sessionId || '', '已复制 session id')
          }}
        >
          <Copy className="size-4" />
          复制 Session ID
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          void copyText(JSON.stringify(rawJson, null, 2), '已复制原始 JSON')
        }}
      >
        <Copy className="size-4" />
        复制 Raw JSON
      </Button>
      {viewModel.traceItems.length ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadJsonFile(viewModel.traceItems, 'agent-trace.json')}
          >
            <Download className="size-4" />
            下载 Trace
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void copyText(
                collectTracePaths(viewModel.traceItems).join('\n'),
                '已复制 Trace 路径',
              )
            }}
          >
            <Copy className="size-4" />
            复制 Trace 路径
          </Button>
        </>
      ) : null}
      {terminalWithEmptyTrace ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefetchTrace}
        >
          <RefreshCcw className="size-4" />
          重新拉取 Trace
        </Button>
      ) : null}
      {source.mode === 'live' && viewModel.canRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void source.controller.handleRun(source.controller.beginInputs)
          }}
        >
          <RotateCcw className="size-4" />
          Retry
        </Button>
      ) : null}
      {source.mode === 'session' && source.controller ? (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={source.controller.handleAdoptViewingSession}
        >
          在此会话中继续
        </Button>
      ) : null}
    </div>
  )
}
