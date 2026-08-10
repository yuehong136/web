import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import type { UserInfo } from '@/types/api'

class MemoryStorage implements Storage {
  private readonly entries = new Map<string, string>()

  get length(): number {
    return this.entries.size
  }

  clear(): void {
    this.entries.clear()
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.entries.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.entries.delete(key)
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value)
  }
}

const browserEvents = new EventTarget()
const memoryStorage = new MemoryStorage()
let reloadCount = 0

Object.defineProperties(globalThis, {
  addEventListener: {
    configurable: true,
    value: browserEvents.addEventListener.bind(browserEvents),
  },
  dispatchEvent: {
    configurable: true,
    value: browserEvents.dispatchEvent.bind(browserEvents),
  },
  localStorage: {
    configurable: true,
    value: memoryStorage,
  },
  location: {
    configurable: true,
    value: {
      href: 'http://localhost/home',
      reload: () => {
        reloadCount += 1
      },
    },
  },
  removeEventListener: {
    configurable: true,
    value: browserEvents.removeEventListener.bind(browserEvents),
  },
  window: {
    configurable: true,
    value: globalThis,
  },
})

const { STORAGE_KEYS } = await import('@/constants')
const { apiClient } = await import('../client')
const { authAPI } = await import('../auth')
const { queryClient } = await import('@/lib/query-client')
const { useAuthStore } = await import('@/stores/auth')

const USER_A: UserInfo = {
  id: 'user-a',
  email: 'user-a@example.com',
  username: 'user-a',
  tenant_id: 'tenant-a',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const USER_B: UserInfo = {
  ...USER_A,
  id: 'user-b',
  email: 'user-b@example.com',
  username: 'user-b',
  tenant_id: 'tenant-b',
}

const originalLogin = authAPI.login
const originalLogout = authAPI.logout
const originalRegister = authAPI.register
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

function seedAuthenticatedSession(): void {
  apiClient.setAuthToken('token-a')
  localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(USER_A))
  useAuthStore.setState({
    user: USER_A,
    tenant: null,
    token: 'token-a',
    isAuthenticated: true,
    isLoading: false,
  })
  queryClient.setQueryData(['userProfile'], USER_A)
  queryClient.setQueryData(['knowledge', 'list'], {
    ownerId: USER_A.id,
  })
  queryClient.getMutationCache().build(queryClient, {
    gcTime: Infinity,
    mutationKey: ['profile', 'update'],
    mutationFn: async () => undefined,
  })
}

beforeEach(() => {
  reloadCount = 0
  memoryStorage.clear()
  queryClient.clear()
  apiClient.setAuthToken(null)
  useAuthStore.setState({
    user: null,
    tenant: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  })
})

afterEach(() => {
  authAPI.login = originalLogin
  authAPI.logout = originalLogout
  authAPI.register = originalRegister
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
})

test('manual logout clears cached data from the previous identity', async () => {
  seedAuthenticatedSession()
  let backendLogoutCalls = 0
  authAPI.logout = async () => {
    backendLogoutCalls += 1
    return true
  }

  await useAuthStore.getState().logout()

  assert.equal(backendLogoutCalls, 1)
  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(queryClient.getMutationCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().isAuthenticated, false)
  assert.equal(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN), null)
})

test('backend logout failure still clears the local session cache', async () => {
  seedAuthenticatedSession()
  console.warn = () => undefined
  authAPI.logout = async () => {
    throw new Error('backend unavailable')
  }

  await useAuthStore.getState().logout()

  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().user, null)
  assert.equal(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN), null)
})

test('local session cache clears without waiting for backend logout', async () => {
  seedAuthenticatedSession()
  let resolveBackendLogout: ((value: boolean) => void) | undefined
  authAPI.logout = () =>
    new Promise<boolean>((resolve) => {
      resolveBackendLogout = resolve
    })

  const logout = useAuthStore.getState().logout()

  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(queryClient.getMutationCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().isAuthenticated, false)

  resolveBackendLogout?.(true)
  await logout
})

test('token-expiry logout event clears cache before reloading', () => {
  seedAuthenticatedSession()

  window.dispatchEvent(
    new CustomEvent('auth:logout', {
      detail: { reason: 'token_expired' },
    }),
  )

  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().isAuthenticated, false)
  assert.equal(reloadCount, 1)
})

test('direct account replacement cannot inherit the previous identity cache', async () => {
  seedAuthenticatedSession()
  console.log = () => undefined
  authAPI.login = async () => ({
    data: USER_B,
    auth: 'token-b',
  })

  await useAuthStore.getState().login(USER_B.email, 'secret')

  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().user?.id, USER_B.id)
  assert.equal(useAuthStore.getState().token, 'token-b')
})

test('registration cannot inherit cache from an existing identity', async () => {
  seedAuthenticatedSession()
  console.log = () => undefined
  authAPI.register = async () => ({
    data: USER_B,
    auth: 'token-b',
  })

  await useAuthStore.getState().register({
    nickname: USER_B.username,
    email: USER_B.email,
    password: 'secret',
  })

  assert.equal(queryClient.getQueryCache().getAll().length, 0)
  assert.equal(queryClient.getMutationCache().getAll().length, 0)
  assert.equal(useAuthStore.getState().user?.id, USER_B.id)
})
