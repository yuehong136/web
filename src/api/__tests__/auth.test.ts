import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, type RequestConfig } from '../client'

type Call = {
  method: string
  endpoint: string
  data?: unknown
  config?: RequestConfig
}

test('auth API uses the RESTful user routes and methods', async () => {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
  })
  const { authAPI } = await import('../auth')
  const originals = {
    get: apiClient.get,
    post: apiClient.post,
    patch: apiClient.patch,
  }
  const calls: Call[] = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'GET', endpoint, config })
    return {}
  }) as typeof apiClient.get
  apiClient.post = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'POST', endpoint, data, config })
    return {}
  }) as typeof apiClient.post
  apiClient.patch = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'PATCH', endpoint, data, config })
    return true
  }) as typeof apiClient.patch

  try {
    await authAPI.login({ email: 'user@example.com', password: 'secret' })
    await authAPI.register({
      email: 'user@example.com',
      nickname: 'User',
      password: 'secret',
    })
    await authAPI.getUserProfile()
    await authAPI.getTenantInfo()
    await authAPI.getLoginChannels()
    await authAPI.logout()
    await authAPI.updateUserSettings({ nickname: 'Updated' })
  } finally {
    apiClient.get = originals.get
    apiClient.post = originals.post
    apiClient.patch = originals.patch
  }

  assert.deepEqual(
    calls.map(({ method, endpoint }) => [method, endpoint]),
    [
      ['POST', '/auth/login'],
      ['POST', '/users'],
      ['GET', '/users/me'],
      ['GET', '/users/me/models'],
      ['GET', '/auth/login/channels'],
      ['POST', '/auth/logout'],
      ['PATCH', '/users/me'],
    ],
  )
  assert.ok(
    calls.every((call) => call.config?.baseURL === 'http://localhost:8000/api'),
  )
  assert.equal(calls[0]?.config?.skipAuth, true)
  assert.equal(
    (calls[0]?.data as { username: string }).username,
    'user@example.com',
  )
  assert.equal(calls[1]?.config?.skipAuth, true)
  assert.equal(calls[4]?.config?.skipAuth, true)
})
