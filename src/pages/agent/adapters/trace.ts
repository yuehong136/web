import type { AgentTraceItem } from '@/types/agent'
import type {
  BuildTraceRunViewModelInput,
  TraceIssue,
  TraceRunViewModel,
  TraceRuntimeEvent,
  TraceSpanStatus,
  TraceSpanViewModel,
} from './trace-types'
import {
  asNumber,
  asString,
  buildTraceRunSummary,
  collectRuntimeField,
  collectTraceSpans,
  getItemError,
  getRowError,
  getRuntimeData,
  getTraceRows,
  isRecord,
  isTraceSpan,
  mapTraceStatus,
  maskSensitivePayload,
  mergeTraceAndRuntimeSpans,
  parseMaybeJson,
  resolveRunStatus,
  resolveTraceKind,
  resolveUnavailableReason,
  toStableId,
} from './trace-utils'

export type {
  BuildTraceRunViewModelInput,
  TraceConfidence,
  TraceIssue,
  TraceRunStatus,
  TraceRunSummary,
  TraceRunViewModel,
  TraceRuntimeEvent,
  TraceSpanKind,
  TraceSpanStatus,
  TraceSpanSummary,
  TraceSpanViewModel,
  TraceUnavailableReason,
} from './trace-types'

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

export function adaptAgentTraceItems(payload: unknown): AgentTraceItem[] {
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

export function extractTraceToolCalls(
  items: AgentTraceItem[] | undefined,
  parentSpanId?: string,
): TraceSpanViewModel[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items.flatMap((item, itemIndex) => {
    const parentId =
      parentSpanId ||
      (item.component_id
        ? `node:${toStableId(item.component_id)}`
        : `trace-item:${itemIndex}`)

    return getTraceRows(item)
      .filter((row) => {
        return (
          asString(row.tool_name) ||
          row.arguments !== undefined ||
          row.result !== undefined ||
          asString(row.path)
        )
      })
      .map((row, rowIndex) => {
        const toolName =
          asString(row.tool_name) ||
          asString(row.path) ||
          `tool-${rowIndex + 1}`
        const error = getRowError(row)
        const rowStatus = mapTraceStatus(row.status)
        const status: TraceSpanStatus =
          error || rowStatus === 'error'
            ? 'error'
            : row.result === '...'
              ? 'running'
              : rowStatus === 'unknown'
                ? 'success'
                : rowStatus

        return {
          id: `${parentId}:tool:${rowIndex}:${toStableId(toolName) || rowIndex}`,
          parentId,
          componentId: item.component_id || undefined,
          name: toolName,
          kind: 'tool',
          status,
          duration: asNumber(row.elapsed_time),
          input: parseMaybeJson(row.arguments),
          output: parseMaybeJson(row.result),
          error,
          message: asString(row.message),
          confidence: 'derived',
          children: [],
          raw: row,
        } satisfies TraceSpanViewModel
      })
  })
}

export function buildTraceSpansFromTraceItems(
  items: AgentTraceItem[] | undefined,
  parentId?: string,
): TraceSpanViewModel[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .filter((item) => {
      return Boolean(item.component_id || item.component_name || item.tool_name)
    })
    .map((item, index) => {
      const componentId = item.component_id || `trace-${index}`
      const spanId = parentId
        ? `${parentId}:node:${toStableId(componentId) || index}`
        : `node:${toStableId(componentId) || index}`
      const error = getItemError(item)
      const itemStatus = mapTraceStatus(item.status)
      const status = error || itemStatus === 'error' ? 'error' : itemStatus
      const nestedItems = Array.isArray(item.traces)
        ? item.traces.filter((traceItem) => {
            return (
              Boolean(traceItem.component_id || traceItem.component_name) &&
              !traceItem.tool_name
            )
          })
        : []
      const children = [
        ...extractTraceToolCalls([item], spanId),
        ...buildTraceSpansFromTraceItems(nestedItems, spanId),
      ]

      return {
        id: spanId,
        parentId,
        componentId,
        name: item.component_name || componentId,
        kind: resolveTraceKind(item.component_name || componentId),
        status,
        duration: asNumber(item.elapsed_time),
        input: item.inputs,
        output: item.outputs,
        error,
        message: asString(item.message),
        confidence: 'exact',
        children,
        raw: item,
      } satisfies TraceSpanViewModel
    })
}

export function buildTraceSpansFromRuntimeEvents(
  events: TraceRuntimeEvent[] | undefined,
  options: { source?: 'runtime' | 'webhook' } = {},
): TraceSpanViewModel[] {
  if (!Array.isArray(events)) {
    return []
  }

  const orderedGroups: Array<{
    key: string
    componentId?: string
    events: TraceRuntimeEvent[]
    firstIndex: number
  }> = []

  events.forEach((event, index) => {
    const data = getRuntimeData(event)
    const componentId = asString(data.component_id)
    const key = componentId || `${event.event || 'event'}:${index}`
    const existing = orderedGroups.find((group) => group.key === key)

    if (existing) {
      existing.events.push(event)
      return
    }

    orderedGroups.push({
      key,
      componentId,
      events: [event],
      firstIndex: index,
    })
  })

  return orderedGroups.map((group) => {
    const firstData = getRuntimeData(group.events[0] || {})
    const lastEvent = group.events[group.events.length - 1]
    const lastData = getRuntimeData(lastEvent || {})
    const eventNames = group.events.map((event) => event.event || '')
    const error = group.events
      .map((event) => {
        return asString(getRuntimeData(event).error) || asString(event.message)
      })
      .find(Boolean)
    const hasFinished = eventNames.some((event) => {
      return event === 'node_finished' || event === 'workflow_finished'
    })
    const hasStarted = eventNames.some((event) => event === 'node_started')
    const hasError =
      Boolean(error) || eventNames.some((event) => event === 'error')
    const status: TraceSpanStatus = hasError
      ? 'error'
      : hasFinished
        ? 'success'
        : hasStarted
          ? 'running'
          : 'unknown'
    const componentId = group.componentId
    const componentType =
      asString(lastData.component_type) || asString(firstData.component_type)
    const name =
      asString(lastData.component_name) ||
      asString(firstData.component_name) ||
      componentId ||
      lastEvent?.event ||
      'runtime event'

    return {
      id: `${options.source || 'runtime'}:${
        componentId ? toStableId(componentId) : group.firstIndex
      }`,
      componentId,
      name,
      kind:
        options.source === 'webhook'
          ? 'webhook'
          : resolveTraceKind(componentType || name),
      status,
      duration:
        asNumber(lastData.elapsed_time) || asNumber(firstData.elapsed_time),
      input: collectRuntimeField(group.events, 'inputs'),
      output: collectRuntimeField(group.events, 'outputs'),
      error,
      message: group.events
        .map((event) => {
          return (
            asString(getRuntimeData(event).message) || asString(event.message)
          )
        })
        .find(Boolean),
      confidence: 'derived',
      children: [],
      raw: group.events,
    } satisfies TraceSpanViewModel
  })
}

export function extractTraceIssues(
  source: TraceSpanViewModel[] | AgentTraceItem[] | undefined,
): TraceIssue[] {
  if (!source) {
    return []
  }

  const spans = source.every(isTraceSpan)
    ? source
    : buildTraceSpansFromTraceItems(source)

  return collectTraceSpans(spans)
    .filter((span) => span.status === 'error' || Boolean(span.error))
    .map((span, index) => {
      return {
        id: `issue:${span.id}:${index}`,
        severity: 'error',
        message: span.error || span.message || `${span.name} failed`,
        spanId: span.id,
        componentId: span.componentId,
        source:
          span.kind === 'webhook'
            ? 'webhook-event'
            : span.id.startsWith('runtime:')
              ? 'runtime-event'
              : 'trace-item',
        raw: span.raw,
      } satisfies TraceIssue
    })
}

export function buildTraceRunViewModel(
  input: BuildTraceRunViewModelInput,
): TraceRunViewModel {
  const traceSpans = buildTraceSpansFromTraceItems(input.traceItems)
  const runtimeSpans = buildTraceSpansFromRuntimeEvents(input.runtimeEvents)
  const webhookSpans = buildTraceSpansFromRuntimeEvents(input.webhookEvents, {
    source: 'webhook',
  })
  const spans = [
    ...mergeTraceAndRuntimeSpans(traceSpans, runtimeSpans),
    ...webhookSpans,
  ]
  const unavailableReason = resolveUnavailableReason(input, spans)
  const summary = buildTraceRunSummary(spans)
  const issues = extractTraceIssues(spans)

  if (unavailableReason) {
    issues.push({
      id: `issue:trace-unavailable:${unavailableReason}`,
      severity: unavailableReason === 'query-error' ? 'error' : 'warning',
      message:
        unavailableReason === 'no-message-id'
          ? 'Trace cannot be fetched because the message id is missing.'
          : unavailableReason === 'query-error'
            ? 'Trace query failed.'
            : unavailableReason === 'backend-empty'
              ? 'Backend returned an empty trace payload.'
              : 'Trace is empty or Redis trace may have expired.',
      source: 'run',
      raw: input.queryError,
    })
  }

  return {
    runId:
      input.runId ||
      input.messageId ||
      input.sessionId ||
      input.canvasId ||
      'trace-run',
    canvasId: input.canvasId,
    sessionId: input.sessionId,
    messageId: input.messageId,
    status: resolveRunStatus(spans, unavailableReason),
    unavailableReason,
    summary,
    spans,
    issues,
    raw: input.raw ?? {
      traceItems: input.traceItems,
      runtimeEvents: input.runtimeEvents,
      webhookEvents: input.webhookEvents,
      queryError: input.queryError,
    },
  }
}

export function buildTraceDebugBundle(
  viewModel: TraceRunViewModel,
  options: { selectedSpanId?: string } = {},
): Record<string, unknown> {
  const flatSpans = collectTraceSpans(viewModel.spans)
  const selectedSpan = options.selectedSpanId
    ? flatSpans.find((span) => span.id === options.selectedSpanId)
    : undefined

  return maskSensitivePayload({
    version: 'trace-viewmodel-v1',
    run: {
      runId: viewModel.runId,
      canvasId: viewModel.canvasId,
      sessionId: viewModel.sessionId,
      messageId: viewModel.messageId,
      status: viewModel.status,
      unavailableReason: viewModel.unavailableReason,
    },
    summary: viewModel.summary,
    issues: viewModel.issues,
    selectedSpan,
    spans: viewModel.spans,
    raw: viewModel.raw,
  }) as Record<string, unknown>
}
