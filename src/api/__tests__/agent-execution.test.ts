import assert from 'node:assert/strict'
import test from 'node:test'
import { agentAPI } from '../agent'
import { apiClient, APIError } from '../client'
import { buildAgentRunBody } from '../agent-execution'
import { assertResponse, assertSSEResponse } from '@/lib/streaming'
import { agentRunErrorKey } from '@/pages/agent/runtime-errors'

for (const mode of ['draft', 'published'] as const) {
  test(`${mode} is explicit for new runs and cannot switch a resumed session`, () => {
    assert.equal(
      buildAgentRunBody({ id: 'agent', mode }).release,
      mode === 'published',
    )
    const resumed = buildAgentRunBody({
      id: 'agent',
      mode,
      release: true,
      session_id: 'original',
    })
    assert.equal(resumed.session_id, 'original')
    assert.ok(!('release' in resumed))
  })
  test(`session creation forwards ${mode} as boolean release`, async () => {
    const original = apiClient.post
    let body: unknown
    apiClient.post = (async (_endpoint: string, value: unknown) => {
      body = value
      return { id: 'session' }
    }) as typeof original
    try {
      await agentAPI.createSession('agent', { name: 'session', mode })
      assert.deepEqual(body, { name: 'session', release: mode === 'published' })
    } finally {
      apiClient.post = original
    }
  })
}

test('run bodies allowlist content and exclude executable authority', () => {
  const input = {
    id: 'agent',
    mode: 'draft' as const,
    query: 'hello',
    user_id: 'display-tag',
    run_context: { principal: 'spoof' },
    agent_revision_id: 'forged',
    prepared_run: {},
  }
  const body = buildAgentRunBody(input)
  assert.equal(body.user_id, 'display-tag')
  for (const field of [
    'run_context',
    'prepared_run',
    'agent_revision_id',
    'mode',
  ])
    assert.ok(!(field in body))
})

for (const [code, key, status] of [
  ['context_required', 'contextRequired', 403],
  ['grant_not_found', 'grantRequired', 403],
  ['development_tool_denied', 'toolDenied', 403],
  ['assurance_denied', 'assuranceRequired', 403],
  ['static_auth_conflict', 'configurationRequired', 403],
  ['snapshot_invalid', 'serviceUnavailable', 503],
  ['token_issuance_failed', 'serviceUnavailable', 503],
] as const) {
  test(`${code} survives both normal requests and SSE preflight`, async () => {
    const body = {
      retcode: 104,
      retmsg: 'private credential detail',
      data: false,
      error_code: code,
    }
    const response = () => Response.json(body, { status })
    const original = globalThis.fetch
    globalThis.fetch = async () => response()
    try {
      for (const operation of [
        () => apiClient.post('/agents/agent/sessions', {}),
        () => assertSSEResponse(response()),
      ]) {
        await assert.rejects(operation(), (error: unknown) => {
          assert.ok(error instanceof APIError)
          assert.equal(error.status, status)
          assert.equal(error.code, code)
          assert.equal(
            agentRunErrorKey(error),
            `agent.runtime.authorization.${key}`,
          )
          return true
        })
      }
    } finally {
      globalThis.fetch = original
    }
  })
}

test('unknown errors use safe fallback and never derive UI copy from details', () => {
  assert.equal(
    agentRunErrorKey(new APIError(500, 'unknown', 'secret')),
    'agent.runtime.runFailed',
  )
  assert.equal(
    agentRunErrorKey(new APIError(500, 'toString', 'secret')),
    'agent.runtime.runFailed',
  )
  assert.equal(
    agentRunErrorKey(new Error('secret'), 'agent.runtime.createSessionFailed'),
    'agent.runtime.createSessionFailed',
  )
})

test('HTTP 200 JSON failures cannot become successful empty streams', async () => {
  await assert.rejects(
    assertSSEResponse(
      Response.json({
        retcode: 104,
        data: false,
        error_code: 'grant_not_found',
      }),
    ),
    (error: unknown) =>
      error instanceof APIError && error.code === 'grant_not_found',
  )
})

test('JSON task acknowledgements remain valid outside SSE', async () => {
  const response = Response.json({ retcode: 0, data: { message_id: 'task' } })
  await assertResponse(response)
  assert.equal((await response.json()).data.message_id, 'task')
  await assert.rejects(
    assertSSEResponse(Response.json({ retcode: 0, data: {} })),
    (error: unknown) =>
      error instanceof APIError && error.code === 'INVALID_STREAM',
  )
})
