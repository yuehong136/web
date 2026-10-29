import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient } from '../client'
import { conversationAPI } from '../conversation'
import { readSSEStream } from '@/lib/streaming'

test('read-aloud keeps audio decoding with the caller and supports request cancellation', async () => {
  const originalFetch = globalThis.fetch
  const response = new Response(new Uint8Array([1, 2]), {
    headers: { 'content-type': 'audio/mpeg' },
  })
  let request: RequestInit | undefined
  globalThis.fetch = (async (input, init) => {
    assert.equal(new URL(String(input)).pathname, '/v1/conversation/tts')
    request = init
    return response
  }) as typeof fetch
  try {
    assert.equal(
      await conversationAPI.textToSpeechStream('Read this'),
      response,
    )
    assert.equal(response.bodyUsed, false)
    assert.equal(new Headers(request?.headers).get('Accept'), 'audio/mpeg')
    assert.deepEqual(JSON.parse(String(request?.body)), { text: 'Read this' })
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(
      conversationAPI.textToSpeechStream('Cancelled', {
        signal: controller.signal,
      }),
      { name: 'AbortError' },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('application completions request text-only deltas through authenticated transport', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: URL; init?: RequestInit }> = []
  const response = new Response('data:{"retcode":0,"data":true}\n\n', {
    headers: { 'content-type': 'text/event-stream' },
  })
  apiClient.setAuthToken('unit-token')
  globalThis.fetch = (async (input, init) => {
    calls.push({ url: new URL(String(input)), init })
    return response
  }) as typeof fetch
  try {
    const result = await conversationAPI.completion({
      conversation_id: 'conversation-1',
      messages: [{ role: 'user', content: 'Question?' }],
      quote: true,
    })
    assert.equal(result, response)
    assert.equal(result.bodyUsed, false)
    assert.equal(calls[0].url.pathname, '/v1/conversation/completion')
    const headers = new Headers(calls[0].init?.headers)
    assert.equal(headers.get('Authorization'), 'Bearer unit-token')
    assert.equal(headers.get('Accept'), 'text/event-stream')
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      conversation_id: 'conversation-1',
      messages: [{ role: 'user', content: 'Question?' }],
      quote: true,
      stream: true,
      filter_condition: '',
      stream_output: 'delta',
      audio_output: 'none',
    })
    await conversationAPI.completion({
      conversation_id: 'conversation-1',
      messages: [{ role: 'user', content: 'Read this' }],
      audio_output: 'configured',
    })
    assert.equal(
      JSON.parse(String(calls[1].init?.body)).audio_output,
      'configured',
    )
  } finally {
    apiClient.setAuthToken(null)
    globalThis.fetch = originalFetch
  }
})

test('application completions can be stopped before response headers arrive', async () => {
  const originalFetch = globalThis.fetch
  const controller = new AbortController()
  globalThis.fetch = ((_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () => reject(init.signal?.reason),
        { once: true },
      )
    })) as typeof fetch
  try {
    const pending = conversationAPI.completion(
      { conversation_id: 'conversation-1', messages: [] },
      { signal: controller.signal },
    )
    controller.abort()
    await assert.rejects(pending, { name: 'AbortError' })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test(
  'stopping a handed-off completion cancels the SSE body and preserves received text',
  { timeout: 2000 },
  async () => {
    const originalFetch = globalThis.fetch
    const controller = new AbortController()
    let confirmCancellation!: () => void
    const cancelled = new Promise<void>((resolve) => {
      confirmCancellation = resolve
    })
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(stream) {
          stream.enqueue(
            new TextEncoder().encode(
              'data:{"retcode":0,"data":{"answer":"partial","final":false}}\n\n',
            ),
          )
        },
        cancel() {
          confirmCancellation()
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    )
    globalThis.fetch = (async () => response) as typeof fetch
    const received: unknown[] = []
    try {
      const stream = await conversationAPI.completion(
        { conversation_id: 'conversation-1', messages: [] },
        { signal: controller.signal },
      )
      const end = await readSSEStream(stream, {
        signal: controller.signal,
        onEvent(event) {
          received.push(event)
          controller.abort()
        },
      })
      assert.equal(end.reason, 'aborted')
      // Cancellation propagates asynchronously through the decoding/parser pipes.
      await cancelled
      assert.deepEqual(received, [
        { retcode: 0, data: { answer: 'partial', final: false } },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  },
)
