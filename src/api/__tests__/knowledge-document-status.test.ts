import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError } from '../client'
import { knowledgeAPI } from '../knowledge'
import { captureDocumentStatusRequest } from '../knowledge-document-status'

test('document status uses the dataset REST route, numeric status and captured unique IDs', async () => {
  const originalFetch = globalThis.fetch
  const calls: { url: string; init?: RequestInit }[] = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return new Response(
      JSON.stringify({ code: 0, data: { a: { status: '0' } } }),
      { headers: { 'content-type': 'application/json' } },
    )
  }
  try {
    const ids = ['a', 'a']
    const captured = captureDocumentStatusRequest('dataset /?', ids, 0)
    ids.push('changed')
    assert.deepEqual(captured.docIds, ['a'])
    assert.deepEqual(
      await knowledgeAPI.document.changeStatus(captured.datasetId, {
        doc_ids: captured.docIds,
        status: 0,
      }),
      { a: { status: '0' } },
    )
    assert.equal(
      new URL(calls[0].url, 'http://localhost').pathname,
      '/api/v1/datasets/dataset%20%2F%3F/documents/batch-update-status',
    )
    assert.equal(calls[0].init?.method, 'POST')
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      doc_ids: ['a'],
      status: 0,
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('invalid dataset, IDs and status reject without sending a request', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls++
    throw new Error('must not request')
  }
  try {
    for (const dataset of ['', ' ', undefined, null]) {
      await assert.rejects(
        knowledgeAPI.document.changeStatus(dataset as string, {
          doc_ids: ['a'],
          status: 1,
        }),
        APIError,
      )
    }
    for (const ids of [[], [''], [' '], [1], 'a']) {
      await assert.rejects(
        knowledgeAPI.document.changeStatus('dataset', {
          doc_ids: ids as string[],
          status: 1,
        }),
        APIError,
      )
    }
    for (const status of [true, 2, '1']) {
      await assert.rejects(
        knowledgeAPI.document.changeStatus('dataset', {
          doc_ids: ['a'],
          status: status as 1,
        }),
        APIError,
      )
    }
    assert.equal(calls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('shared client preserves partial data and rejects 109, 401 and 422', async () => {
  const originalFetch = globalThis.fetch
  const partial = { a: { status: '1' }, b: { error: 'unsafe server detail' } }
  try {
    for (const [status, body, code] of [
      [
        200,
        { code: 500, message: 'unsafe server message', data: partial },
        '500',
      ],
      [200, { code: 109, message: 'dataset denied', data: {} }, '109'],
      [401, { detail: 'invalid credential' }, 'UNAUTHORIZED'],
      [422, { detail: [{ type: 'bad body' }] }, 'HTTP_ERROR'],
    ] as const) {
      globalThis.fetch = async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      await assert.rejects(
        knowledgeAPI.document.changeStatus('dataset', {
          doc_ids: ['a', 'b'],
          status: 1,
        }),
        (error: unknown) => {
          assert.ok(error instanceof APIError)
          assert.equal(error.status, status)
          assert.equal(error.code, code)
          if (code === '500') assert.deepEqual(error.details, partial)
          return true
        },
      )
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})
