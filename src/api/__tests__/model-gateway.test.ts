import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, type RequestConfig } from '../client'
import { modelGatewayAPI } from '../model-gateway'

type Verb = 'get' | 'post' | 'patch' | 'delete'
type Call = {
  verb: Verb
  endpoint: string
  data?: unknown
  config?: RequestConfig
}

/** Replace the client verbs with recorders; `restore` puts the originals back. */
function recordCalls(result: unknown = {}) {
  const calls: Call[] = []
  const originals = {
    get: apiClient.get,
    post: apiClient.post,
    patch: apiClient.patch,
    delete: apiClient.delete,
  }
  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ verb: 'get', endpoint, config })
    return result
  }) as typeof apiClient.get
  apiClient.delete = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ verb: 'delete', endpoint, config })
    return result
  }) as typeof apiClient.delete
  for (const verb of ['post', 'patch'] as const) {
    apiClient[verb] = (async (
      endpoint: string,
      data?: unknown,
      config?: RequestConfig,
    ) => {
      calls.push({ verb, endpoint, data, config })
      return result
    }) as typeof apiClient.post
  }
  return {
    calls,
    restore: () => Object.assign(apiClient, originals),
  }
}

test('every route targets the RESTful model-gateway prefix', async () => {
  const { calls, restore } = recordCalls()
  try {
    await modelGatewayAPI.listCandidates()
    await modelGatewayAPI.listModels()
    await modelGatewayAPI.createModel({
      name: 'chat-default',
      model_id: 7,
      model_type: 'chat',
    })
    await modelGatewayAPI.updateModel('m/1', { status: 'inactive' })
    await modelGatewayAPI.deleteModel('m/1')
    await modelGatewayAPI.listKeys()
    await modelGatewayAPI.updateKey('k 1', { rpm_limit: null })
    await modelGatewayAPI.revokeKey('k 1')
  } finally {
    restore()
  }

  assert.deepEqual(
    calls.map((call) => `${call.verb} ${call.endpoint}`),
    [
      'get /v1/model-gateway/candidates',
      'get /v1/model-gateway/models',
      'post /v1/model-gateway/models',
      'patch /v1/model-gateway/models/m%2F1',
      'delete /v1/model-gateway/models/m%2F1',
      'get /v1/model-gateway/keys',
      'patch /v1/model-gateway/keys/k%201',
      'post /v1/model-gateway/keys/k%201/revoke',
    ],
  )
  assert.ok(calls.every((call) => call.config?.baseURL?.endsWith('/api')))
  // Revoking carries no body, and an explicit null survives to clear a limit.
  assert.equal(calls[7]?.data, undefined)
  assert.deepEqual(calls[6]?.data, { rpm_limit: null })
})

test('createKey sends the limits and returns the one-time plaintext', async () => {
  const created = { id: 'k1', name: 'runner', key: 'sk-mrag-plaintext' }
  const { calls, restore } = recordCalls(created)
  const input = {
    name: 'runner',
    allowed_model_ids: ['m1'],
    rpm_limit: 60,
    token_quota: 1000,
    quota_period: 'month' as const,
  }
  let result: unknown
  try {
    result = await modelGatewayAPI.createKey(input)
  } finally {
    restore()
  }

  assert.equal(calls[0]?.endpoint, '/v1/model-gateway/keys')
  assert.deepEqual(calls[0]?.data, input)
  assert.deepEqual(result, created)
})

test('log and usage queries pass their filters as params with the abort signal', async () => {
  const { calls, restore } = recordCalls({ items: [] })
  const controller = new AbortController()
  try {
    await modelGatewayAPI.queryLogs(
      { page: 2, page_size: 50, key_id: 'k1', outcome: 'error' },
      controller.signal,
    )
    await modelGatewayAPI.usage(
      { group_by: 'day', start: '2026-11-01T00:00:00.000Z' },
      controller.signal,
    )
  } finally {
    restore()
  }

  assert.equal(calls[0]?.endpoint, '/v1/model-gateway/logs')
  assert.deepEqual(calls[0]?.config?.params, {
    page: 2,
    page_size: 50,
    key_id: 'k1',
    outcome: 'error',
  })
  assert.equal(calls[0]?.config?.signal, controller.signal)
  assert.equal(calls[1]?.endpoint, '/v1/model-gateway/usage')
  assert.deepEqual(calls[1]?.config?.params, {
    group_by: 'day',
    start: '2026-11-01T00:00:00.000Z',
  })
})
