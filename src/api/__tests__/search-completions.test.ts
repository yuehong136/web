import assert from 'node:assert/strict'
import test from 'node:test'
import { searchAPI } from '../search'

test('saved Search summary uses its canonical completions path and caller auth', async () => {
  const originalFetch = globalThis.fetch
  const originalStorage = globalThis.localStorage
  const calls: Array<{ path: string; init: RequestInit }> = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => 'caller-token' },
  })
  globalThis.fetch = (async (url, init) => {
    calls.push({ path: new URL(String(url)).pathname, init: init! })
    return new Response('data:{"code":0,"data":true}\n\n')
  }) as typeof fetch
  const signal = new AbortController().signal
  try {
    await searchAPI.askStream({
      search_id: 'search/one',
      question: 'question',
      kb_ids: ['kb'],
      signal,
    })
    assert.equal(calls[0]?.path, '/api/v1/searches/search%2Fone/completions')
    assert.equal(
      new Headers(calls[0]?.init.headers).get('Authorization'),
      'Bearer caller-token',
    )
    assert.equal(calls[0]?.init.signal, signal)
    assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
      question: 'question',
      kb_ids: ['kb'],
    })
  } finally {
    globalThis.fetch = originalFetch
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalStorage,
    })
  }
})
