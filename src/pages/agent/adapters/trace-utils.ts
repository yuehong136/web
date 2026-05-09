import type { AgentTraceItem } from '@/types/agent'
import type {
  BuildTraceRunViewModelInput,
  TraceRunStatus,
  TraceRunSummary,
  TraceSpanKind,
  TraceSpanStatus,
  TraceSpanSummary,
  TraceSpanViewModel,
  TraceUnavailableReason,
  TraceRuntimeEvent,
} from './trace-types'

export const SENSITIVE_KEY_PATTERN =
  /token|api[_-]?key|password|secret|authorization|cookie/i

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isTraceSpan(value: unknown): value is TraceSpanViewModel {
  return isRecord(value) && Array.isArray(value.children)
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (
    (!trimmed.startsWith('{') || !trimmed.endsWith('}')) &&
    (!trimmed.startsWith('[') || !trimmed.endsWith(']'))
  ) {
    return value
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

export function toStableId(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function stringifyPrimitive(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }

  return ''
}

export function mapTraceStatus(status: unknown): TraceSpanStatus {
  const value = stringifyPrimitive(status).toLowerCase()

  if (value === 'success' || value === 'done' || value === 'ok') {
    return 'success'
  }

  if (value === 'fail' || value === 'failed' || value === 'error') {
    return 'error'
  }

  if (value === 'running' || value === 'pending' || value === 'loading') {
    return 'running'
  }

  return 'unknown'
}

export function resolveTraceKind(value: unknown): TraceSpanKind {
  const text = stringifyPrimitive(value).toLowerCase()

  if (text.includes('retrieval') || text.includes('retrieve')) {
    return 'retrieval'
  }

  if (
    text.includes('tool') ||
    text.includes('search') ||
    text.includes('crawler') ||
    text.includes('invoke')
  ) {
    return 'tool'
  }

  if (
    text.includes('switch') ||
    text.includes('categorize') ||
    text.includes('iteration') ||
    text.includes('loop')
  ) {
    return 'control'
  }

  if (
    text.includes('parser') ||
    text.includes('splitter') ||
    text.includes('extractor') ||
    text.includes('data') ||
    text.includes('file') ||
    text.includes('sql')
  ) {
    return 'data'
  }

  if (
    text.includes('agent') ||
    text.includes('generate') ||
    text.includes('llm') ||
    text.includes('message')
  ) {
    return 'llm'
  }

  return 'node'
}

export function getTraceRows(item: AgentTraceItem): Record<string, unknown>[] {
  return Array.isArray(item.trace) ? item.trace.filter(isRecord) : []
}

export function getRowError(row: Record<string, unknown>): string | undefined {
  return (
    asString(row.error) ||
    (mapTraceStatus(row.status) === 'error' ? asString(row.message) : undefined)
  )
}

export function getItemError(item: AgentTraceItem): string | undefined {
  if (asString(item.error)) {
    return asString(item.error)
  }

  if (mapTraceStatus(item.status) === 'error' && asString(item.message)) {
    return asString(item.message)
  }

  for (const row of getTraceRows(item)) {
    const error = getRowError(row)
    if (error) {
      return error
    }

    if (
      mapTraceStatus(item.status) === 'error' &&
      typeof row.message === 'string' &&
      row.message.trim()
    ) {
      return row.message
    }
  }

  return undefined
}

export function getRuntimeData(
  event: TraceRuntimeEvent,
): Record<string, unknown> {
  return isRecord(event.data) ? event.data : {}
}

export function collectRuntimeField(
  events: TraceRuntimeEvent[],
  field: 'inputs' | 'outputs',
) {
  const values = events
    .map((event) => getRuntimeData(event)[field])
    .filter((value) => value !== undefined && value !== null)

  if (values.length === 0) {
    return undefined
  }

  return values.length === 1 ? values[0] : values
}

export function collectTraceSpans(
  spans: TraceSpanViewModel[],
): TraceSpanViewModel[] {
  return spans.flatMap((span) => [span, ...collectTraceSpans(span.children)])
}

export function summarizeSpan(span: TraceSpanViewModel): TraceSpanSummary {
  return {
    id: span.id,
    parentId: span.parentId,
    componentId: span.componentId,
    name: span.name,
    kind: span.kind,
    status: span.status,
    duration: span.duration,
  }
}

export function buildTraceRunSummary(
  spans: TraceSpanViewModel[],
): TraceRunSummary {
  const flatSpans = collectTraceSpans(spans)
  const durationSpans = flatSpans.filter(
    (span) => typeof span.duration === 'number',
  )
  const slowestSpan = durationSpans.reduce<TraceSpanViewModel | undefined>(
    (slowest, span) => {
      if (!slowest || (span.duration ?? 0) > (slowest.duration ?? 0)) {
        return span
      }
      return slowest
    },
    undefined,
  )
  const totalDuration = durationSpans.reduce((total, span) => {
    return total + (span.duration ?? 0)
  }, 0)

  return {
    spanCount: flatSpans.length,
    nodeCount: flatSpans.filter((span) => span.kind !== 'tool').length,
    toolCallCount: flatSpans.filter((span) => span.kind === 'tool').length,
    errorCount: flatSpans.filter((span) => span.status === 'error').length,
    runningCount: flatSpans.filter((span) => span.status === 'running').length,
    totalDuration: durationSpans.length ? totalDuration : undefined,
    slowestSpan: slowestSpan ? summarizeSpan(slowestSpan) : undefined,
  }
}

export function resolveRunStatus(
  spans: TraceSpanViewModel[],
  unavailableReason?: TraceUnavailableReason,
): TraceRunStatus {
  if (unavailableReason) {
    return 'missing'
  }

  const flatSpans = collectTraceSpans(spans)
  if (flatSpans.some((span) => span.status === 'error')) {
    return 'error'
  }

  if (flatSpans.some((span) => span.status === 'running')) {
    return 'running'
  }

  if (
    flatSpans.length &&
    flatSpans.every((span) => span.status === 'success')
  ) {
    return 'success'
  }

  return flatSpans.length ? 'partial' : 'missing'
}

export function mergeTraceAndRuntimeSpans(
  traceSpans: TraceSpanViewModel[],
  runtimeSpans: TraceSpanViewModel[],
): TraceSpanViewModel[] {
  if (!traceSpans.length) {
    return runtimeSpans
  }

  const runtimeByComponentId = new Map(
    runtimeSpans
      .filter((span) => span.componentId)
      .map((span) => [span.componentId as string, span]),
  )

  return traceSpans.map((span) => {
    const runtimeSpan = span.componentId
      ? runtimeByComponentId.get(span.componentId)
      : undefined

    if (!runtimeSpan) {
      return span
    }

    return {
      ...span,
      status: span.status === 'unknown' ? runtimeSpan.status : span.status,
      duration: span.duration ?? runtimeSpan.duration,
      input: span.input ?? runtimeSpan.input,
      output: span.output ?? runtimeSpan.output,
      error: span.error ?? runtimeSpan.error,
      children: [...span.children, ...runtimeSpan.children],
      raw: {
        trace: span.raw,
        runtime: runtimeSpan.raw,
      },
    }
  })
}

export function resolveUnavailableReason(
  input: BuildTraceRunViewModelInput,
  spans: TraceSpanViewModel[],
): TraceUnavailableReason | undefined {
  if (input.queryError) {
    return 'query-error'
  }

  if (spans.length > 0) {
    return undefined
  }

  if (input.unavailableReason) {
    return input.unavailableReason
  }

  if (!input.messageId) {
    return 'no-message-id'
  }

  return 'redis-evicted'
}

export function maskSensitivePayload(value: unknown, keyHint = ''): unknown {
  if (SENSITIVE_KEY_PATTERN.test(keyHint)) {
    return '[MASKED]'
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitivePayload(item))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      return [key, maskSensitivePayload(entry, key)]
    }),
  )
}
