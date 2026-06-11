export type AgentTimelineKind =
  | 'reasoning'
  | 'tool'
  | 'mcp'
  | 'skill'
  | 'answer'
  | 'system'
  | 'error'

export type AgentTimelineStatus = 'loading' | 'success' | 'error' | 'abort'

export interface AgentTimelineNode {
  id: string
  kind: AgentTimelineKind
  title: string
  description?: string
  status: AgentTimelineStatus
  content?: unknown
  metadata?: {
    toolName?: string
    callId?: string
    serverName?: string
    elapsedMs?: number
  }
}

export interface AgentTimelineState {
  nodes: AgentTimelineNode[]
  answer: string
  inReasoning: boolean
  activeReasoningId?: string
  isToolAnalyzing: boolean
  sequence: number
  final: boolean
}

export type AgentStreamEvent =
  | { kind: 'text'; content: string }
  | { kind: 'think_start' }
  | { kind: 'think_end' }
  | { kind: 'tool_start'; content?: string }
  | {
      kind: 'tool_call'
      toolName: string
      arguments: Record<string, unknown>
      callId?: string
    }
  | {
      kind: 'tool_result'
      toolName: string
      result: unknown
      callId?: string
      success?: boolean
      error?: string
    }
  | { kind: 'tool_end'; totalCalls?: number; summary?: string }
  | { kind: 'error'; message: string }
  | { kind: 'complete' }

const THINK_OPEN_TAG = '<think>'
const THINK_CLOSE_TAG = '</think>'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const compactText = (value: unknown, maxLength = 96): string | undefined => {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

const mergeText = (previous: string, incoming: string): string => {
  if (!incoming) return previous
  if (previous && incoming.startsWith(previous)) {
    return incoming
  }
  return previous + incoming
}

const nextSequence = (state: AgentTimelineState) => state.sequence + 1

export const createInitialAgentTimelineState = (): AgentTimelineState => ({
  nodes: [],
  answer: '',
  inReasoning: false,
  activeReasoningId: undefined,
  isToolAnalyzing: false,
  sequence: 0,
  final: false,
})

const updateNode = (
  state: AgentTimelineState,
  nodeId: string,
  updater: (node: AgentTimelineNode) => AgentTimelineNode,
): AgentTimelineState => ({
  ...state,
  nodes: state.nodes.map((node) => (node.id === nodeId ? updater(node) : node)),
})

const findToolNodeIndex = (
  nodes: AgentTimelineNode[],
  callId?: string,
  toolName?: string,
) => {
  if (callId) {
    const callIndex = nodes.findIndex(
      (node) => node.kind === 'tool' && node.metadata?.callId === callId,
    )
    if (callIndex >= 0) return callIndex
  }

  if (toolName) {
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index]
      if (
        node.kind === 'tool' &&
        node.metadata?.toolName === toolName &&
        node.status === 'loading'
      ) {
        return index
      }
    }
  }

  return -1
}

const detachTrailingReasoning = (
  state: AgentTimelineState,
): { state: AgentTimelineState; reasoning?: string } => {
  const lastNode = state.nodes[state.nodes.length - 1]
  if (lastNode?.kind !== 'reasoning') {
    return { state }
  }

  const reasoning =
    typeof lastNode.content === 'string' ? lastNode.content.trim() : ''
  if (!reasoning) {
    return { state }
  }

  return {
    state: {
      ...state,
      nodes: state.nodes.slice(0, -1),
    },
    reasoning,
  }
}

const startReasoning = (state: AgentTimelineState): AgentTimelineState => {
  if (state.inReasoning && state.activeReasoningId) return state

  const sequence = nextSequence(state)
  const id = `reasoning-${sequence}`
  return {
    ...state,
    sequence,
    inReasoning: true,
    activeReasoningId: id,
    nodes: [
      ...state.nodes,
      {
        id,
        kind: 'reasoning',
        title: '思考过程',
        description: '模型正在整理上下文',
        status: 'loading',
        content: '',
      },
    ],
  }
}

const endReasoning = (state: AgentTimelineState): AgentTimelineState => {
  if (!state.inReasoning || !state.activeReasoningId) {
    return { ...state, inReasoning: false, activeReasoningId: undefined }
  }

  return updateNode(
    {
      ...state,
      inReasoning: false,
      activeReasoningId: undefined,
    },
    state.activeReasoningId,
    (node) => ({
      ...node,
      status: node.status === 'error' ? 'error' : 'success',
      description: compactText(node.content) || '思考完成',
    }),
  )
}

const appendReasoningText = (
  state: AgentTimelineState,
  content: string,
): AgentTimelineState => {
  const activeState = state.inReasoning ? state : startReasoning(state)
  const nodeId = activeState.activeReasoningId
  if (!nodeId) return activeState

  return updateNode(activeState, nodeId, (node) => ({
    ...node,
    content: mergeText(String(node.content || ''), content),
  }))
}

const appendAnswerText = (
  state: AgentTimelineState,
  content: string,
): AgentTimelineState => ({
  ...state,
  answer: mergeText(state.answer, content).replace(/^\n+/, ''),
})

const applyTextWithThinkTags = (
  state: AgentTimelineState,
  content: string,
): AgentTimelineState => {
  let next = state
  let rest = content

  while (rest) {
    if (!next.inReasoning) {
      const openIndex = rest.indexOf(THINK_OPEN_TAG)
      if (openIndex < 0) {
        next = appendAnswerText(next, rest)
        rest = ''
      } else {
        if (openIndex > 0) {
          next = appendAnswerText(next, rest.slice(0, openIndex))
        }
        next = startReasoning(next)
        rest = rest.slice(openIndex + THINK_OPEN_TAG.length)
      }
      continue
    }

    const closeIndex = rest.indexOf(THINK_CLOSE_TAG)
    const openIndex = rest.indexOf(THINK_OPEN_TAG)
    if (closeIndex < 0 && openIndex < 0) {
      next = appendReasoningText(next, rest)
      rest = ''
    } else if (closeIndex >= 0 && (openIndex < 0 || closeIndex <= openIndex)) {
      if (closeIndex > 0) {
        next = appendReasoningText(next, rest.slice(0, closeIndex))
      }
      next = endReasoning(next)
      rest = rest.slice(closeIndex + THINK_CLOSE_TAG.length)
    } else {
      if (openIndex > 0) {
        next = appendReasoningText(next, rest.slice(0, openIndex))
      }
      next = startReasoning(endReasoning(next))
      rest = rest.slice(openIndex + THINK_OPEN_TAG.length)
    }
  }

  return next
}

const applyToolStart = (
  state: AgentTimelineState,
  content?: string,
): AgentTimelineState => {
  const existing = state.nodes.find((node) => node.id === 'tool-analysis')
  if (existing) {
    return updateNode(
      { ...state, isToolAnalyzing: true },
      'tool-analysis',
      (node) => ({
        ...node,
        status: 'loading',
        description: content || node.description,
      }),
    )
  }

  return {
    ...state,
    isToolAnalyzing: true,
    nodes: [
      ...state.nodes,
      {
        id: 'tool-analysis',
        kind: 'system',
        title: '工具分析',
        description: content || '正在判断是否需要调用工具',
        status: 'loading',
      },
    ],
  }
}

const applyToolCall = (
  state: AgentTimelineState,
  event: Extract<AgentStreamEvent, { kind: 'tool_call' }>,
): AgentTimelineState => {
  const closedState = state.inReasoning ? endReasoning(state) : state
  const { state: baseState, reasoning } = detachTrailingReasoning(closedState)
  const sequence = nextSequence(baseState)
  const callId = event.callId || `tool-${sequence}`
  const node: AgentTimelineNode = {
    id: callId,
    kind: 'tool',
    title: event.toolName || '工具调用',
    description:
      compactText(reasoning) ||
      compactText(JSON.stringify(event.arguments)) ||
      '准备执行',
    status: 'loading',
    content: {
      reasoning,
      arguments: event.arguments,
      result: undefined,
    },
    metadata: {
      toolName: event.toolName,
      callId,
    },
  }

  return {
    ...baseState,
    sequence,
    nodes: [...baseState.nodes, node],
  }
}

const applyToolResult = (
  state: AgentTimelineState,
  event: Extract<AgentStreamEvent, { kind: 'tool_result' }>,
): AgentTimelineState => {
  const status: AgentTimelineStatus =
    event.success === false ? 'error' : 'success'
  const index = findToolNodeIndex(state.nodes, event.callId, event.toolName)

  if (index < 0) {
    const sequence = nextSequence(state)
    const callId = event.callId || `tool-${sequence}`
    return {
      ...state,
      sequence,
      nodes: [
        ...state.nodes,
        {
          id: callId,
          kind: 'tool',
          title: event.toolName || '工具调用',
          description: compactText(event.result) || event.error || '执行完成',
          status,
          content: {
            arguments: {},
            result: event.result,
            error: event.error,
          },
          metadata: {
            toolName: event.toolName,
            callId,
          },
        },
      ],
    }
  }

  return {
    ...state,
    nodes: state.nodes.map((node, nodeIndex) =>
      nodeIndex === index
        ? {
            ...node,
            status,
            description:
              compactText(event.result) || event.error || '工具执行完成',
            content: {
              ...(isRecord(node.content) ? node.content : {}),
              result: event.result,
              error: event.error,
            },
          }
        : node,
    ),
  }
}

const applyToolEnd = (
  state: AgentTimelineState,
  event: Extract<AgentStreamEvent, { kind: 'tool_end' }>,
): AgentTimelineState => {
  const next = { ...state, isToolAnalyzing: false }
  const analysisNode = next.nodes.find((node) => node.id === 'tool-analysis')
  if (!analysisNode) return next

  return updateNode(next, 'tool-analysis', (node) => ({
    ...node,
    status: 'success',
    description:
      event.summary ||
      (typeof event.totalCalls === 'number'
        ? `完成 ${event.totalCalls} 次工具调用`
        : '工具分析完成'),
  }))
}

const applyComplete = (state: AgentTimelineState): AgentTimelineState => {
  const completedState = state.inReasoning ? endReasoning(state) : state
  const answerRecoveredState =
    recoverAnswerFromTrailingReasoning(completedState)
  return {
    ...answerRecoveredState,
    isToolAnalyzing: false,
    final: true,
    nodes: answerRecoveredState.nodes.map((node) =>
      node.kind === 'system' && node.status === 'loading'
        ? { ...node, status: 'success' }
        : node,
    ),
  }
}

const recoverAnswerFromTrailingReasoning = (
  state: AgentTimelineState,
): AgentTimelineState => {
  if (state.answer.trim()) return state

  for (let index = state.nodes.length - 1; index >= 0; index -= 1) {
    const node = state.nodes[index]
    if (node.kind !== 'reasoning' || typeof node.content !== 'string') {
      continue
    }

    const split = node.content.match(/^([\s\S]*?)\n\n+(\S[\s\S]*)$/)
    if (!split) return state

    return {
      ...state,
      answer: split[2].trim(),
      nodes: state.nodes.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              content: split[1].trim(),
              description: compactText(split[1]) || item.description,
            }
          : item,
      ),
    }
  }

  return state
}

export const consumeAgentTimelineEvent = (
  state: AgentTimelineState,
  event: AgentStreamEvent,
): AgentTimelineState => {
  switch (event.kind) {
    case 'text':
      return applyTextWithThinkTags(state, event.content)
    case 'think_start':
      return startReasoning(state)
    case 'think_end':
      return endReasoning(state)
    case 'tool_start':
      return applyToolStart(state, event.content)
    case 'tool_call':
      return applyToolCall(state, event)
    case 'tool_result':
      return applyToolResult(state, event)
    case 'tool_end':
      return applyToolEnd(state, event)
    case 'error': {
      const sequence = nextSequence(state)
      return {
        ...state,
        sequence,
        nodes: [
          ...state.nodes,
          {
            id: `error-${sequence}`,
            kind: 'error',
            title: '运行错误',
            description: event.message,
            status: 'error',
            content: event.message,
          },
        ],
      }
    }
    case 'complete':
      return applyComplete(state)
    default:
      return state
  }
}
