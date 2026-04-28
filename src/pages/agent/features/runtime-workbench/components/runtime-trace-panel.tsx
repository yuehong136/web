import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { RuntimeMessage } from '../types'
import {
  buildRuntimeThoughtChainNodes,
  type RuntimeThoughtChainNode,
} from '../thought-chain-utils'
import { RuntimeThoughtChain } from './runtime-thought-chain'

interface RuntimeTracePanelProps {
  messages: Array<Pick<RuntimeMessage, 'logEvents'>>
  loading?: boolean
  className?: string
  placement?: 'global' | 'message'
}

const formatStepSummary = (
  messages: Array<Pick<RuntimeMessage, 'logEvents'>>,
  loading?: boolean,
) => {
  const traceMessage = [...messages]
    .reverse()
    .find((message) => message.logEvents?.length)

  if (!traceMessage?.logEvents?.length) {
    return undefined
  }

  const nodes = buildRuntimeThoughtChainNodes(traceMessage.logEvents, loading)
  if (!nodes.length) {
    return undefined
  }

  const failed = nodes.filter((node) => node.status === 'error').length
  const running = nodes.filter((node) => node.status === 'loading').length
  const tools = nodes.filter((node) => node.actionKind === 'tool').length
  const elapsed = nodes.reduce((total, node) => total + (node.elapsedTime || 0), 0)

  return {
    events: traceMessage.logEvents,
    nodes,
    failed,
    running,
    tools,
    elapsed,
  }
}

function RuntimeStepGlyph({ node }: { node: RuntimeThoughtChainNode }) {
  if (node.status === 'loading') {
    return <Loader2 className="size-3 animate-spin text-status-warning" />
  }

  if (node.status === 'error') {
    return <XCircle className="size-3 text-status-error" />
  }

  if (node.status === 'success') {
    return <CheckCircle2 className="size-3 text-status-success" />
  }

  return <Circle className="size-3 text-text-tertiary" />
}

function RuntimeStepPreview({ nodes }: { nodes: RuntimeThoughtChainNode[] }) {
  const visibleNodes = nodes.slice(0, 5)
  const hiddenCount = nodes.length - visibleNodes.length

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-space-xs text-xs">
      {visibleNodes.map((node) => (
        <div
          key={node.key}
          className="inline-flex max-w-48 items-center gap-space-xs rounded-radius-sm bg-surface-primary px-space-xs py-space-xs text-text-secondary"
        >
          <RuntimeStepGlyph node={node} />
          <span className="truncate">{node.componentName}</span>
        </div>
      ))}
      {hiddenCount > 0 ? (
        <span className="text-text-tertiary">+{hiddenCount}</span>
      ) : null}
    </div>
  )
}

export function RuntimeTracePanel({
  messages,
  loading = false,
  className,
  placement = 'global',
}: RuntimeTracePanelProps) {
  const [open, setOpen] = useState(false)
  const summary = useMemo(
    () => formatStepSummary(messages, loading),
    [loading, messages],
  )

  if (!summary) {
    return null
  }

  const statusText = summary.failed
    ? `${summary.failed} 个失败`
    : summary.running
      ? `${summary.running} 个运行中`
      : '已完成'
  const elapsedText =
    summary.elapsed > 0 ? `${Number(summary.elapsed.toFixed(3))}s` : undefined

  const content = (
    <div
      className={cn(
        placement === 'message'
          ? 'border-l border-border-subtle pl-space-sm'
          : 'rounded-radius-md border border-border-subtle bg-surface-secondary px-space-sm py-space-xs',
      )}
    >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto w-full justify-start gap-space-sm px-0 py-space-xs text-text-secondary hover:bg-transparent hover:text-text-primary"
          onClick={() => setOpen((previous) => !previous)}
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0" />
          ) : (
            <ChevronRight className="size-4 shrink-0" />
          )}
          <Activity className="size-4 shrink-0 text-text-accent" />
          <span className="font-mono text-xs text-text-primary">agent.run</span>
          <span className="text-xs text-text-secondary">
            {summary.nodes.length} 步
          </span>
          {summary.tools ? (
            <span className="text-xs text-text-secondary">
              {summary.tools} tools
            </span>
          ) : null}
          {elapsedText ? (
            <span className="text-xs text-text-secondary">{elapsedText}</span>
          ) : null}
          <span className="text-xs text-text-secondary">{statusText}</span>
        </Button>

        {!open ? <RuntimeStepPreview nodes={summary.nodes} /> : null}

        {open ? (
          <div className="max-h-80 overflow-auto border-t border-border-subtle pt-space-sm">
            <RuntimeThoughtChain
              events={summary.events}
              loading={loading}
              surface="bare"
            />
          </div>
        ) : null}
    </div>
  )

  if (placement === 'message') {
    return (
      <div className={cn('mb-space-sm max-w-full', className)}>
        {content}
      </div>
    )
  }

  return (
    <div className={cn('w-full border-b border-border-subtle bg-surface-primary', className)}>
      <div className="mx-auto w-full max-w-4xl px-space-lg py-space-sm">
        {content}
      </div>
    </div>
  )
}
