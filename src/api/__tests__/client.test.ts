import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient } from '../client'

const jsonResponse = (status: number, body: unknown, statusText = '') =>
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  })

const withFetch = async (
  response: () => Response,
  run: () => Promise<void>,
): Promise<void> => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => response()) as typeof globalThis.fetch
  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('request throws on FastAPI 404 instead of returning the error body', async () => {
  await withFetch(
    () => jsonResponse(404, { detail: 'Not Found' }, 'Not Found'),
    async () => {
      const error = await apiClient
        .get('/v1/datasets/kb-1/documents')
        .then(() => null)
        .catch((e: unknown) => e)

      assert.ok(error instanceof APIError, '非信封的 404 必须抛 APIError')
      assert.equal(error.status, 404)
      assert.equal(error.code, 'HTTP_ERROR')
      assert.equal(error.message, 'Not Found')
      assert.deepEqual(error.details, { detail: 'Not Found' })
    },
  )
})

test('request throws on 405 Method Not Allowed', async () => {
  await withFetch(
    () => jsonResponse(405, { detail: 'Method Not Allowed' }),
    async () => {
      const error = await apiClient
        .delete('/v1/datasets/kb-1/documents')
        .then(() => null)
        .catch((e: unknown) => e)

      assert.ok(error instanceof APIError)
      assert.equal(error.status, 405)
      assert.equal(error.message, 'Method Not Allowed')
    },
  )
})

test('request joins FastAPI 422 validation messages', async () => {
  await withFetch(
    () =>
      jsonResponse(422, {
        detail: [
          { loc: ['body', 'ids'], msg: 'field required', type: 'missing' },
          { loc: ['body', 'delete_all'], msg: 'not a valid boolean' },
        ],
      }),
    async () => {
      const error = await apiClient
        .post('/v1/datasets/kb-1/documents', {})
        .then(() => null)
        .catch((e: unknown) => e)

      assert.ok(error instanceof APIError)
      assert.equal(error.status, 422)
      assert.equal(error.message, 'field required; not a valid boolean')
    },
  )
})

test('request falls back to the status line when the error body carries no message', async () => {
  await withFetch(
    () => jsonResponse(502, {}, 'Bad Gateway'),
    async () => {
      const error = await apiClient
        .get('/v1/system/version')
        .then(() => null)
        .catch((e: unknown) => e)

      assert.ok(error instanceof APIError)
      assert.equal(error.status, 502)
      assert.equal(error.message, 'HTTP 502: Bad Gateway')
    },
  )
})

test('request still passes through successful non-envelope payloads', async () => {
  await withFetch(
    () => jsonResponse(200, { version: '0.9.8' }),
    async () => {
      const result = await apiClient.get<{ version: string }>(
        '/v1/system/version',
      )

      assert.deepEqual(result, { version: '0.9.8' })
    },
  )
})

test('request keeps reporting envelope business errors', async () => {
  await withFetch(
    () =>
      jsonResponse(200, { code: 102, message: "You don't own the dataset" }),
    async () => {
      const error = await apiClient
        .get('/v1/datasets/kb-1/documents')
        .then(() => null)
        .catch((e: unknown) => e)

      assert.ok(error instanceof APIError)
      assert.equal(error.code, '102')
      assert.equal(error.message, "You don't own the dataset")
    },
  )
})

test('401 preserves the deep link before notifying the reload listener', async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const order: string[] = []
  const fakeWindow = {
    location: {
      href: 'https://app.example/agent/a?tab=run#node-x',
    },
    history: {
      replaceState: (_state: unknown, _title: string, url: string | URL) => {
        order.push('replace')
        fakeWindow.location.href = String(url)
      },
    },
    dispatchEvent: (_event: Event) => {
      order.push('dispatch')
      assert.equal(
        new URL(fakeWindow.location.href).searchParams.get('expired'),
        'true',
      )
      return true
    },
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: fakeWindow,
  })
  apiClient.setAuthToken('expired-test-token')

  try {
    await withFetch(
      () => jsonResponse(401, { detail: 'expired' }, 'Unauthorized'),
      async () => {
        await assert.rejects(apiClient.get('/v1/protected'), APIError)
      },
    )

    assert.deepEqual(order, ['replace', 'dispatch'])
    assert.equal(
      fakeWindow.location.href,
      'https://app.example/agent/a?tab=run&expired=true#node-x',
    )
  } finally {
    apiClient.setAuthToken(null)
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow)
    } else {
      Reflect.deleteProperty(globalThis, 'window')
    }
  }
})
