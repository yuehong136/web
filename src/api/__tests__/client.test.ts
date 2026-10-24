import assert from 'node:assert/strict'
import test from 'node:test'
import { APIClient, APIError, apiClient } from '../client'
import { STORAGE_KEYS } from '@/constants'

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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((yes) => {
    resolve = yes
  })
  return { promise, resolve }
}

const isCancelled = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

async function withSession(
  run: (
    client: APIClient,
    storage: Map<string, string>,
    events: Event[],
  ) => Promise<void>,
) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  )
  const originalFetch = globalThis.fetch
  const storage = new Map<string, string>()
  const events: Event[] = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: { href: 'https://app.example/agent/session' },
      history: { replaceState() {} },
      dispatchEvent: (event: Event) => {
        events.push(event)
        return true
      },
    },
  })
  try {
    await run(new APIClient('https://api.example'), storage, events)
  } finally {
    globalThis.fetch = originalFetch
    for (const [key, descriptor] of [
      ['window', originalWindow],
      ['localStorage', originalStorage],
    ] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
}

const unauthorizedResponses = {
  legacy: () => jsonResponse(401, { retcode: 401, retmsg: 'expired' }),
  rest: () => jsonResponse(401, { code: 401, message: 'expired' }),
  plain: () => jsonResponse(401, { detail: 'expired' }),
  text: () => new Response('expired', { status: 401 }),
}

for (const [format, response] of Object.entries(unauthorizedResponses)) {
  test(`late ${format} 401 cannot clear a replacement login or its stored data`, async () => {
    await withSession(async (client, storage, events) => {
      client.setAuthToken('identity-a')
      const headers = deferred<Response>()
      globalThis.fetch = () => headers.promise
      const request = client.get('/protected')
      client.setAuthToken('identity-b')
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-b')
      storage.set(STORAGE_KEYS.USER_INFO, 'user-b')
      headers.resolve(response())
      await assert.rejects(request, isCancelled)
      assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), 'identity-b')
      assert.equal(storage.get(STORAGE_KEYS.REFRESH_TOKEN), 'refresh-b')
      assert.equal(storage.get(STORAGE_KEYS.USER_INFO), 'user-b')
      assert.deepEqual(events, [])
      globalThis.fetch = async (_url, options) => {
        assert.equal(
          new Headers(options?.headers).get('Authorization'),
          'Bearer identity-b',
        )
        return jsonResponse(200, { retcode: 0, data: 'current owner' })
      }
      assert.equal(await client.get('/protected'), 'current owner')
    })
  })

  test(`current identity ${format} 401 still expires exactly that session`, async () => {
    await withSession(async (client, storage, events) => {
      client.setAuthToken('identity-a')
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-a')
      storage.set(STORAGE_KEYS.USER_INFO, 'user-a')
      globalThis.fetch = async () => response()
      await assert.rejects(client.get('/protected'), APIError)
      assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), undefined)
      assert.equal(storage.get(STORAGE_KEYS.REFRESH_TOKEN), undefined)
      assert.equal(storage.get(STORAGE_KEYS.USER_INFO), undefined)
      assert.equal(events.length, 1)
      assert.equal(events[0]?.type, 'auth:logout')
    })
  })
}

for (const status of [200, 401]) {
  test(`identity replacement during JSON ${status} body consumption discards its result`, async () => {
    await withSession(async (client, storage, events) => {
      client.setAuthToken('identity-a')
      const decoding = deferred<void>()
      const body = deferred<unknown>()
      const response = jsonResponse(status, {})
      response.json = () => {
        decoding.resolve()
        return body.promise
      }
      globalThis.fetch = async () => response
      const request = client.get('/protected')
      await decoding.promise
      client.setAuthToken('identity-b')
      body.resolve({ retcode: status === 200 ? 0 : 401, data: 'old owner' })
      await assert.rejects(request, isCancelled)
      assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), 'identity-b')
      assert.deepEqual(events, [])
    })
  })
}

test('an anonymous request cannot expire a login established while it was in flight', async () => {
  await withSession(async (client, storage, events) => {
    const headers = deferred<Response>()
    globalThis.fetch = () => headers.promise
    const request = client.get('/protected')
    client.setAuthToken('identity-b')
    headers.resolve(jsonResponse(401, { detail: 'anonymous' }))
    await assert.rejects(request, isCancelled)
    assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), 'identity-b')
    assert.deepEqual(events, [])
  })
})

test('skipAuth requests retain their own 401 without affecting a new product login', async () => {
  await withSession(async (client, storage, events) => {
    const headers = deferred<Response>()
    globalThis.fetch = () => headers.promise
    const request = client.get('/shared', { skipAuth: true })
    client.setAuthToken('identity-b')
    headers.resolve(jsonResponse(401, { detail: 'share expired' }))
    await assert.rejects(request, { status: 401, code: 'UNAUTHORIZED' })
    assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), 'identity-b')
    assert.deepEqual(events, [])
  })
})

for (const endpoint of ['/auth/login', '/users']) {
  test(`late ${endpoint} auth headers cannot replace a new login`, async () => {
    await withSession(async (client, storage, events) => {
      const decoding = deferred<void>()
      const body = deferred<unknown>()
      const response = jsonResponse(200, {})
      response.headers.set('Authorization', 'late-login-token')
      response.json = () => {
        decoding.resolve()
        return body.promise
      }
      globalThis.fetch = async () => response
      const request = client.post(endpoint, {}, { skipAuth: true })
      await decoding.promise
      client.setAuthToken('identity-b')
      body.resolve({ retcode: 0, data: { id: 'late-login' } })
      await assert.rejects(request, isCancelled)
      assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), 'identity-b')
      assert.deepEqual(events, [])
    })
  })
}

test('logout and re-login with an identical token still supersedes the old request', async () => {
  await withSession(async (client, storage, events) => {
    client.setAuthToken('same-token')
    const headers = deferred<Response>()
    globalThis.fetch = () => headers.promise
    const request = client.get('/protected')
    client.setAuthToken(null)
    client.setAuthToken('same-token')
    headers.resolve(jsonResponse(401, { detail: 'old login' }))
    await assert.rejects(request, isCancelled)
    assert.equal(storage.get(STORAGE_KEYS.AUTH_TOKEN), 'same-token')
    assert.deepEqual(events, [])
  })
})

test('reapplying the current token does not supersede concurrent successful reads', async () => {
  await withSession(async (client) => {
    client.setAuthToken('same-token')
    const headers = deferred<Response>()
    globalThis.fetch = () => headers.promise
    const requests = [client.get('/first'), client.get('/second')]
    client.setAuthToken('same-token')
    // Each consumer owns a response body, as with two independent HTTP reads.
    const success = { retcode: 0, data: 'current owner' }
    const response = jsonResponse(200, success)
    response.json = async () => success
    headers.resolve(response)
    assert.deepEqual(await Promise.all(requests), [
      'current owner',
      'current owner',
    ])
  })
})
