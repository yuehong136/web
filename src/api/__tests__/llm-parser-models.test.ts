import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError } from '@/api/client'
import { llmAPI } from '@/api/llm'

test('parser candidates read public tenant models and availability through the exact GET routes', async (t) => {
  const calls: { url: URL; init?: RequestInit }[] = []
  const configured = {
    PaddleOCR: {
      tags: 'ocr',
      llm: [
        { id: 17, name: 'PP-OCRv5', type: 'ocr', status: '1', used_token: 0 },
      ],
    },
  }
  const catalog = {
    PaddleOCR: [
      {
        id: 17,
        llm_name: 'PP-OCRv5',
        fid: 'PaddleOCR',
        mdl_type: 'ocr',
        available: true,
      },
    ],
  }
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      calls.push({ url, init })
      return new Response(
        JSON.stringify({
          code: 0,
          message: 'success',
          data: url.pathname.endsWith('/my_llms') ? configured : catalog,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    },
  )

  assert.deepEqual(await llmAPI.getMyLLMs(), configured)
  assert.deepEqual(await llmAPI.getModelCatalog(), catalog)
  assert.deepEqual(
    calls.map((call) => call.url.pathname),
    ['/v1/llm/my_llms', '/v1/llm/list'],
  )
  for (const { url, init } of calls) {
    assert.equal(init?.method, 'GET')
    assert.equal(init?.body, undefined)
    assert.equal(url.search, '')
    assert.equal(url.searchParams.has('include_details'), false)
    assert.equal(url.searchParams.has('api_key'), false)
  }
})

test('HTTP 200 model-list business failures reject through the real APIClient for both envelopes', async (t) => {
  let wire: unknown
  const fetch = t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify(wire), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  )
  for (wire of [
    { code: 109, message: 'model access denied', data: {} },
    { retcode: 109, retmsg: 'model access denied', data: {} },
  ]) {
    for (const read of [llmAPI.getMyLLMs, llmAPI.getModelCatalog]) {
      await assert.rejects(read(), (error: unknown) => {
        assert.ok(error instanceof APIError)
        assert.equal(error.status, 200)
        assert.equal(error.code, '109')
        return true
      })
    }
  }
  assert.equal(fetch.mock.callCount(), 4)
})
