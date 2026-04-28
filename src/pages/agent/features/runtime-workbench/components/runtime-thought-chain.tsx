import { ThoughtChain } from '@ant-design/x'
import type { ThoughtChainProps } from '@ant-design/x'
import { Badge } from '@/components/ui/badge'
import type { INodeEvent } from '../../../hooks/use-node-loading'
import { buildRuntimeThoughtChainNodes } from '../thought-chain-utils'
import { useEffect, useMemo, useState } from 'react'
import {
  ACTION_BADGE_MAP,
  RuntimeStatusBadge,
  RuntimeThoughtPayload,
  getActionIcon,
  summarizeValue,
} from './runtime-thought-chain-parts'

interface RuntimeThoughtChainProps {
  events?: INodeEvent[]
  loading?: boolean
  compact?: boolean
  surface?: 'framed' | 'bare'
}

const formatElapsedTime = (elapsedTime?: number) => {
  if (elapsedTime === undefined || elapsedTime < 0.000001) {
    return undefined
  }

  return `${Number(elapsedTime.toFixed(3))}s`
}

export function RuntimeThoughtChain({
  events = [],
  loading = false,
  compact = false,
  surface = 'framed',
}: RuntimeThoughtChainProps) {
  const nodes = useMemo(
    () => buildRuntimeThoughtChainNodes(events, loading),
    [events, loading],
  )
  const autoExpandedKeys = useMemo(() => {
    const activeKeys = nodes
      .filter((node) => node.status === 'loading' || node.status === 'error')
      .map((node) => node.key)
    const latestKey = compact ? undefined : nodes[nodes.length - 1]?.key

    return Array.from(
      new Set([...activeKeys, latestKey].filter(Boolean) as string[]),
    )
  }, [compact, nodes])
  const [expandedKeys, setExpandedKeys] = useState<string[]>(autoExpandedKeys)

  useEffect(() => {
    setExpandedKeys((previous) => {
      const validKeys = new Set(nodes.map((node) => node.key))
      const retainedKeys = previous.filter((key) => validKeys.has(key))
      return Array.from(new Set([...retainedKeys, ...autoExpandedKeys]))
    })
  }, [autoExpandedKeys, nodes])

  if (nodes.length === 0) {
    return null
  }

  const items: ThoughtChainProps['items'] = nodes.map((node) => {
    const elapsed = formatElapsedTime(node.elapsedTime)
    const hasContent = Boolean(
      node.inputs ||
        node.outputs ||
        node.thoughts ||
        node.error,
    )
    const inputSummary = summarizeValue(node.inputs, '无输入')
    const outputSummary = summarizeValue(node.outputs, '等待输出')
    const ActionIcon = getActionIcon(node.actionKind)

    return {
      key: node.key,
      title: (
        <div className="flex min-w-0 items-center gap-space-xs">
          <Badge
            variant={ACTION_BADGE_MAP[node.actionKind]}
            className="shrink-0"
          >
            {node.actionLabel}
          </Badge>
          <span className="min-w-0 truncate text-sm font-medium text-text-primary">
            {node.componentName}
          </span>
          {elapsed ? (
            <span className="shrink-0 text-xs text-text-tertiary">
              {elapsed}
            </span>
          ) : null}
        </div>
      ),
      description: (
        <div className="space-y-space-xs text-xs text-text-secondary">
          <div className="flex min-w-0 flex-wrap items-center gap-space-xs">
            <RuntimeStatusBadge status={node.status} />
            {node.componentType ? <span>{node.componentType}</span> : null}
            {!compact && elapsed ? <span>{elapsed}</span> : null}
          </div>
          <div className="line-clamp-1 break-all">
            输入：{inputSummary} · 输出：{outputSummary}
          </div>
        </div>
      ),
      status: node.status,
      blink: node.blink,
      collapsible: hasContent,
      icon: (
        <span className="inline-flex size-6 items-center justify-center rounded-radius-full border border-border-subtle bg-surface-primary text-text-secondary">
          <ActionIcon className="size-3.5" />
        </span>
      ),
      content: hasContent ? (
        <div className="space-y-space-sm">
          <RuntimeThoughtPayload label="思考 / Trace" value={node.thoughts} />
          <RuntimeThoughtPayload label="输入" value={node.inputs} />
          <RuntimeThoughtPayload label="输出" value={node.outputs} />
          <RuntimeThoughtPayload
            label="错误"
            value={node.error}
            tone="error"
          />
        </div>
      ) : undefined,
      footer: compact ? undefined : (
        <div className="flex min-w-0 flex-wrap items-center gap-space-xs text-xs text-text-tertiary">
          <span>{node.eventName}</span>
          <span>{node.eventCount} events</span>
          <span className="max-w-xs truncate">{node.componentId}</span>
        </div>
      ),
    }
  })

  return (
    <div
      className={
        surface === 'bare'
          ? 'max-w-full overflow-hidden'
          : compact
          ? 'max-w-full overflow-hidden rounded-radius-md border border-border-subtle bg-surface-primary p-space-sm'
          : 'rounded-radius-md border border-border-default bg-surface-primary p-space-md'
      }
    >
      <ThoughtChain
        items={items}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        line={compact ? 'dashed' : 'solid'}
        rootClassName="runtime-thought-chain"
        classNames={{
          root: 'text-text-primary',
          item: compact ? 'py-space-xs [&+&]:mt-space-xs' : 'py-space-sm',
          itemHeader: 'min-w-0',
          itemContent: compact
            ? 'max-h-80 max-w-full overflow-auto pt-space-sm'
            : 'max-w-full overflow-auto pt-space-sm',
          itemFooter: 'pt-space-xs',
        }}
      />
    </div>
  )
}
