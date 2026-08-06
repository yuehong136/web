/**
 * auth API 契约测试
 *
 * 后端 2026-08-03 把 user 模块迁到 RESTful（`/api/v1`），旧的 `/v1/user/*` 已删除。
 * 这里锁住三件事：端点路径 + HTTP 方法、baseURL 覆盖（`/api` → `/api/v1`）、
 * 登录/注册信封（JWT 在响应头）与相邻端点不被误判。
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, type RequestConfig } from '../client'

// jsencrypt（src/utils/crypt.ts 的依赖）在模块顶层就读 window，node:test 里没有这个
// 全局。先补最小 shim，再动态 import 被测模块——静态 import 会先于任何语句求值。
if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
  })
}

const { authAPI } = await import('../auth')

const REST_BASE = 'http://localhost:8000/api'

type Call = {
  method: string
  endpoint: string
  data?: unknown
  config?: RequestConfig
}

const captureCalls = async (run: () => Promise<unknown>): Promise<Call[]> => {
  const calls: Call[] = []
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalPatch = apiClient.patch

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
    await run()
  } finally {
    apiClient.get = originalGet
    apiClient.post = originalPost
    apiClient.patch = originalPatch
  }

  return calls
}

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

const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  })

test('auth API 全量打在 RESTful /api/v1 上，方法与后端一致', async () => {
  const calls = await captureCalls(async () => {
    await authAPI.login({ email: 'admin@datav.com', password: 'secret' })
    await authAPI.register({
      email: 'admin@datav.com',
      nickname: 'admin',
      password: 'secret',
    })
    await authAPI.getUserInfo()
    await authAPI.getUserProfile()
    await authAPI.updateUserProfile({ nickname: 'admin' })
    await authAPI.updateUserSettings({ nickname: 'admin' })
    await authAPI.getTenantInfo()
    await authAPI.updateTenantInfo({ tenant_id: 't1', llm_id: 'gpt@openai' })
    await authAPI.getLoginChannels()
    await authAPI.getOAuthURL('github')
    await authAPI.logout()
    await authAPI.sendPasswordResetOtp({
      email: 'admin@datav.com',
      captcha: 'AB12',
    })
    await authAPI.verifyPasswordResetOtp({
      email: 'admin@datav.com',
      otp: '123456',
    })
    await authAPI.resetPassword({
      email: 'admin@datav.com',
      new_password: 'n',
      confirm_new_password: 'n',
    })
  })

  assert.deepEqual(
    calls.map((call) => [call.method, call.endpoint]),
    [
      ['POST', '/auth/login'],
      ['POST', '/users'],
      ['GET', '/users/me'],
      ['GET', '/users/me'],
      ['PATCH', '/users/me'],
      ['PATCH', '/users/me'],
      ['GET', '/users/me/models'],
      ['PATCH', '/users/me/models'],
      ['GET', '/auth/login/channels'],
      ['GET', '/auth/login/github'],
      ['POST', '/auth/logout'],
      ['POST', '/auth/password/forgot/otp'],
      ['POST', '/auth/password/forgot/otp/verify'],
      ['POST', '/auth/password/reset'],
    ],
  )

  for (const call of calls) {
    assert.equal(
      call.config?.baseURL,
      REST_BASE,
      `${call.endpoint} 必须走 /api/v1`,
    )
  }
})

test('登录请求体用 username 字段且密码已加密', async () => {
  const calls = await captureCalls(async () => {
    await authAPI.login({ email: 'admin@datav.com', password: 'secret' })
  })

  const body = calls[0]?.data as Record<string, unknown>
  assert.equal(body.username, 'admin@datav.com')
  assert.equal('email' in body, false, '后端只认 username')
  assert.equal(typeof body.password, 'string')
  assert.notEqual(body.password, 'secret', '密码必须加密后再发')
})

test('图片验证码走 POST + email 查询参数，返回原始图片', async () => {
  const originalPost = apiClient.post
  const calls: Call[] = []

  apiClient.post = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'POST', endpoint, data, config })
    return new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'content-type': 'image/jpeg' },
    })
  }) as typeof apiClient.post

  let blob: Blob
  try {
    blob = await authAPI.requestPasswordResetCaptcha('admin@datav.com')
  } finally {
    apiClient.post = originalPost
  }

  assert.equal(calls[0]?.endpoint, '/auth/password/forgot/captcha')
  assert.equal(calls[0]?.config?.baseURL, REST_BASE)
  assert.deepEqual(calls[0]?.config?.params, { email: 'admin@datav.com' })
  assert.equal(blob.size, 3)
})

test('POST /auth/login 返回完整信封，JWT 从 Authorization 响应头取', async () => {
  await withFetch(
    () =>
      jsonResponse(
        { retcode: 0, retmsg: 'Welcome back!', data: { id: 'u1' } },
        { Authorization: 'Bearer jwt-token' },
      ),
    async () => {
      const response = await apiClient.post<{
        auth?: string
        data?: { id: string }
      }>(
        '/auth/login',
        { username: 'admin@datav.com', password: 'enc' },
        { baseURL: REST_BASE, skipAuth: true },
      )

      assert.equal(response.auth, 'Bearer jwt-token')
      assert.deepEqual(response.data, { id: 'u1' })
    },
  )
})

test('POST /users（注册）同样返回完整信封', async () => {
  await withFetch(
    () =>
      jsonResponse(
        { retcode: 0, retmsg: 'Welcome aboard!', data: { id: 'u2' } },
        { Authorization: 'Bearer jwt-token-2' },
      ),
    async () => {
      const response = await apiClient.post<{
        auth?: string
        data?: { id: string }
      }>('/users', {}, { baseURL: REST_BASE, skipAuth: true })

      assert.equal(response.auth, 'Bearer jwt-token-2')
      assert.deepEqual(response.data, { id: 'u2' })
    },
  )
})

test('相邻端点不被误判为登录端点，仍然只返回 data', async () => {
  await withFetch(
    () =>
      jsonResponse(
        { retcode: 0, retmsg: 'success', data: [{ channel: 'github' }] },
        { Authorization: 'Bearer should-not-leak' },
      ),
    async () => {
      // GET /auth/login/channels —— 路径以 /auth/login 开头但不是登录本身
      const channels = await apiClient.get('/auth/login/channels', {
        baseURL: REST_BASE,
        skipAuth: true,
      })
      assert.deepEqual(channels, [{ channel: 'github' }])
    },
  )

  await withFetch(
    () => jsonResponse({ retcode: 0, retmsg: 'success', data: true }),
    async () => {
      // POST /users/me/... 不是注册；POST 的忘记密码端点也不是
      const sent = await apiClient.post(
        '/auth/password/forgot/otp',
        { email: 'a@b.com', captcha: 'AB12' },
        { baseURL: REST_BASE, skipAuth: true },
      )
      assert.equal(sent, true)
    },
  )
})
