import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, type RequestConfig } from '../client'
import { searchAPI } from '../search'

test('mindmap passes cancellation through the shared client without serializing it', async () => {
  const original = apiClient.post
  const controller = new AbortController()
  let call:
    | { endpoint: string; data: unknown; config?: RequestConfig }
    | undefined
  apiClient.post = (async (endpoint, data, config) => {
    call = { endpoint, data, config }
    return { label: 'Evidence' }
  }) as typeof apiClient.post
  try {
    await searchAPI.mindmap({
      question: 'Question',
      kb_ids: ['kb'],
      doc_ids: ['doc'],
      signal: controller.signal,
    })
    assert.equal(call?.endpoint, '/v1/conversation/mindmap')
    assert.equal(call?.config?.signal, controller.signal)
    assert.deepEqual(call?.data, {
      question: 'Question',
      kb_ids: ['kb'],
      search_id: undefined,
      doc_ids: ['doc'],
    })
  } finally {
    apiClient.post = original
  }
})

test('shared mindmap keeps entry credentials separate from the product session', async () => {
  const originalPost = apiClient.post
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let config: RequestConfig | undefined
  apiClient.post = (async (_endpoint, _data, options) => {
    config = options
    return { label: 'Evidence' }
  }) as typeof apiClient.post
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { search: '?auth=fixture-share-only' } },
  })
  try {
    await searchAPI.mindmapShare({ question: 'Question', kb_ids: ['kb'] })
    assert.equal(config?.skipAuth, true)
    assert.deepEqual(config?.headers, {
      Authorization: 'Bearer fixture-share-only',
    })
  } finally {
    apiClient.post = originalPost
    if (originalWindow)
      Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
