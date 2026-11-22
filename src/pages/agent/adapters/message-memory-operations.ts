/** Trace metadata is untrusted, historical data; live authorization belongs to the operation API. */
export interface MessageMemoryOperation {
  memoryId: string
  operationId: string
  sourceId?: string
  state: 'rawReady' | 'pending' | 'unknown' | 'failed'
}

export interface MessageMemoryOutput {
  operations: MessageMemoryOperation[]
  hasError: boolean
  invalidMetadata: boolean
}

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const identity = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 128 &&
  /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(value) &&
  value !== '.' &&
  value !== '..'
const sourceIdentity = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 19 &&
  /^[1-9][0-9]*$/.test(value) &&
  BigInt(value) <= 9223372036854775807n

function operation(value: unknown): MessageMemoryOperation | undefined {
  if (
    !record(value) ||
    !identity(value.memory_id) ||
    !identity(value.operation_id)
  )
    return
  const error = value.error_code != null && value.error_code !== ''
  if (
    (value.kind !== 'append_raw' &&
      !(
        value.kind === undefined &&
        value.requires_reconciliation === true &&
        error
      )) ||
    (error && !identity(value.error_code)) ||
    ['status', 'index_sync_status'].some(
      (field) => value[field] !== undefined && !identity(value[field]),
    ) ||
    (value.queue_state != null &&
      !['not_required', 'submitted', 'pending', 'unknown'].some(
        (state) => state === value.queue_state,
      )) ||
    [
      'writer_busy',
      'needs_operator_reconciliation',
      'requires_reconciliation',
      'can_reconcile',
      'retryable',
    ].some(
      (field) =>
        value[field] !== undefined && typeof value[field] !== 'boolean',
    ) ||
    (value.raw_source_id != null && !sourceIdentity(value.raw_source_id))
  )
    return
  const unknown =
    error ||
    value.requires_reconciliation === true ||
    value.needs_operator_reconciliation === true ||
    value.status === 'persistence_unknown' ||
    value.index_sync_status === 'unknown' ||
    value.queue_state === 'unknown'
  const ready =
    !unknown &&
    value.kind === 'append_raw' &&
    value.status === 'ready' &&
    value.index_sync_status === 'ready' &&
    (value.queue_state === 'not_required' ||
      value.queue_state === 'submitted') &&
    value.writer_busy !== true
  return {
    memoryId: value.memory_id,
    operationId: value.operation_id,
    ...(sourceIdentity(value.raw_source_id)
      ? { sourceId: value.raw_source_id }
      : {}),
    state: unknown
      ? 'unknown'
      : ['failed', 'rejected', 'canceled'].some(
            (status) => status === value.status,
          )
        ? 'failed'
        : ready
          ? 'rawReady'
          : 'pending',
  }
}

/** Only explicit Message node output is eligible; never search nested text or infer node type from a title. */
export function parseMessageMemoryOutput(
  output: unknown,
  componentType: unknown,
): MessageMemoryOutput | null {
  if (componentType !== 'Message' || !record(output)) return null
  if (!Object.hasOwn(output, 'memory_operations') && !output.memory_error)
    return null
  const hasError =
    typeof output.memory_error === 'string' && !!output.memory_error
  const rows = output.memory_operations
  if (rows !== undefined && (!Array.isArray(rows) || rows.length > 32))
    return { operations: [], hasError, invalidMetadata: true }
  const operations: MessageMemoryOperation[] = []
  const seen = new Map<string, MessageMemoryOperation>()
  let invalidMetadata =
    output.memory_error != null && typeof output.memory_error !== 'string'
  for (const row of (rows ?? []) as unknown[]) {
    const parsed = operation(row)
    if (!parsed) {
      invalidMetadata = true
      continue
    }
    const key = `${parsed.memoryId}/${parsed.operationId}`
    const previous = seen.get(key)
    if (previous) {
      // Conflicting or duplicate snapshots never upgrade an operation to ready.
      previous.state = 'unknown'
      invalidMetadata = true
    } else {
      seen.set(key, parsed)
      operations.push(parsed)
    }
  }
  return { operations, hasError, invalidMetadata }
}

export function messageMemoryOperationHref(
  operation: MessageMemoryOperation,
): string {
  return `/memory/${encodeURIComponent(operation.memoryId)}/operations?${new URLSearchParams({ operation: operation.operationId })}`
}
