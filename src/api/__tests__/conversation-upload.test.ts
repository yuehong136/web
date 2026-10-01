import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { apiClient, APIClient, APIError } from '../client'
import { conversationAPI } from '../conversation'
import { resolveUploadURL } from '../upload-transport'
import { attachmentMetadata, UploadXHR } from './helpers/upload-xhr'

const originalXHR = globalThis.XMLHttpRequest
const file = new File(['fixture'], 'sample.txt', { type: 'text/plain' })
const latest = () => UploadXHR.instances.at(-1)!
beforeEach(() => {
  UploadXHR.instances = []
  globalThis.XMLHttpRequest = UploadXHR as unknown as typeof XMLHttpRequest
  apiClient.setAuthToken(null)
})
afterEach(() => {
  globalThis.XMLHttpRequest = originalXHR
  apiClient.setAuthToken(null)
})

test('joins root, trailing slash, deployment and REST bases without duplicated prefixes', () => {
  for (const base of [
    'https://host',
    'https://host/',
    'https://host/api/',
    'https://host/api/v1/',
  ]) {
    assert.equal(
      resolveUploadURL(base, '/api/v1/documents/upload'),
      'https://host/api/v1/documents/upload',
    )
  }
  assert.equal(
    resolveUploadURL(
      'https://host/deployment/api/',
      '/api/v1/documents/upload',
    ),
    'https://host/deployment/api/v1/documents/upload',
  )
  assert.equal(
    resolveUploadURL('/deployment/', '/api/v1/documents/upload'),
    '/deployment/api/v1/documents/upload',
  )
})

test('metadata upload keeps file/JWT/progress and returns the exact object', async () => {
  apiClient.setAuthToken('Bearer test-token')
  const progress: number[] = []
  const result = conversationAPI.uploadInfo(file, (value) =>
    progress.push(value),
  )
  const xhr = latest()
  assert.equal(xhr.method, 'POST')
  assert.equal(xhr.url, 'http://localhost:8000/api/v1/documents/upload')
  assert.equal(xhr.headers.Authorization, 'Bearer test-token')
  assert.deepEqual([...xhr.body!.keys()], ['file'])
  assert.equal((xhr.body!.get('file') as File).name, 'sample.txt')
  assert.equal(xhr.timeout, 30000)
  xhr.progress(1, 4)
  xhr.progress(8, 4)
  assert.deepEqual(progress, [25, 100])
  xhr.respond({ code: 0, message: 'success', data: attachmentMetadata() })
  assert.deepEqual(await result, attachmentMetadata())
  assert.equal(xhr.onload, null)
  assert.equal(xhr.upload.onprogress, null)
})

test('supports legacy envelopes but REST business errors cannot be masked by retcode', async () => {
  const legacy = conversationAPI.uploadInfo(file)
  latest().respond({ retcode: 0, data: attachmentMetadata() })
  assert.equal((await legacy).id, 'attachment-1')
  const failed = conversationAPI.uploadInfo(file)
  latest().respond({
    code: 102,
    retcode: 0,
    message: 'invalid input',
    data: null,
  })
  await assert.rejects(
    failed,
    (error: unknown) =>
      error instanceof APIError && error.status === 200 && error.code === '102',
  )
})

test('rejects malformed JSON, missing envelopes and malformed single-file metadata', async () => {
  const invalidJSON = conversationAPI.uploadInfo(file)
  latest().responseText = 'not json'
  latest().onload?.()
  await assert.rejects(invalidJSON, { code: 'INVALID_RESPONSE' })
  for (const data of [
    null,
    [],
    [attachmentMetadata()],
    {},
    { ...attachmentMetadata(), id: ' ' },
    { ...attachmentMetadata(), size: '7' },
    { ...attachmentMetadata(), name: '' },
    { ...attachmentMetadata(), created_by: undefined },
  ]) {
    const result = conversationAPI.uploadInfo(file)
    latest().respond({ code: 0, data })
    await assert.rejects(result, { code: 'INVALID_RESPONSE' })
  }
  const missingEnvelope = conversationAPI.uploadInfo(file)
  latest().respond(attachmentMetadata())
  await assert.rejects(missingEnvelope, { code: 'INVALID_RESPONSE' })
})

test('HTTP, network, timeout and auth errors retain typed status/code', async () => {
  const http = conversationAPI.uploadInfo(file)
  latest().respond({ detail: 'forbidden' }, 403)
  await assert.rejects(http, { status: 403, code: 'HTTP_ERROR' })
  const network = conversationAPI.uploadInfo(file)
  latest().onerror?.()
  await assert.rejects(network, { code: 'NETWORK_ERROR' })
  const timeout = conversationAPI.uploadInfo(file)
  latest().ontimeout?.()
  await assert.rejects(timeout, { code: 'TIMEOUT' })
  apiClient.setAuthToken('expired')
  const auth = conversationAPI.uploadInfo(file)
  latest().respond({ detail: 'expired' }, 401)
  await assert.rejects(auth, { status: 401, code: 'UNAUTHORIZED' })
  const afterAuth = conversationAPI.uploadInfo(file)
  assert.equal(latest().headers.Authorization, undefined)
  latest().respond({ code: 0, data: attachmentMetadata() })
  await afterAuth
})

test('pre-abort sends nothing; cancellation rejects once and cleans listeners despite a late completion', async () => {
  const cancelled = new AbortController()
  cancelled.abort()
  await assert.rejects(
    conversationAPI.uploadInfo(file, undefined, cancelled.signal),
    { code: 'CANCELLED' },
  )
  assert.equal(UploadXHR.instances.length, 0)
  const controller = new AbortController()
  let added = 0
  let removed = 0
  const add = controller.signal.addEventListener.bind(controller.signal)
  const remove = controller.signal.removeEventListener.bind(controller.signal)
  controller.signal.addEventListener = (
    ...args: Parameters<AbortSignal['addEventListener']>
  ) => {
    added++
    add(...args)
  }
  controller.signal.removeEventListener = (
    ...args: Parameters<AbortSignal['removeEventListener']>
  ) => {
    removed++
    remove(...args)
  }
  const result = conversationAPI.uploadInfo(file, undefined, controller.signal)
  const xhr = latest()
  const lateLoad = xhr.onload!
  controller.abort()
  xhr.respond({ code: 0, data: attachmentMetadata() })
  lateLoad()
  await assert.rejects(result, { code: 'CANCELLED' })
  assert.equal(xhr.aborted, true)
  assert.equal(added, 1)
  assert.equal(removed, 1)
  assert.equal(xhr.onabort, null)
})

test('success releases AbortSignal listener and uses APIClient timeout configuration', async () => {
  const client = new APIClient('https://host/prefix/')
  client.setDefaultTimeout(7000)
  const controller = new AbortController()
  let removed = 0
  const remove = controller.signal.removeEventListener.bind(controller.signal)
  controller.signal.removeEventListener = (
    ...args: Parameters<AbortSignal['removeEventListener']>
  ) => {
    removed++
    remove(...args)
  }
  const result = client.uploadWithProgress(
    '/api/v1/documents/upload',
    file,
    undefined,
    controller.signal,
  )
  const xhr = latest()
  assert.equal(xhr.timeout, 7000)
  assert.equal(xhr.url, 'https://host/prefix/api/v1/documents/upload')
  xhr.respond({ code: 0, data: attachmentMetadata() })
  await result
  assert.equal(removed, 1)
  controller.abort()
  assert.equal(xhr.aborted, false)
})
