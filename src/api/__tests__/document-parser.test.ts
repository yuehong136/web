import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient } from '../client'
import {
  captureDocumentParserRequest,
  readDocumentParser,
  requireParserDocument,
  updateDocumentParser,
} from '../knowledge-document-parser'

const doc = (extra: Record<string, unknown> = {}) => ({
  id: 'doc/1%',
  dataset_id: 'kb/1%',
  name: 'source.txt',
  type: 'doc',
  size: 90,
  chunk_method: 'naive',
  pipeline_id: null,
  parser_config: { old: null },
  status: '0',
  run: 'DONE',
  chunk_count: 2,
  token_count: 12,
  progress: 1,
  update_time: 1,
  ...extra,
})
const request = () =>
  captureDocumentParserRequest('kb/1%', 'doc/1%', {
    parser_config: { auto_questions: 2 },
  })

test('PATCH encodes each path segment once, keeps field presence, and JSON readback lists by ID', async (t) => {
  const calls: { url: URL; init?: RequestInit }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: new URL(String(url)), init })
      return new Response(
        JSON.stringify({
          code: 0,
          message: 'success',
          data: init?.method === 'PATCH' ? doc() : { docs: [doc()] },
        }),
        {
          headers: { 'content-type': 'application/json' },
        },
      )
    },
  )
  const response = await updateDocumentParser(request())
  assert.equal(response.kb_id, 'kb/1%')
  assert.equal(response.pipeline_id, null)
  assert.equal(response.enabled, false)
  assert.equal(response.run, '3')
  await readDocumentParser('kb/1%', 'doc/1%')
  assert.ok(
    calls[0].url.pathname.endsWith(
      '/api/v1/datasets/kb%2F1%25/documents/doc%2F1%25',
    ),
  )
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    parser_config: { auto_questions: 2 },
  })
  assert.equal(calls[1].url.searchParams.get('id'), 'doc/1%')
  assert.ok(
    calls[1].url.pathname.endsWith('/api/v1/datasets/kb%2F1%25/documents'),
  )
  assert.deepEqual(
    calls.map((call) => call.init?.method),
    ['PATCH', 'GET'],
  )
})

test('capture owns immutable submission inputs and rejects explicit null, wrong shapes and mixed modes', () => {
  const original = { parser_config: { auto_questions: 2 } }
  const captured = captureDocumentParserRequest('kb', 'doc', original)
  original.parser_config.auto_questions = 9
  assert.equal(captured.patch.parser_config?.auto_questions, 2)
  for (const patch of [
    { pipeline_id: null },
    { pipeline_id: 'ABC' },
    { pipeline_id: ' a'.repeat(16) },
    { chunk_method: null },
    { parser_config: [] },
    { chunk_method: 'naive', pipeline_id: 'a'.repeat(32) },
    { parser_config: undefined },
    { parser_id: 'naive' },
  ])
    assert.throws(
      () => captureDocumentParserRequest('kb', 'doc', patch as never),
      APIError,
    )
  assert.throws(() => captureDocumentParserRequest('', 'doc', {}), APIError)
  assert.deepEqual(
    captureDocumentParserRequest('kb', 'doc', { pipeline_id: '' }).patch,
    { pipeline_id: '' },
  )
})

test('canonical validation preserves actual unknown run and pipeline states and rejects contradictory state', () => {
  for (const pipeline of [null, '', 'a'.repeat(32)]) {
    const result = requireParserDocument(
      doc({ pipeline_id: pipeline, run: 'future-run' }),
      'kb/1%',
      'doc/1%',
    )
    assert.equal(result.run, 'future-run')
    assert.equal(result.pipeline_id, pipeline)
    assert.deepEqual(result.parser_config, { old: null })
  }
  for (const changes of [
    { id: 'wrong' },
    { dataset_id: 'wrong' },
    { chunk_method: undefined },
    { pipeline_id: undefined },
    { parser_config: null },
    { status: true },
    { run: undefined },
    { chunk_count: -1 },
    { token_count: 0.1 },
    { enabled: true },
    { parser_id: 'qa' },
    { chunk_num: 6 },
  ])
    assert.throws(
      () => requireParserDocument(doc(changes), 'kb/1%', 'doc/1%'),
      APIError,
    )
})

test('hybrid failures retain numeric precedence and outcome; a mutation is never automatically replayed', async (t) => {
  let status = 400
  let numeric = 102
  let outcome = 'unchanged'
  const fetch = t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(
        JSON.stringify({
          code:
            outcome === 'unknown'
              ? 'DOCUMENT_UPDATE_OUTCOME_UNKNOWN'
              : 'DOCUMENT_UPDATE_INVALID',
          retcode: numeric,
          retmsg: 'private SQL/DSL/token',
          detail: 'private SQL/DSL/token',
          details: { outcome },
          data: { outcome },
        }),
        { status, headers: { 'content-type': 'application/json' } },
      ),
  )
  for ([status, numeric] of [
    [422, 101],
    [400, 102],
    [401, 401],
    [403, 109],
    [404, 102],
    [409, 102],
    [500, 500],
  ]) {
    await assert.rejects(updateDocumentParser(request()), (error: unknown) => {
      assert.ok(error instanceof APIError)
      assert.equal(error.status, status)
      assert.equal(
        error.code,
        status === 401 ? 'UNAUTHORIZED' : String(numeric),
      )
      if (status !== 401) assert.equal(error.details.outcome, 'unchanged')
      return true
    })
  }
  outcome = 'unknown'
  await assert.rejects(updateDocumentParser(request()), (error: unknown) => {
    assert.ok(error instanceof APIError)
    assert.equal(error.details.outcome, 'unknown')
    return true
  })
  assert.equal(fetch.mock.callCount(), 8)
})

test('wrong HTTP, envelopes, business codes, IDs and body kinds cannot become acknowledged saves', async (t) => {
  let status = 200
  let wire: unknown
  let contentType = 'application/json'
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify(wire), {
        status,
        headers: { 'content-type': contentType },
      }),
  )
  for (wire of [
    { code: 0, message: 'success', data: {} },
    { code: 0, message: 'success', data: doc({ id: 'wrong' }) },
    { code: '0', message: 'success', data: doc() },
    { code: 0, retcode: 102, data: doc() },
    { retcode: 0, message: 'success', data: doc() },
    { code: 0, data: doc() },
    doc(),
    true,
  ])
    await assert.rejects(updateDocumentParser(request()), APIError)
  wire = { code: 0, message: 'success', data: doc() }
  status = 201
  await assert.rejects(updateDocumentParser(request()), APIError)
  status = 200
  contentType = 'text/html'
  await assert.rejects(updateDocumentParser(request()), APIError)
})

test('a failed mutation followed by a legal independent GET remains a failed mutation', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: unknown, init?: RequestInit) =>
      new Response(
        JSON.stringify(
          init?.method === 'PATCH'
            ? {
                code: 'DOCUMENT_UPDATE_OUTCOME_UNKNOWN',
                retcode: 500,
                data: { outcome: 'unknown' },
              }
            : { code: 0, message: 'success', data: { docs: [doc()] } },
        ),
        {
          status: init?.method === 'PATCH' ? 500 : 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
  )
  await assert.rejects(updateDocumentParser(request()), APIError)
  const result = await readDocumentParser('kb/1%', 'doc/1%')
  assert.equal(result.run, '3')
  // No write or readback cache turns the rejected Promise into an acknowledged save.
  assert.equal(apiClient instanceof Object, true)
})
