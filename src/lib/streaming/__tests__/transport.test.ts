import assert from 'node:assert/strict'
import test from 'node:test'
import { assertSSEResponse, readSSEStream } from '../transport'

const encoder = new TextEncoder()

const sseResponse = (chunks: string[]): Response => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

test('readSSEStream delivers parsed frames in order with raw data', async () => {
  const events: Array<{ event: unknown; raw: string }> = []

  await readSSEStream<{ n: number }>(
    sseResponse(['data: {"n":1}\n\n', 'data: {"n":2}\n\ndata: {"n":3}\n\n']),
    {
      onEvent: (event, rawData) => {
        events.push({ event, raw: rawData })
      },
    },
  )

  assert.deepEqual(
    events.map((entry) => entry.event),
    [{ n: 1 }, { n: 2 }, { n: 3 }],
  )
  assert.equal(events[0].raw, '{"n":1}')
})

test('readSSEStream reassembles frames split across chunk boundaries', async () => {
  const events: unknown[] = []

  await readSSEStream(
    sseResponse(['data: {"answ', 'er":"你', '好"}\n', '\n']),
    {
      onEvent: (event) => {
        events.push(event)
      },
    },
  )

  assert.deepEqual(events, [{ answer: '你好' }])
})

test('readSSEStream skips malformed frames by default and reports them', async () => {
  const events: unknown[] = []
  const parseErrors: string[] = []

  await readSSEStream(
    sseResponse([
      'data: {"ok":1}\n\n',
      'data: not-json\n\n',
      'data: {"ok":2}\n\n',
    ]),
    {
      onEvent: (event) => {
        events.push(event)
      },
      onParseError: (rawData) => {
        parseErrors.push(rawData)
      },
    },
  )

  assert.deepEqual(events, [{ ok: 1 }, { ok: 2 }])
  assert.deepEqual(parseErrors, ['not-json'])
})

test('readSSEStream rejects on malformed frames when parseErrorMode is throw', async () => {
  await assert.rejects(
    readSSEStream(sseResponse(['data: not-json\n\n']), {
      parseErrorMode: 'throw',
      onEvent: () => {
        assert.fail('no event expected')
      },
    }),
    SyntaxError,
  )
})

test('readSSEStream skips frames with empty data', async () => {
  const events: unknown[] = []

  await readSSEStream(sseResponse(['data: \n\n', 'data: {"ok":true}\n\n']), {
    onEvent: (event) => {
      events.push(event)
    },
  })

  assert.deepEqual(events, [{ ok: true }])
})

test('readSSEStream stops delivering events after a mid-stream abort', async () => {
  const controller = new AbortController()
  const events: unknown[] = []

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      streamController.enqueue(encoder.encode('data: {"n":1}\n\n'))
      // The second frame only becomes available after abort fires; the
      // pending read() must resolve via reader.cancel() instead of waiting.
      await new Promise((resolve) => setTimeout(resolve, 50))
      try {
        streamController.enqueue(encoder.encode('data: {"n":2}\n\n'))
        streamController.close()
      } catch {
        // stream already cancelled by abort — expected
      }
    },
  })

  await readSSEStream(new Response(stream), {
    signal: controller.signal,
    onEvent: (event) => {
      events.push(event)
      controller.abort()
    },
  })

  assert.deepEqual(events, [{ n: 1 }])
})

test('readSSEStream resolves immediately for an already-aborted signal', async () => {
  const controller = new AbortController()
  controller.abort()

  await readSSEStream(sseResponse(['data: {"n":1}\n\n']), {
    signal: controller.signal,
    onEvent: () => {
      assert.fail('no event expected after abort')
    },
  })
})

test('assertSSEResponse extracts retmsg from JSON error bodies', async () => {
  const response = new Response(JSON.stringify({ retmsg: '会话不存在' }), {
    status: 404,
    statusText: 'Not Found',
  })

  await assert.rejects(assertSSEResponse(response), /会话不存在/)
})

test('assertSSEResponse prefers message over the HTTP fallback', async () => {
  const response = new Response(JSON.stringify({ message: 'quota exceeded' }), {
    status: 429,
    statusText: 'Too Many Requests',
  })

  await assert.rejects(assertSSEResponse(response), /quota exceeded/)
})

test('assertSSEResponse falls back to HTTP status for non-JSON error bodies', async () => {
  const response = new Response('<html>bad gateway</html>', {
    status: 502,
    statusText: 'Bad Gateway',
  })

  await assert.rejects(assertSSEResponse(response), /HTTP 502: Bad Gateway/)
})

test('assertSSEResponse rejects ok responses without a body', async () => {
  const response = new Response(null, { status: 200 })

  await assert.rejects(assertSSEResponse(response))
})

test('assertSSEResponse accepts ok responses with a readable body', async () => {
  await assertSSEResponse(sseResponse(['data: {"ok":true}\n\n']))
})
