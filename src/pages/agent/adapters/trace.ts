import type { AgentTraceItem } from '@/types/agent'

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
  payload: AgentTraceItem[] | undefined,
): AgentTraceItem[] {
  return (payload || []).map(adaptAgentTraceItem)
}
