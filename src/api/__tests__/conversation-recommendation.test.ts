import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError } from '../client'
import { conversationAPI } from '../conversation'

test('related questions use the local REST recommendation route and payload', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: URL; init?: RequestInit }> = []
  globalThis.fetch = (async (input, init) => {
    calls.push({ url: new URL(String(input)), init })
    return new Response(JSON.stringify({ code: 0, data: ['Next?', 'Why?'] }), {
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
  try {
    assert.deepEqual(
      await conversationAPI.generateRelatedQuestions({
        question: 'Question?',
        search_id: 'search-1',
      }),
      ['Next?', 'Why?'],
    )
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url.pathname, '/api/v1/chat/recommendation')
    assert.equal(calls[0].init?.method, 'POST')
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      question: 'Question?',
      search_id: 'search-1',
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('recommendations reject business failures and invalid HTTP-200 payloads', async () => {
  const originalFetch = globalThis.fetch
  try {
    for (const [body, code] of [
      [{ code: 102, data: null }, '102'],
      [
        { code: 0, data: { questions: ['Next?'] } },
        'INVALID_RECOMMENDATION_RESPONSE',
      ],
      [{ code: 0, data: [42] }, 'INVALID_RECOMMENDATION_RESPONSE'],
      [{ retcode: 0, data: ['Next?'] }, 'INVALID_REST_RESPONSE'],
    ] as const) {
      globalThis.fetch = (async () =>
        new Response(JSON.stringify(body), {
          headers: { 'content-type': 'application/json' },
        })) as typeof fetch
      await assert.rejects(
        () =>
          conversationAPI.generateRelatedQuestions({ question: 'Question?' }),
        (error: unknown) => {
          assert.ok(error instanceof APIError)
          assert.equal(error.code, code)
          return true
        },
      )
    }
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 0, data: [] }), {
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch
    assert.deepEqual(
      await conversationAPI.generateRelatedQuestions({ question: 'Question?' }),
      [],
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
