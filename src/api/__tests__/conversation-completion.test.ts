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
    assert.equal(new URL(String(input)).pathname, '/api/v1/chat/audio/speech')
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
      chat_id: 'chat-1',
      session_id: 'session-1',
      messages: [
        { role: 'user', content: 'Earlier?', id: 'turn-1' },
        { role: 'assistant', content: 'Earlier answer', id: 'turn-1' },
        { role: 'user', content: 'Question?', id: 'turn-2' },
      ],
      quote: true,
    })
    assert.equal(result, response)
    assert.equal(result.bodyUsed, false)
    assert.equal(calls[0].url.pathname, '/api/v1/chat/completions')
    const headers = new Headers(calls[0].init?.headers)
    assert.equal(headers.get('Authorization'), 'Bearer unit-token')
    assert.equal(headers.get('Accept'), 'text/event-stream')
    // The server keeps the stored history; a normal send appends one question.
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      chat_id: 'chat-1',
      session_id: 'session-1',
      messages: [{ role: 'user', content: 'Question?', id: 'turn-2' }],
      quote: true,
      stream: true,
      filter_condition: '',
      audio_output: 'none',
    })
    await conversationAPI.completion({
      chat_id: 'chat-1',
      session_id: 'session-1',
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

test('regenerating replaces the stored history and keeps reply references by turn id', async () => {
  const originalFetch = globalThis.fetch
  let body: unknown
  globalThis.fetch = (async (_input, init) => {
    body = JSON.parse(String(init?.body))
    return new Response('data:{"code":0,"data":true}\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    })
  }) as typeof fetch
  try {
    await conversationAPI.completion({
      chat_id: 'chat-1',
      session_id: 'session-1',
      regenerate: true,
      messages: [
        { role: 'assistant', content: 'Hello', id: 'prologue-local' },
        { role: 'user', content: 'First?', id: 'turn-1' },
        { role: 'assistant', content: 'First answer', id: 'msg-local' },
        { role: 'user', content: 'Again?', id: ' turn-2 ' },
      ],
    })
    assert.deepEqual(body, {
      chat_id: 'chat-1',
      session_id: 'session-1',
      quote: false,
      filter_condition: '',
      audio_output: 'none',
      stream: true,
      pass_all_history_messages: true,
      messages: [
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'First?', id: 'turn-1' },
        { role: 'assistant', content: 'First answer', id: 'turn-1' },
        { role: 'user', content: 'Again?', id: 'turn-2' },
      ],
    })
  } finally {
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
      {
        chat_id: 'chat-1',
        session_id: 'session-1',
        messages: [{ role: 'user', content: 'Question?' }],
      },
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
        {
          chat_id: 'chat-1',
          session_id: 'session-1',
          messages: [{ role: 'user', content: 'Question?' }],
        },
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

test('application sessions use the RESTful routes scoped to their app', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ method?: string; url: URL; body?: unknown }> = []
  const session = {
    id: 'session-1',
    chat_id: 'chat 1',
    name: 'Named',
    update_time: 20,
    messages: [{ role: 'assistant', content: 'Hello' }],
    reference: [],
  }
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input))
    calls.push({
      method: init?.method,
      url,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    const data =
      init?.method === 'GET' && url.pathname.endsWith('/sessions')
        ? [session]
        : init?.method === 'DELETE'
          ? true
          : session
    return Response.json({ code: 0, data })
  }) as typeof fetch
  try {
    assert.deepEqual(await conversationAPI.getConversationsByDialog('chat 1'), [
      {
        id: 'session-1',
        name: 'Named',
        update_time: 20,
        update_date: undefined,
        message_count: 1,
      },
    ])
    assert.equal(
      (await conversationAPI.getConversationDetail('chat 1', 'session-1'))
        .messages[0].content,
      'Hello',
    )
    await conversationAPI.createConversation('chat 1', 'New')
    await conversationAPI.renameConversation('chat 1', 'session-1', 'Renamed')
    await conversationAPI.removeConversations('chat 1', ['session-1'])
    assert.deepEqual(
      calls.map(({ method, url, body }) => [
        method,
        url.pathname + url.search,
        body,
      ]),
      [
        [
          'GET',
          '/api/v1/chats/chat%201/sessions?page=1&page_size=0&orderby=create_time&desc=true',
          undefined,
        ],
        ['GET', '/api/v1/chats/chat%201/sessions/session-1', undefined],
        ['POST', '/api/v1/chats/chat%201/sessions', { name: 'New' }],
        [
          'PATCH',
          '/api/v1/chats/chat%201/sessions/session-1',
          { name: 'Renamed' },
        ],
        ['DELETE', '/api/v1/chats/chat%201/sessions', { ids: ['session-1'] }],
      ],
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
