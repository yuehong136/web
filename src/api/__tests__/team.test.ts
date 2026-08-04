import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import { teamAPI } from '../team'

type Call = { endpoint: string; data?: unknown; config?: RequestConfig }

function stub(
  verb: 'get' | 'post' | 'put' | 'patch' | 'delete',
  impl: (...args: never[]) => Promise<unknown>,
) {
  const original = apiClient[verb]
  apiClient[verb] = impl as unknown as typeof original
  return () => {
    apiClient[verb] = original
  }
}

test('listJoinedTeams hits the RESTful tenants route', async () => {
  const calls: Call[] = []
  const restore = stub(
    'get',
    async (endpoint: string, config?: RequestConfig) => {
      calls.push({ endpoint, config })
      return []
    },
  )

  try {
    await teamAPI.listJoinedTeams()
  } finally {
    restore()
  }

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.endpoint, '/v1/tenants')
  assert.ok(calls[0]?.config?.baseURL?.endsWith('/api'))
})

test('acceptInvitation uses PATCH on the tenant resource', async () => {
  const calls: Call[] = []
  const restore = stub(
    'patch',
    async (endpoint: string, data?: unknown, config?: RequestConfig) => {
      calls.push({ endpoint, data, config })
      return undefined
    },
  )

  try {
    await teamAPI.acceptInvitation('tenant/1')
  } finally {
    restore()
  }

  assert.equal(calls[0]?.endpoint, '/v1/tenants/tenant%2F1')
  assert.equal(calls[0]?.data, undefined)
})

test('removeMember carries user_id in the DELETE body', async () => {
  const calls: Call[] = []
  const restore = stub(
    'delete',
    async (endpoint: string, config?: RequestConfig) => {
      calls.push({ endpoint, config })
      return undefined
    },
  )

  try {
    await teamAPI.removeMember('tenant-1', 'member-1')
  } finally {
    restore()
  }

  assert.equal(calls[0]?.endpoint, '/v1/tenants/tenant-1/users')
  assert.deepEqual(calls[0]?.config?.data, { user_id: 'member-1' })
})

test('team calls fall back to the legacy web route when the RESTful one is missing', async () => {
  const calls: Call[] = []
  const restore = stub(
    'get',
    async (endpoint: string, config?: RequestConfig) => {
      calls.push({ endpoint, config })
      if (endpoint.startsWith('/v1/tenants')) {
        throw new APIError(404, 'NOT_FOUND', 'Not Found')
      }
      return []
    },
  )

  try {
    await teamAPI.listTeamMembers('tenant-1')
  } finally {
    restore()
  }

  assert.deepEqual(
    calls.map((call) => call.endpoint),
    ['/v1/tenants/tenant-1/users', '/tenant/tenant-1/user/list'],
  )
})

test('business errors are not swallowed by the legacy fallback', async () => {
  const calls: Call[] = []
  const restore = stub(
    'get',
    async (endpoint: string, config?: RequestConfig) => {
      calls.push({ endpoint, config })
      throw new APIError(200, '109', 'No authorization.')
    },
  )

  try {
    await assert.rejects(() => teamAPI.listTeamMembers('tenant-1'), APIError)
  } finally {
    restore()
  }

  assert.equal(calls.length, 1)
})
