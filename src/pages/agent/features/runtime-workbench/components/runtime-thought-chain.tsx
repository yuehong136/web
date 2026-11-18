import { Badge } from '@/components/ui/badge'
import { RuntimeTimeline, type RuntimeTimelineItem } from './runtime-timeline'
import type { INodeEvent } from '../../../hooks/use-node-loading'
import {
  buildRuntimeThoughtChainNodes,
  resolveRuntimeThoughtNodeName,
} from '../thought-chain-utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ACTION_BADGE_MAP,
  RuntimeStatusBadge,
  RuntimeThoughtPayload,
  getActionIcon,
  summarizeValue,
} from './runtime-thought-chain-parts'

const EMPTY_EVENTS: INodeEvent[] = []

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
  events = EMPTY_EVENTS,
  loading = false,
  compact = false,
  surface = 'framed',
}: RuntimeThoughtChainProps) {
  const { t } = useTranslation()
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

  const resetInputs0 = [autoExpandedKeys, nodes]
  const [previousInputs0, setPreviousInputs0] = useState<unknown[] | null>(null)
  if (
    previousInputs0 === null ||
    resetInputs0.some(
      (value, index) => !Object.is(value, previousInputs0[index]),
    )
  ) {
    setPreviousInputs0(resetInputs0)

    setExpandedKeys((previous) => {
      const validKeys = new Set(nodes.map((node) => node.key))
      const retainedKeys = previous.filter((key) => validKeys.has(key))
      return Array.from(new Set([...retainedKeys, ...autoExpandedKeys]))
    })
  }

  if (nodes.length === 0) {
    return null
  }

  const items: RuntimeTimelineItem[] = nodes.map((node) => {
    const elapsed = formatElapsedTime(node.elapsedTime)
    const hasContent = Boolean(
      node.inputs || node.outputs || node.thoughts || node.error,
    )
    const inputSummary = summarizeValue(
      node.inputs,
      t('agent.runtime.noInput'),
      t,
    )
    const outputSummary = summarizeValue(
      node.outputs,
      t('agent.runtime.waitingOutput'),
      t,
    )
    const ActionIcon = getActionIcon(node.actionKind)

    return {
      key: node.key,
      title: (
        <div className="flex min-w-0 items-center gap-space-xs">
          <Badge
            variant={ACTION_BADGE_MAP[node.actionKind]}
            className="shrink-0"
          >
            {t(node.actionLabelKey)}
          </Badge>
          <span className="min-w-0 truncate text-sm font-medium text-fg">
            {resolveRuntimeThoughtNodeName(node, t)}
          </span>
          {elapsed ? (
            <span className="shrink-0 text-xs text-fg-subtle">{elapsed}</span>
          ) : null}
        </div>
      ),
      description: (
        <div className="space-y-space-xs text-xs text-fg-muted">
          <div className="flex min-w-0 flex-wrap items-center gap-space-xs">
            <RuntimeStatusBadge status={node.status} />
            {node.componentType ? <span>{node.componentType}</span> : null}
            {!compact && elapsed ? <span>{elapsed}</span> : null}
          </div>
          <div className="line-clamp-1 break-all">
            {t('agent.runtimePanel.thoughtChain.ioSummary', {
              input: inputSummary,
              output: outputSummary,
            })}
          </div>
        </div>
      ),
      status: node.status,
      blink: node.blink,
      icon: (
        <span className="inline-flex size-6 items-center justify-center rounded-radius-full border border-line-subtle bg-surface text-fg-muted">
          <ActionIcon className="size-3.5" />
        </span>
      ),
      content: hasContent ? (
        <div className="space-y-space-sm">
          <RuntimeThoughtPayload
            label={t('agent.runtimePanel.thoughtChain.thoughts')}
            value={node.thoughts}
          />
          <RuntimeThoughtPayload
            label={t('agent.runtime.input')}
            value={node.inputs}
          />
          <RuntimeThoughtPayload
            label={t('agent.runtime.output')}
            value={node.outputs}
          />
          <RuntimeThoughtPayload
            label={t('agent.runtimePanel.thoughtChain.error')}
            value={node.error}
            tone="error"
          />
        </div>
      ) : undefined,
      footer: compact ? undefined : (
        <div className="flex min-w-0 flex-wrap items-center gap-space-xs text-xs text-fg-subtle">
          <span>{node.eventName}</span>
          <span>
            {t('agent.runtimePanel.thoughtChain.eventCount', {
              count: node.eventCount,
            })}
          </span>
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
            ? 'max-w-full overflow-hidden rounded-radius-md border border-line-subtle bg-surface p-space-sm'
            : 'rounded-radius-md border border-line bg-surface p-space-md'
      }
    >
      <RuntimeTimeline
        items={items}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        line={compact ? 'dashed' : 'solid'}
        compact={compact}
      />
    </div>
  )
}
