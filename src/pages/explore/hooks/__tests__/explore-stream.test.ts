import assert from 'node:assert/strict'
import test from 'node:test'
import {
  consumeExploreResponse,
  consumeExploreStreamEvent,
  createExploreStreamState,
  type ExploreStreamState,
} from '@/pages/explore/hooks/explore-stream'

const encode = (event: unknown) => `data: ${JSON.stringify(event)}\n\n`
const response = (events: unknown[]) =>
  new Response(events.map(encode).join(''), {
    headers: { 'content-type': 'text/event-stream' },
  })
const run = async (events: unknown[]) => {
  const states: ExploreStreamState[] = []
  const state = await consumeExploreResponse(
    response(events),
    new AbortController().signal,
    (next) => states.push(next),
  )
  return { state, states }
}

test('Explore confirms completion only from a terminal frame, preserving body and references', async () => {
  const { state } = await run([
    {
      data: {
        answer: 'Partial answer',
        reference: { chunks: [{ id: 'chunk-1', content: 'Evidence' }] },
      },
    },
    { data: { answer: 'Final answer [ID:0]', final: true } },
    { data: true },
    { data: { answer: 'late answer' } },
    { retcode: 500, retmsg: 'private backend error', data: '' },
  ])
  assert.equal(state.phase, 'completed')
  assert.equal(state.answer.content, 'Final answer [ID:0]')
  assert.equal(state.references.length, 1)
})

test('a final body without a terminal frame and an empty EOF both remain interrupted', async () => {
  const final = await run([{ data: { answer: 'Partial', final: true } }])
  assert.equal(final.state.phase, 'interrupted')
  assert.equal(final.state.answer.content, 'Partial')
  assert.equal((await run([])).state.phase, 'interrupted')
})

test('failure keeps partial body, hides backend details and wins over a later completion', async () => {
  const { state } = await run([
    { data: { answer: 'Received content' } },
    {
      retcode: 500,
      retmsg: 'sensitive provider message',
      data: { answer: '**ERROR**: secret' },
    },
    { data: true },
    { type: 'run.completed' },
  ])
  assert.equal(state.phase, 'failed')
  assert.equal(state.answer.content, 'Received content')
  assert.doesNotMatch(state.answer.content, /secret|sensitive/)
})

test('local stop during a pending read preserves partial content and cancels reception', async () => {
  let cancelled = false
  const owner = new AbortController()
  const stream = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(encode({ data: 'Partial' })),
        )
      },
      cancel() {
        cancelled = true
      },
    }),
  )
  const state = await consumeExploreResponse(stream, owner.signal, (next) => {
    if (next.answer.content) owner.abort()
  })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(state.phase, 'locallyStopped')
  assert.equal(state.answer.content, 'Partial')
  assert.equal(cancelled, true)
})

test('read errors settle as failed while keeping already received content', async () => {
  let source!: ReadableStreamDefaultController<Uint8Array>
  const stream = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        source = controller
      },
    }),
  )
  const pending = consumeExploreResponse(
    stream,
    new AbortController().signal,
    (state) => {
      if (state.answer.content)
        source.error(new Error('sensitive network details'))
    },
  )
  source.enqueue(new TextEncoder().encode(encode({ data: 'Partial' })))
  const state = await pending
  assert.equal(state.phase, 'failed')
  assert.equal(state.answer.content, 'Partial')
})

test('cancellation acknowledgement is pending until the server confirms cancellation', async () => {
  let state = consumeExploreStreamEvent(createExploreStreamState(), {
    type: 'run.cancel_requested',
    run_id: 'run-1',
  })
  assert.equal(state.phase, 'cancelRequested')
  state = consumeExploreStreamEvent(state, {
    type: 'run.cancelled',
    run_id: 'run-1',
  })
  assert.equal(state.phase, 'serverCancelled')
  assert.equal(consumeExploreStreamEvent(state, { data: true }), state)
  assert.equal(
    (await run([{ type: 'run.cancel_requested' }])).state.phase,
    'interrupted',
  )
})

test('explicit server outcomes settle the message and ignore conflicting late terminal events', async () => {
  for (const [type, phase] of [
    ['run.completed', 'completed'],
    ['run.failed', 'failed'],
    ['run.interrupted', 'interrupted'],
    ['run.cancelled', 'serverCancelled'],
  ] as const) {
    const { state } = await run([
      { data: 'Partial' },
      { data: { type } },
      { data: true },
    ])
    assert.equal(state.phase, phase)
    assert.equal(state.answer.content, 'Partial')
  }
})

test('a lifecycle event from another bound run cannot settle this message', () => {
  const initial = consumeExploreStreamEvent(createExploreStreamState(), {
    type: 'run.cancel_requested',
    run_id: 'current',
  })
  assert.equal(
    consumeExploreStreamEvent(initial, {
      type: 'run.completed',
      run_id: 'old',
    }),
    initial,
  )
  assert.equal(
    consumeExploreStreamEvent(initial, {
      type: 'run.cancelled',
      run_id: 'current',
    }).phase,
    'serverCancelled',
  )
})

test('root lifecycle event types with a payload object remain authoritative', () => {
  const state = consumeExploreStreamEvent(createExploreStreamState(), {
    type: 'run.cancelled',
    run_id: 'current',
    data: { reason: 'cancelled' },
  })
  assert.equal(state.phase, 'serverCancelled')
  assert.equal(state.runId, 'current')
})

test('HTTP refusal cannot become an empty successful answer', async () => {
  const state = await consumeExploreResponse(
    new Response(
      JSON.stringify({
        code: 403,
        message: 'private backend details',
      }),
      {
        status: 403,
        headers: { 'content-type': 'application/json' },
      },
    ),
    new AbortController().signal,
    () => {},
  )
  assert.equal(state.phase, 'failed')
  assert.equal(state.answer.content, '')
})
