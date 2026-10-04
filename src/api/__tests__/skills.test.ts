import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, APIError } from '../client'
import { skillsAPI } from '../skills'
import { skillResponse } from '../skill-response'
import { acceptedSkillOperationSchema, skillModelSchema } from '../skill-types'
import { z } from 'zod'
import { parseSkillProtocol } from '../skill-protocol'

test('Skills protocol is explicit, defaults to assets, and rejects unknown deployments', () => {
  assert.equal(parseSkillProtocol(undefined), 'multirag-assets-v1')
  assert.equal(parseSkillProtocol('ragflow-skills-v1'), 'ragflow-skills-v1')
  assert.throws(() => parseSkillProtocol('auto'))
  assert.throws(() => parseSkillProtocol('python'))
})

const id = 'a'.repeat(32)
const accepted = { operation_id: id, resource_id: null, state: 'pending' }
const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
const success = (status: number, data: unknown) =>
  json(status, { code: 0, message: 'success', data })

test('Skills accepted operation requires actual HTTP 202 and canonical data', async () => {
  const read = skillResponse(acceptedSkillOperationSchema, 202)
  assert.deepEqual(await read(success(202, accepted)), accepted)
  for (const response of [
    success(200, accepted),
    success(202, {}),
    json(202, { retcode: 0, data: accepted }),
    new Response('accepted', { status: 202 }),
  ]) {
    await assert.rejects(
      read(response),
      (error: unknown) =>
        error instanceof APIError && error.code === 'INVALID_SKILL_RESPONSE',
    )
  }
})

test('Skills non-2xx preserves stable nested error code without exposing raw message', async () => {
  const read = skillResponse(acceptedSkillOperationSchema, 202)
  await assert.rejects(
    read(
      json(409, {
        code: 409,
        message: 'private package body',
        data: { error_code: 'VERSION_CONFLICT' },
      }),
    ),
    (error: unknown) => {
      assert.ok(error instanceof APIError)
      assert.equal(error.status, 409)
      assert.equal(error.code, 'VERSION_CONFLICT')
      assert.equal(error.message, 'Skill request failed')
      return true
    },
  )
  await assert.rejects(
    read(json(409, { code: 0, message: 'success', data: accepted })),
  )
})

test('Skills model IDs retain BIGINT precision and reject JSON numbers', async () => {
  const read = skillResponse(z.object({ models: z.array(skillModelSchema) }))
  const model = {
    id: '9007199254740993',
    name: 'same-name',
    provider: 'instance-2',
    type: 'embedding',
    max_tokens: 8192,
    available: true,
    reason: null,
  }
  assert.equal(
    (await read(success(200, { models: [model] }))).models[0].id,
    model.id,
  )
  await assert.rejects(
    read(success(200, { models: [{ ...model, id: 9007199254740992 }] })),
  )
})

test('Skills directory and ZIP uploads use shared auth, preserve manifest order and idempotency header', async () => {
  const original = globalThis.fetch
  apiClient.setAuthToken('skills-test-token')
  const calls: { url: string; headers: Headers; body: FormData }[] = []
  globalThis.fetch = (async (url, options) => {
    assert.ok(options?.body instanceof FormData)
    calls.push({
      url: String(url),
      headers: new Headers(options.headers),
      body: options.body,
    })
    return success(202, accepted)
  }) as typeof fetch
  try {
    const files = [new File(['one'], 'same.txt'), new File(['two'], 'same.txt')]
    const manifest = {
      name: 'test',
      version: '1.0.0',
      activate: false,
      files: [
        { path: 'a/same.txt', sha256: '0'.repeat(64), size: 3 },
        { path: 'b/same.txt', sha256: '1'.repeat(64), size: 3 },
      ],
    }
    assert.deepEqual(
      await skillsAPI.install(id, manifest, files, false, 'stable-key'),
      accepted,
    )
    await skillsAPI.install(
      id,
      { name: 'test', version: '1.0.1', activate: true },
      [new File(['zip'], 'asset.zip')],
      true,
      'zip-key',
    )
    assert.match(
      calls[0].url,
      new RegExp(`/api/v1/skill-assets/spaces/${id}/versions$`),
    )
    assert.equal(
      calls[0].headers.get('authorization'),
      'Bearer skills-test-token',
    )
    assert.equal(calls[0].headers.get('idempotency-key'), 'stable-key')
    assert.deepEqual(
      JSON.parse(String(calls[0].body.get('manifest'))),
      manifest,
    )
    assert.deepEqual(
      await Promise.all(
        (calls[0].body.getAll('file') as File[]).map((file) => file.text()),
      ),
      ['one', 'two'],
    )
    assert.equal(calls[0].headers.has('content-type'), false)
    assert.equal(calls[1].body.getAll('archive').length, 1)
    assert.equal(calls[1].body.getAll('file').length, 0)
    await apiClient.uploadRepeated('/v1/test', 'file', files, undefined, {
      headers: {
        authorization: 'wrong',
        'content-type': 'application/json',
        'Idempotency-Key': 'safe-key',
      },
    })
    assert.equal(
      calls[2].headers.get('authorization'),
      'Bearer skills-test-token',
    )
    assert.equal(calls[2].headers.has('content-type'), false)
    assert.equal(calls[2].headers.get('idempotency-key'), 'safe-key')
  } finally {
    globalThis.fetch = original
    apiClient.setAuthToken(null)
  }
})

test('Skills binary download is authenticated and does not turn business failures into downloaded files', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    json(404, {
      code: 404,
      message: 'missing',
      data: { error_code: 'NOT_FOUND' },
    })) as typeof fetch
  try {
    await assert.rejects(
      skillsAPI.file(id, id, 'scripts/a & b.py'),
      (error: unknown) =>
        error instanceof APIError && error.code === 'NOT_FOUND',
    )
  } finally {
    globalThis.fetch = original
  }
})

test('Skills accepted replay and retry remain distinct HTTP 202 requests', async () => {
  const original = globalThis.fetch
  const calls: { url: string; body: unknown; key: string | null }[] = []
  globalThis.fetch = (async (url, options) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(options?.body)),
      key: new Headers(options?.headers).get('idempotency-key'),
    })
    return success(202, { ...accepted, state: 'succeeded' })
  }) as typeof fetch
  try {
    await skillsAPI.activate(id, id, null, 7, 'activate-key')
    await skillsAPI.retry(id, 'retry-key')
    assert.deepEqual(calls[0].body, { version_id: null, revision: 7 })
    assert.match(calls[1].url, new RegExp(`/operations/${id}/retry$`))
    assert.equal(calls[1].key, 'retry-key')
  } finally {
    globalThis.fetch = original
  }
})
