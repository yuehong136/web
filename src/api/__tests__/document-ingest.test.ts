import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient } from '../client'
import { knowledgeAPI } from '../knowledge'
import {
  captureDocumentOperation,
  type DocumentIngestOptions,
} from '../knowledge-document-ingest'
import { getDocumentOperationOutcome } from '@/pages/knowledge/documents/utils/ingest-result'

test('ingest uses actual REST base, deduplicated global body and both history branches', async (t) => {
  const calls: { url: string; body: unknown }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      return new Response(JSON.stringify({ code: 0, data: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )
  for (const clear of [true, false])
    for (const apply of [true, false]) {
      await knowledgeAPI.document.ingest('kb/1', ['a', 'a', 'b'], {
        run: 1,
        delete: clear,
        apply_kb: apply,
      })
      assert.ok(calls.at(-1)!.url.endsWith('/api/v1/documents/ingest'))
      assert.deepEqual(calls.at(-1)!.body, {
        doc_ids: ['a', 'b'],
        run: 1,
        delete: clear,
        apply_kb: apply,
      })
    }
  for (const run of [0, 2] as const)
    await knowledgeAPI.document.ingest('kb', ['a'], {
      run,
      delete: false,
      apply_kb: false,
    })
  assert.equal(calls.length, 6)
})

test('invalid context, IDs and strict options fail before HTTP; capture cannot be mutated by caller', async (t) => {
  const http = t.mock.method(apiClient, 'post', async () => ({
    retcode: 0,
    data: true,
  }))
  const ids = ['a', 'a']
  const options = { deleteChunks: false, applyMetadataSettings: true }
  const captured = captureDocumentOperation('kb', ids, 1, options)
  ids.push('later')
  options.deleteChunks = true
  assert.deepEqual(captured.docIds, ['a'])
  assert.equal(captured.reparseOptions?.deleteChunks, false)
  const valid = { run: 1, delete: false, apply_kb: false } as const
  for (const [kb, selection, config] of [
    ['', ['a'], valid],
    ['kb', [], valid],
    ['kb', [''], valid],
    ['kb', [1], valid],
    ['kb', ['a'], { ...valid, run: true }],
    ['kb', ['a'], { ...valid, run: 1.5 }],
    ['kb', ['a'], { ...valid, delete: 'false' }],
    ['kb', ['a'], { ...valid, apply_kb: undefined }],
    ['kb', ['a'], { ...valid, run: 2, apply_kb: true }],
    ['kb', ['a'], { ...valid, dataset_id: 'kb' }],
  ] as const) {
    await assert.rejects(
      knowledgeAPI.document.ingest(
        kb,
        selection as unknown as string[],
        config as DocumentIngestOptions,
      ),
      APIError,
    )
  }
  assert.equal(http.mock.callCount(), 0)
})

test('only a precise integer-zero envelope with boolean true acknowledges ingest', async (t) => {
  let wire: unknown = { code: 0, data: true }
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify(wire), {
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  for (const invalid of [
    true,
    false,
    null,
    'true',
    {},
    { code: 0 },
    { code: 0, data: false },
    { code: 0, data: 'true' },
    { code: 0, data: {} },
    { code: '0', data: true },
  ]) {
    wire = invalid
    await assert.rejects(
      knowledgeAPI.document.ingest('kb', ['a'], {
        run: 1,
        delete: false,
        apply_kb: false,
      }),
      APIError,
    )
  }
})

test('nonzero business data stays in typed errors without falling back to retired route', async (t) => {
  const results = {
    a: { run: '1' },
    b: { error: 'private reason', queued_task_ids: ['task'] },
  }
  const http = t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify({ code: 500, data: { results } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  await assert.rejects(
    knowledgeAPI.document.ingest('kb', ['a', 'b'], {
      run: 1,
      delete: true,
      apply_kb: true,
    }),
    (error: unknown) => {
      assert.ok(error instanceof APIError)
      assert.equal(error.status, 200)
      assert.equal(error.code, '500')
      assert.deepEqual(error.details, { results })
      return true
    },
  )
  assert.equal(http.mock.callCount(), 1)
})

test('real HTTP status and original REST code must agree for ingest and canonical acknowledgements', async (t) => {
  let status = 200
  let wire: unknown = { code: 0, data: true }
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify(wire), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  const calls = [
    () =>
      knowledgeAPI.document.ingest('kb', ['a'], {
        run: 1,
        delete: false,
        apply_kb: false,
      }),
    () => knowledgeAPI.document.parse('kb', ['a']),
    () => knowledgeAPI.document.stop('kb', ['a']),
  ]
  for (const [index, submit] of calls.entries()) {
    const data = index === 0 ? true : { success_count: 1 }
    for (const candidate of [
      { status: 201, wire: { code: 0, data } },
      { status: 202, wire: { code: 0, data } },
      { status: 200, wire: { retcode: 0, data } },
      { status: 200, wire: { retcode: 0, code: 500, data } },
      { status: 200, wire: { retcode: 500, code: 0, data } },
      { status: 200, wire: { code: '0', data } },
      { status: 200, wire: { code: false, data } },
      { status: 200, wire: { code: 0.5, data } },
      { status: 200, wire: { data } },
      {
        status: 500,
        wire: { code: 102, data: { results: { a: { run: '1' } } } },
      },
    ]) {
      status = candidate.status
      wire = candidate.wire
      await assert.rejects(submit(), APIError)
    }
    status = 200
    wire = { code: 0, data }
    await submit()
  }
})

test('opt-in contract does not alter default legacy precedence or success status handling', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        JSON.stringify({ retcode: 0, code: 500, data: 'legacy-default' }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
  )
  assert.equal(await apiClient.post('/other-consumer'), 'legacy-default')
})

test('partial outcomes bind requested IDs and exact string run; effects and queue IDs never imply success', () => {
  const request = captureDocumentOperation(
    'kb',
    ['a', 'b', 'c', 'd', 'e', 'missing'],
    1,
  )
  for (const code of ['102', '500']) {
    const outcome = getDocumentOperationOutcome(
      request,
      false,
      new APIError(200, code, 'private', {
        results: {
          a: { run: '1' },
          b: { run: 1 },
          c: { run: '2' },
          d: { run: '1', error: 'failure', queued_task_ids: ['t'] },
          e: { uncertain_task_ids: ['t'], effectconfirmed: true },
          extra: { run: '1' },
        },
      }),
    )
    assert.deepEqual(outcome.succeededIds, ['a'])
    assert.deepEqual(outcome.failedIds, ['b', 'c', 'd', 'e', 'missing'])
    assert.equal(outcome.complete, false)
  }
  assert.equal(getDocumentOperationOutcome(request, true).complete, true)
})

test('preflight, unauthorized, transport, missing and malformed results are wholly unconfirmed', () => {
  const request = captureDocumentOperation('kb', ['a'], 2)
  const looksSuccessful = { results: { a: { run: '2' } } }
  for (const failure of [
    new APIError(401, '401', 'private', looksSuccessful),
    new APIError(200, '109', 'private', looksSuccessful),
    new APIError(422, 'HTTP_ERROR', 'private', looksSuccessful),
    new APIError(500, '500', 'private', looksSuccessful),
    new APIError(0, 'NETWORK_ERROR', 'private'),
    new APIError(408, 'TIMEOUT', 'private'),
    new APIError(200, '102', 'private'),
    new APIError(200, '500', 'private', { results: [] }),
    new APIError(200, '500', 'private', { results: { a: true } }),
    new Error('private'),
  ]) {
    assert.deepEqual(
      getDocumentOperationOutcome(request, false, failure).succeededIds,
      [],
    )
  }
})
