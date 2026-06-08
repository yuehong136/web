import type {
  AgentStreamEvent,
  AgentTimelineNode,
  AgentTimelineStatus,
} from './agent-timeline'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const compactText = (value: unknown, maxLength = 96): string | undefined => {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

const createTextEvents = (content: unknown): AgentStreamEvent[] => {
  return typeof content === 'string' && content
    ? [{ kind: 'text', content }]
    : []
}

const normalizeStructuredData = (
  data: Record<string, unknown>,
): AgentStreamEvent[] => {
  const type = data.type
  const content = data.content

  switch (type) {
    case 'text':
      return createTextEvents(content)
    case 'tool_start':
      return [{ kind: 'tool_start', content: compactText(content) }]
    case 'tool_call': {
      const payload = isRecord(content) ? content : {}
      return [
        {
          kind: 'tool_call',
          toolName:
            typeof payload.tool_name === 'string'
              ? payload.tool_name
              : '工具调用',
          arguments: isRecord(payload.arguments) ? payload.arguments : {},
          callId:
            typeof payload.call_id === 'string' ? payload.call_id : undefined,
        },
      ]
    }
    case 'tool_result': {
      const payload = isRecord(content) ? content : {}
      return [
        {
          kind: 'tool_result',
          toolName:
            typeof payload.tool_name === 'string'
              ? payload.tool_name
              : '工具调用',
          result: payload.result,
          callId:
            typeof payload.call_id === 'string' ? payload.call_id : undefined,
          success:
            typeof payload.success === 'boolean' ? payload.success : undefined,
          error: typeof payload.error === 'string' ? payload.error : undefined,
        },
      ]
    }
    case 'tool_end': {
      const payload = isRecord(content) ? content : {}
      return [
        {
          kind: 'tool_end',
          totalCalls:
            typeof payload.total_calls === 'number'
              ? payload.total_calls
              : undefined,
          summary:
            typeof payload.summary === 'string' ? payload.summary : undefined,
        },
      ]
    }
    case 'error': {
      const payload = isRecord(content) ? content : {}
      return [
        {
          kind: 'error',
          message:
            typeof payload.error === 'string'
              ? payload.error
              : '流式响应发生错误',
        },
      ]
    }
    case 'complete':
      return [{ kind: 'complete' }]
    default:
      return []
  }
}

export const normalizeAgentSSEPayload = (raw: unknown): AgentStreamEvent[] => {
  if (!isRecord(raw)) return []

  const retcode =
    typeof raw.retcode === 'number'
      ? raw.retcode
      : typeof raw.code === 'number'
        ? raw.code
        : 0

  if (retcode !== 0) {
    return [
      {
        kind: 'error',
        message:
          typeof raw.retmsg === 'string'
            ? raw.retmsg
            : typeof raw.message === 'string'
              ? raw.message
              : '流式响应发生错误',
      },
    ]
  }

  const events: AgentStreamEvent[] = []
  const startsThinking = raw.start_to_think === true
  const endsThinking = raw.end_to_think === true

  if (startsThinking) {
    events.push({ kind: 'think_start' })
  }

  if (endsThinking) {
    events.push({ kind: 'think_end' })
  }

  const data = raw.data
  if (data === true) {
    events.push({ kind: 'complete' })
  } else if (typeof data === 'string') {
    events.push(...createTextEvents(data))
  } else if (isRecord(data) && typeof data.type === 'string') {
    events.push(...normalizeStructuredData(data))
  } else if (isRecord(data) && typeof data.answer === 'string') {
    events.push(...createTextEvents(data.answer))
  }

  return events
}

export const createTimelineNodesFromToolCalls = (
  toolCalls: Array<{
    id?: string
    name?: string
    arguments?: Record<string, unknown>
    result?: unknown
    status?: AgentTimelineStatus | 'pending' | 'running'
  }>,
): AgentTimelineNode[] => {
  return toolCalls.map((call, index) => {
    const status =
      call.status === 'pending' || call.status === 'running'
        ? 'loading'
        : call.status || 'success'
    const id = call.id || `legacy-tool-${index}`
    return {
      id,
      kind: 'tool',
      title: call.name || '工具调用',
      description: compactText(call.result) || '历史工具调用',
      status,
      content: {
        arguments: call.arguments || {},
        result: call.result,
      },
      metadata: {
        toolName: call.name,
        callId: id,
      },
    }
  })
}
