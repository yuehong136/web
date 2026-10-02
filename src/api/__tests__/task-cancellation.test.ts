import assert from 'node:assert/strict'
import test from 'node:test'
import { agentAPI } from '../agent'
import { APIError } from '../client'

for (const method of ['cancelTask', 'cancelDataflow'] as const) {
  for (const envelope of [
    { retcode: 0, data: true },
    { code: 0, data: true },
  ]) {
    test(`${method} accepts Python/Go acknowledgement via encoded REST POST without a body`, async () => {
      const original = globalThis.fetch
      let request: { url: string; init?: RequestInit } | undefined
      globalThis.fetch = (async (url, init) => {
        request = { url: String(url), init }
        return Response.json(envelope)
      }) as typeof fetch
      try {
        assert.equal(await agentAPI[method]('task/with space'), true)
        assert.equal(
          request?.url,
          'http://localhost:8000/api/v1/tasks/task%2Fwith%20space/cancel',
        )
        assert.equal(request?.init?.method, 'POST')
        assert.equal(request?.init?.body, undefined)
      } finally {
        globalThis.fetch = original
      }
    })
  }
}

for (const [name, payload, status, expectedCode] of [
  [
    'denied',
    { retcode: 109, data: false, retmsg: 'private denial' },
    200,
    '109',
  ],
  [
    'failed',
    { code: 100, data: false, message: 'private failure' },
    200,
    '100',
  ],
  ['unauthenticated', { detail: 'missing auth' }, 401, 'UNAUTHORIZED'],
  ['validation', { detail: [{ msg: 'invalid id' }] }, 422, 'HTTP_ERROR'],
  ['false ack', { retcode: 0, data: false }, 200, 'INVALID_CANCEL_ACK'],
  ['truthy ack', { code: 0, data: 'true' }, 200, 'INVALID_CANCEL_ACK'],
  ['raw ack', true, 200, 'INVALID_CANCEL_ACK'],
  ['missing data', { retcode: 0 }, 200, 'INVALID_CANCEL_ACK'],
] as const) {
  test(`cancellation rejects ${name} as typed APIError`, async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async () =>
      Response.json(payload, { status })) as typeof fetch
    try {
      await assert.rejects(
        agentAPI.cancelTask('actual-task'),
        (error: unknown) => {
          assert.ok(error instanceof APIError)
          assert.equal(error.code, expectedCode)
          return true
        },
      )
    } finally {
      globalThis.fetch = original
    }
  })
}

test('cancellation network rejection remains typed', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () => {
    throw new TypeError('offline transport')
  }) as typeof fetch
  try {
    await assert.rejects(agentAPI.cancelTask('actual-task'), APIError)
  } finally {
    globalThis.fetch = original
  }
})
