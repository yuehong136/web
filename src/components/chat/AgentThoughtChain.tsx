import { useCallback, useEffect, useMemo, useState } from 'react'
import { Think, ThoughtChain } from '@ant-design/x'
import type { ThoughtChainItemType } from '@ant-design/x'
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Circle,
  Loader2,
  Server,
  Wrench,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AgentTimelineNode } from '@/utils/agent-timeline'
import { CodeBlock } from './CodeBlock'

interface AgentThoughtChainProps {
  nodes?: AgentTimelineNode[]
  streaming?: boolean
  className?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const stringifyValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const hasMeaningfulValue = (value: unknown) => {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isRecord(value)) return Object.keys(value).length > 0
  return true
}

const areSameKeys = (left: string[], right: string[]) => {
  return (
    left.length === right.length &&
    left.every((key, index) => key === right[index])
  )
}

const getNodeIcon = (node: AgentTimelineNode) => {
  if (node.status === 'loading') {
    return <Loader2 className="size-icon-sm animate-spin text-status-info" />
  }

  if (node.status === 'error') {
    return <AlertCircle className="size-icon-sm text-status-error" />
  }

  if (node.kind === 'reasoning') {
    return <Brain className="size-icon-sm text-status-info" />
  }

  if (node.kind === 'tool' || node.kind === 'mcp' || node.kind === 'skill') {
    return <Wrench className="size-icon-sm text-status-success" />
  }

  if (node.kind === 'system') {
    return <Server className="size-icon-sm text-text-secondary" />
  }

  if (node.status === 'success') {
    return <CheckCircle2 className="size-icon-sm text-status-success" />
  }

  return <Circle className="size-icon-sm text-text-tertiary" />
}

function JsonPreview({ title, value }: { title: string; value: unknown }) {
  if (!hasMeaningfulValue(value)) return null

  return (
    <div className="space-y-space-xs">
      <div className="text-xs font-medium text-text-secondary">{title}</div>
      <CodeBlock
        code={stringifyValue(value)}
        language="json"
        showHeader={false}
        className="my-0 max-h-72 overflow-auto"
      />
    </div>
  )
}

function AgentToolStepContent({ node }: { node: AgentTimelineNode }) {
  const { t } = useTranslation()
  const payload = isRecord(node.content) ? node.content : {}
  const reasoning =
    typeof payload.reasoning === 'string' ? payload.reasoning : ''
  const args = payload.arguments
  const result = payload.result
  const error = payload.error

  if (
    !reasoning.trim() &&
    !hasMeaningfulValue(args) &&
    !hasMeaningfulValue(result) &&
    !error
  ) {
    return (
      <div className="text-sm text-text-secondary">
        {node.status === 'loading'
          ? t('home.agentTimeline.toolRunning', '工具正在执行...')
          : t('home.agentTimeline.noToolDetail', '暂无工具详情')}
      </div>
    )
  }

  return (
    <div className="space-y-space-sm">
      {reasoning.trim() ? (
        <Think
          title={t('home.agentTimeline.reasoningTitle', '思考过程')}
          loading={node.status === 'loading'}
          blink={node.status === 'loading'}
          defaultExpanded={node.status === 'loading'}
        >
          <div className="whitespace-pre-wrap text-sm text-text-secondary">
            {reasoning}
          </div>
        </Think>
      ) : null}
      <JsonPreview
        title={t('home.agentTimeline.arguments', '参数')}
        value={args}
      />
      {error ? (
        <div className="rounded-radius-sm px-space-sm py-space-xs border border-status-error-subtle bg-status-error-subtle text-sm text-status-error">
          {stringifyValue(error)}
        </div>
      ) : null}
      <JsonPreview
        title={t('home.agentTimeline.result', '结果')}
        value={result}
      />
    </div>
  )
}

function AgentReasoningContent({ node }: { node: AgentTimelineNode }) {
  const { t } = useTranslation()
  const content = typeof node.content === 'string' ? node.content : ''

  // reasoning 节点本身已经作为思维链条目（标题为「思考过程」）展示，
  // 这里直接渲染思考文本，避免再嵌套一层同名的 Think 造成重复。
  if (!content.trim()) {
    return (
      <div className="text-sm text-text-secondary">
        {t('home.agentTimeline.reasoningPending', '正在整理思考过程...')}
      </div>
    )
  }

  return (
    <div className="whitespace-pre-wrap text-sm text-text-secondary">
      {content}
    </div>
  )
}

function AgentGenericStepContent({ node }: { node: AgentTimelineNode }) {
  if (!hasMeaningfulValue(node.content)) return null

  return (
    <div className="whitespace-pre-wrap text-sm text-text-secondary">
      {stringifyValue(node.content)}
    </div>
  )
}

export function AgentThoughtChain({
  nodes = [],
  streaming = false,
  className,
}: AgentThoughtChainProps) {
  const { t } = useTranslation()
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const visibleNodes = useMemo(
    () => nodes.filter((node) => node.kind !== 'answer'),
    [nodes],
  )
  const activeKeys = useMemo(
    () =>
      visibleNodes
        .filter((node) => node.status === 'loading' || node.status === 'error')
        .map((node) => node.id),
    [visibleNodes],
  )

  useEffect(() => {
    setExpandedKeys((previous) => {
      const next = new Set(previous)
      activeKeys.forEach((key) => next.add(key))
      const nextKeys = Array.from(next).filter((key) =>
        visibleNodes.some((node) => node.id === key),
      )
      return areSameKeys(previous, nextKeys) ? previous : nextKeys
    })
  }, [activeKeys, visibleNodes])

  const handleExpand = useCallback((keys: string[]) => {
    setExpandedKeys(keys)
  }, [])

  const items = useMemo<ThoughtChainItemType[]>(() => {
    return visibleNodes.map((node) => {
      const isNodeStreaming = streaming && node.status === 'loading'
      const content =
        node.kind === 'reasoning' ? (
          <AgentReasoningContent node={node} />
        ) : node.kind === 'tool' ||
          node.kind === 'mcp' ||
          node.kind === 'skill' ? (
          <AgentToolStepContent node={node} />
        ) : (
          <AgentGenericStepContent node={node} />
        )

      return {
        key: node.id,
        title: node.title || t('home.agentTimeline.step', '执行步骤'),
        description: node.description,
        status: node.status,
        icon: getNodeIcon(node),
        content,
        collapsible: Boolean(content),
        blink: isNodeStreaming,
      }
    })
  }, [streaming, t, visibleNodes])

  if (items.length === 0) return null

  return (
    <div className={className}>
      <ThoughtChain
        items={items}
        line="dashed"
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
      />
    </div>
  )
}

export type { AgentThoughtChainProps }
