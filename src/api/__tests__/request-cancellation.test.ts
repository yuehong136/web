import assert from 'node:assert/strict'
import test from 'node:test'
import { isCancelledError } from '@tanstack/react-query'
import { APIClient, APIError } from '../client'
import { createQueryClient } from '@/lib/query-client'

const client = new APIClient('http://fixture.invalid')
const withFetch = async (fetcher: typeof fetch, run: () => Promise<void>) => {
  const original = globalThis.fetch
  globalThis.fetch = fetcher
  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}
const cancelled = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

test('an already cancelled JSON request makes no fetch, including a custom reason', async () => {
  let requests = 0
  await withFetch(
    async () => {
      requests += 1
      return Response.json({ ok: true })
    },
    async () => {
      for (const reason of [undefined, 'private-custom-cancellation']) {
        const owner = new AbortController()
        owner.abort(reason)
        await assert.rejects(
          client.get('/fixture', { signal: owner.signal }),
          cancelled,
        )
      }
    },
  )
  assert.equal(requests, 0)
})

test('caller cancellation reaches fetch and rejects promptly even if transport ignores it', async () => {
  let receivedSignal: AbortSignal | undefined
  let started!: () => void
  const ready = new Promise<void>((resolve) => {
    started = resolve
  })
  await withFetch(
    (_url, options) => {
      receivedSignal = options?.signal ?? undefined
      started()
      return new Promise(() => {})
    },
    async () => {
      const owner = new AbortController()
      const request = client.post(
        '/fixture',
        { value: 1 },
        { signal: owner.signal },
      )
      await ready
      owner.abort('user stopped')
      await assert.rejects(request, cancelled)
      assert.equal(receivedSignal?.aborted, true)
    },
  )
})

test('JSON decoding remains cancellable after headers and rejects a late decoded result', async () => {
  let decode!: (data: unknown) => void
  let started!: () => void
  const ready = new Promise<void>((resolve) => {
    started = resolve
  })
  const response = Response.json({ ok: true })
  response.json = () =>
    new Promise((resolve) => {
      decode = resolve
      started()
    })
  await withFetch(
    async () => response,
    async () => {
      const owner = new AbortController()
      const request = client.get('/fixture', { signal: owner.signal })
      await ready
      owner.abort()
      decode({ retcode: 0, data: 'late success' })
      await assert.rejects(request, cancelled)
    },
  )
})

test('timeout covers the JSON body and remains a typed timeout rather than caller cancellation', async () => {
  const response = Response.json({ ok: true })
  response.json = () => new Promise(() => {})
  await withFetch(
    async () => response,
    async () => {
      await assert.rejects(
        client.get('/fixture', { timeout: 5 }),
        (error: unknown) => {
          assert.ok(error instanceof APIError)
          assert.equal(error.code, 'TIMEOUT')
          assert.equal(error.status, 408)
          return true
        },
      )
    },
  )
})

test('success and HTTP failure detach the caller listener and release the timeout', async () => {
  for (const response of [
    Response.json({ retcode: 0, data: 'ok' }),
    Response.json({ detail: 'failed' }, { status: 500 }),
  ]) {
    const owner = new AbortController()
    const signal = owner.signal
    const add = signal.addEventListener.bind(signal)
    const remove = signal.removeEventListener.bind(signal)
    let balance = 0
    signal.addEventListener = (
      ...args: Parameters<AbortSignal['addEventListener']>
    ) => {
      balance += 1
      add(...args)
    }
    signal.removeEventListener = (
      ...args: Parameters<AbortSignal['removeEventListener']>
    ) => {
      balance -= 1
      remove(...args)
    }
    await withFetch(
      async () => response,
      async () => {
        await client
          .get('/fixture', { signal, timeout: 10 })
          .catch(() => undefined)
        assert.equal(balance, 0)
        owner.abort()
      },
    )
  }
})

test('query defaults never retry expected caller cancellation', async () => {
  const queryClient = createQueryClient()
  let requests = 0
  try {
    await assert.rejects(
      queryClient.fetchQuery({
        queryKey: ['cancelled-fixture'],
        retryDelay: 1,
        queryFn: async () => {
          requests += 1
          throw new DOMException('Aborted', 'AbortError')
        },
      }),
      cancelled,
    )
    assert.equal(requests, 1)
    const retry = queryClient.getDefaultOptions().queries?.retry
    assert.equal(typeof retry, 'function')
    if (typeof retry === 'function') {
      assert.equal(retry(0, new APIError(408, 'TIMEOUT', 'timeout')), true)
      assert.equal(
        retry(0, new APIError(401, 'UNAUTHORIZED', 'unauthorized')),
        false,
      )
      assert.equal(retry(0, new APIError(0, 'ABORTED', 'cancelled')), false)
    }
  } finally {
    queryClient.clear()
  }
})

test('cancelling a query during its retry delay prevents another transport attempt', async () => {
  const queryClient = createQueryClient()
  let attempts = 0
  let firstAttempt!: () => void
  const ready = new Promise<void>((resolve) => {
    firstAttempt = resolve
  })
  const request = queryClient.fetchQuery({
    queryKey: ['retry-cancel-fixture'],
    retryDelay: 20,
    queryFn: async ({ signal }) => {
      signal.throwIfAborted()
      attempts += 1
      firstAttempt()
      throw new APIError(503, 'UNAVAILABLE', 'private upstream detail')
    },
  })
  const rejected = assert.rejects(request, isCancelledError)
  await ready
  await queryClient.cancelQueries({ queryKey: ['retry-cancel-fixture'] })
  await rejected
  assert.equal(attempts, 1)
  queryClient.clear()
})
