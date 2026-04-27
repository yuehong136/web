import type { AgentTraceItem } from '@/types/agent'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeTracePayload(payload: unknown): AgentTraceItem[] {
  if (Array.isArray(payload)) {
    return payload as AgentTraceItem[]
  }

  if (!isRecord(payload)) {
    return []
  }

  if (Array.isArray(payload.data)) {
    return payload.data as AgentTraceItem[]
  }

  if (Array.isArray(payload.trace)) {
    return payload.trace as AgentTraceItem[]
  }

  if (Array.isArray(payload.traces)) {
    return payload.traces as AgentTraceItem[]
  }

  return []
}

export function adaptAgentTraceItem(
  payload: AgentTraceItem | undefined,
): AgentTraceItem {
  const traces = (payload?.traces ||
    (Array.isArray(payload?.trace) ? payload?.trace : [])) as AgentTraceItem[]

  return {
    ...payload,
    component_id: payload?.component_id || '',
    component_name: payload?.component_name || '',
    status: payload?.status || 'unknown',
    trace: payload?.trace || traces,
    traces: traces.map(adaptAgentTraceItem),
  }
}

export function adaptAgentTraceItems(
  payload: unknown,
): AgentTraceItem[] {
  return normalizeTracePayload(payload).map(adaptAgentTraceItem)
}

export function extractTraceErrorMessage(
  items: AgentTraceItem[] | undefined,
): string | undefined {
  if (!Array.isArray(items)) {
    return undefined
  }

  for (const item of items) {
    const status = String(item?.status || '').toLowerCase()
    const failed =
      status === 'fail' || status === 'failed' || status === 'error'

    if (failed && typeof item?.message === 'string' && item.message.trim()) {
      return item.message
    }

    if (failed) {
      const traceMessages = Array.isArray(item?.trace) ? item.trace : []
      for (const traceItem of traceMessages) {
        if (
          traceItem &&
          typeof traceItem === 'object' &&
          'message' in traceItem &&
          typeof traceItem.message === 'string' &&
          traceItem.message.trim()
        ) {
          return traceItem.message
        }
      }
    }

    const childMessage = extractTraceErrorMessage(item?.traces)
    if (childMessage) {
      return childMessage
    }
  }

  return undefined
}
