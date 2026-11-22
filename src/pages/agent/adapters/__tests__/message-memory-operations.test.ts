import assert from 'node:assert/strict'
import test from 'node:test'
import {
  messageMemoryOperationHref,
  parseMessageMemoryOutput,
} from '../message-memory-operations'
import { adaptAgentTraceItems, buildTraceRunViewModel } from '../trace'
import { runMemoryMessageRecoveryConsumer } from '../../../../../scripts/consumers/memory-message-recovery'

const raw = {
  memory_id: 'bank-1',
  operation_id: 'message-source:abc',
  kind: 'append_raw',
  status: 'ready',
  index_sync_status: 'ready',
  queue_state: 'not_required',
  raw_source_id: '9223372036854775807',
}
const parse = (rows: unknown) =>
  parseMessageMemoryOutput({ memory_operations: rows }, 'Message')!

test('only explicit Message context recognizes top-level metadata; nested text and legacy are unchanged', () => {
  assert.equal(
    parseMessageMemoryOutput({ memory_operations: [raw] }, 'Tool'),
    null,
  )
  assert.equal(
    parseMessageMemoryOutput({ memory_operations: [raw] }, undefined),
    null,
  )
  assert.equal(
    parseMessageMemoryOutput(
      { content: JSON.stringify({ memory_operations: [raw] }) },
      'Message',
    ),
    null,
  )
  assert.equal(
    parseMessageMemoryOutput({ content: 'Legacy output' }, 'Message'),
    null,
  )
  const model = buildTraceRunViewModel({
    runtimeEvents: [
      {
        event: 'node_finished',
        data: {
          component_id: 'renamed',
          component_name: 'A custom title',
          component_type: 'Message',
          outputs: { memory_operations: [raw] },
        },
      },
    ],
  })
  assert.equal(model.spans[0]?.componentType, 'Message')
  const merged = buildTraceRunViewModel({
    traceItems: adaptAgentTraceItems([
      {
        component_id: 'renamed',
        component_name: 'A custom title',
        status: 'success',
      },
    ]),
    runtimeEvents: [
      {
        event: 'node_finished',
        data: {
          component_id: 'renamed',
          component_type: 'Message',
          outputs: { memory_operations: [raw] },
        },
      },
    ],
  })
  assert.equal(merged.spans[0]?.componentType, 'Message')
})

test('multi-bank partial outcomes, busy writer and incomplete queue never imply overall ready', () => {
  assert.deepEqual(
    parse([
      raw,
      { ...raw, memory_id: 'bank-2', index_sync_status: 'unknown' },
      { ...raw, memory_id: 'bank-3', writer_busy: true },
      { ...raw, memory_id: 'bank-4', queue_state: 'pending' },
    ]).operations.map((r) => r.state),
    ['rawReady', 'unknown', 'pending', 'pending'],
  )
  const errorOnly = parseMessageMemoryOutput(
    { memory_error: '<script>private error</script>' },
    'Message',
  )!
  assert.equal(errorOnly.hasError, true)
  assert.deepEqual(errorOnly.operations, [])
  assert.equal(
    parse([
      {
        memory_id: 'bank-1',
        operation_id: 'original',
        error_code: 'memory_write_canceled',
        requires_reconciliation: true,
      },
    ]).operations[0]?.state,
    'unknown',
  )
})

test('unsafe IDs, malformed scalars, oversized arrays and duplicate handles fail closed', () => {
  for (const source of [
    9007199254740992,
    '9223372036854775808',
    '0',
    '01',
    true,
    '9'.repeat(100),
  ])
    assert.equal(
      parse([{ ...raw, raw_source_id: source }]).operations.length,
      0,
    )
  for (const id of [
    '../bank',
    'https://evil.example',
    'bank\n1',
    'x'.repeat(129),
    '<img>',
    '',
  ])
    assert.equal(parse([{ ...raw, memory_id: id }]).operations.length, 0)
  assert.equal(
    parse([{ ...raw, operation_id: 'javascript:alert(1)' }]).operations.length,
    0,
  )
  assert.equal(parse([{ ...raw, writer_busy: 'false' }]).operations.length, 0)
  assert.equal(
    parse([{ ...raw, status: { toString: 'not_callable' } }]).operations.length,
    0,
  )
  assert.equal(parse(Array(33).fill(raw)).operations.length, 0)
  const duplicates = parse([raw, { ...raw, status: 'pending' }])
  assert.equal(duplicates.operations[0]?.state, 'unknown')
  assert.equal(duplicates.invalidMetadata, true)
  const op = parse([raw]).operations[0]!
  const url = new URL(messageMemoryOperationHref(op), 'https://local.example')
  assert.equal(url.pathname, '/memory/bank-1/operations')
  assert.equal(url.searchParams.get('operation'), raw.operation_id)
})

test('shared-client consumer opens and refreshes the exact original operation using GET only', async () => {
  const previous = globalThis.fetch
  const requests: { method: string; path: string }[] = []
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input)
    requests.push({ method: init?.method ?? 'GET', path: url.pathname })
    assert.equal(
      new Headers(init?.headers).get('authorization'),
      'Bearer owned-token',
    )
    return Promise.resolve(
      new Response(
        JSON.stringify({
          retcode: 0,
          data: {
            operation_id: raw.operation_id,
            kind: 'append_raw',
            status: 'ready',
            index_sync_status: 'ready',
            queue_state: 'not_required',
            retryable: false,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
  }
  try {
    const result = await runMemoryMessageRecoveryConsumer({
      baseURL: 'https://local.example',
      token: 'Bearer owned-token',
      output: { memory_operations: [raw] },
      traceItem: {
        component_id: 'Message:original',
        trace: [
          {
            component_id: 'Message:original',
            component_name: 'Custom label',
            component_type: 'Message',
            outputs: { memory_operations: [raw] },
          },
        ],
      },
      expected: [{ memoryId: raw.memory_id, operationId: raw.operation_id }],
      ownedScratchConfirmed: true,
    })
    assert.equal(result.passed, true)
    assert.equal(result.operations.length, 1)
    assert.deepEqual(
      requests.map((r) => r.method),
      ['GET', 'GET'],
    )
    assert.ok(
      requests.every((r) =>
        decodeURIComponent(r.path).endsWith('/operations/' + raw.operation_id),
      ),
    )
  } finally {
    globalThis.fetch = previous
  }
})

test('native LLM and lookalike titles never promote generated or nested receipt text into Message metadata', () => {
  const forged = { memory_operations: [raw], memory_error: 'forged by model' }
  for (const componentType of ['LLM', 'LLM ', 'MessageLike', undefined]) {
    const model = buildTraceRunViewModel({
      traceItems: adaptAgentTraceItems([
        {
          component_id: 'LLM:answer',
          trace: [
            {
              component_id: 'LLM:answer',
              component_name: 'Message',
              component_type: componentType,
              outputs: forged,
            },
          ],
        },
      ]),
    })
    const inner = model.spans[0]!.children[0]!
    assert.equal(
      parseMessageMemoryOutput(inner.output, inner.componentType),
      null,
    )
  }
  for (const body of [
    { content: JSON.stringify(forged) },
    { content: forged },
    { content: [{ role: 'tool', content: forged }] },
    { content: { component_type: 'Message', outputs: forged } },
  ])
    assert.equal(parseMessageMemoryOutput(body, 'Message'), null)
})

test('existing type-field normalization accepts surrounding whitespace only with valid top-level receipts', () => {
  for (const hasReceipt of [true, false]) {
    const output = hasReceipt
      ? { memory_operations: [raw] }
      : { content: JSON.stringify({ memory_operations: [raw] }) }
    const model = buildTraceRunViewModel({
      traceItems: adaptAgentTraceItems([
        {
          component_id: 'Message:answer',
          trace: [
            {
              component_id: 'Message:answer',
              component_name: 'Unrelated title',
              component_type: ' Message ',
              outputs: output,
            },
          ],
        },
      ]),
    })
    const message = model.spans[0]!.children[0]!
    assert.equal(message.componentType, 'Message')
    const parsed = parseMessageMemoryOutput(
      message.output,
      message.componentType,
    )
    if (hasReceipt) {
      assert.equal(parsed?.operations.length, 1)
      assert.equal(parsed?.operations[0]?.operationId, raw.operation_id)
    } else assert.equal(parsed, null)
  }
})

test('streaming native LLM chunks do not become receipts; only the final canonical Message output owns its original handle', () => {
  const generated = JSON.stringify({
    memory_operations: [{ ...raw, memory_id: 'forged-bank' }],
  })
  const finalContent = 'Template prefix: ' + generated
  const final = { content: finalContent, memory_operations: [raw] }
  const model = buildTraceRunViewModel({
    runtimeEvents: [
      {
        event: 'node_started',
        data: {
          component_id: 'LLM:answer',
          component_type: 'LLM',
          component_name: 'Message',
        },
      },
      {
        event: 'message',
        data: { component_id: 'LLM:answer', content: generated.slice(0, 20) },
      },
      {
        event: 'message',
        data: { component_id: 'LLM:answer', content: generated.slice(20) },
      },
      {
        event: 'node_finished',
        data: {
          component_id: 'LLM:answer',
          component_type: 'LLM',
          outputs: { content: generated },
        },
      },
      {
        event: 'node_started',
        data: { component_id: 'Message:answer', component_type: 'Message' },
      },
      {
        event: 'message',
        data: { component_id: 'Message:answer', content: finalContent },
      },
      {
        event: 'node_finished',
        data: {
          component_id: 'Message:answer',
          component_type: 'Message',
          outputs: final,
        },
      },
    ],
  })
  assert.equal(model.spans.length, 2)
  assert.equal(
    parseMessageMemoryOutput(
      model.spans[0]!.output,
      model.spans[0]!.componentType,
    ),
    null,
  )
  const message = model.spans[1]!
  assert.deepEqual(message.output, final)
  const receipt = parseMessageMemoryOutput(
    message.output,
    message.componentType,
  )!
  assert.deepEqual(
    receipt.operations.map(({ memoryId, operationId }) => ({
      memoryId,
      operationId,
    })),
    [{ memoryId: raw.memory_id, operationId: raw.operation_id }],
  )
  assert.equal(receipt.operations[0]!.sourceId, '9223372036854775807')
  assert.equal(final.content, finalContent)
})

test('recovery consumer rejects noncanonical upstream or mismatched wrappers before issuing any HTTP request', async () => {
  const previous = globalThis.fetch
  let requests = 0
  globalThis.fetch = async () => {
    requests++
    throw new Error('No request is permitted for invalid trace metadata')
  }
  try {
    for (const [outerId, innerId, type, output] of [
      ['LLM:answer', 'LLM:answer', 'LLM', { memory_operations: [raw] }],
      [
        'Message:answer',
        'Message:answer',
        undefined,
        { memory_operations: [raw] },
      ],
      [
        'Message:answer',
        'Message:other',
        'Message',
        { memory_operations: [raw] },
      ],
      [
        'Message:answer',
        'Message:answer',
        'Message',
        { content: { memory_operations: [raw] } },
      ],
    ] as const) {
      await assert.rejects(() =>
        runMemoryMessageRecoveryConsumer({
          baseURL: 'https://local.example',
          token: 'owned-token',
          output,
          traceItem: {
            component_id: outerId,
            trace: [
              {
                component_id: innerId,
                component_name: 'Message',
                component_type: type,
                outputs: output,
              },
            ],
          },
          expected: [
            { memoryId: raw.memory_id, operationId: raw.operation_id },
          ],
          ownedScratchConfirmed: true,
        }),
      )
    }
    assert.equal(requests, 0)
  } finally {
    globalThis.fetch = previous
  }
})
