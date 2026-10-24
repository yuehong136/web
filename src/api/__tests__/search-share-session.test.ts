import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient } from '../client'
import { searchAPI } from '../search'
import { STORAGE_KEYS } from '@/constants'

test('shared mindmap 401 never clears the product session, including missing or empty entry credentials', async () => {
  const descriptors = Object.fromEntries(
    ['window', 'localStorage', 'fetch'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  )
  const storage = new Map<string, string>()
  const logouts: Event[] = []
  let sentAuthorization: string | undefined
  let query = ''
  const localStorageFixture = {
    get length() {
      return storage.size
    },
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
  }
  Object.defineProperties(globalThis, {
    localStorage: { configurable: true, value: localStorageFixture },
    window: {
      configurable: true,
      value: {
        location: {
          get search() {
            return query
          },
          get href() {
            return `http://fixture.invalid/search/app${query}`
          },
        },
        history: { replaceState: () => undefined },
        dispatchEvent: (event: Event) => {
          if (event.type === 'auth:logout') logouts.push(event)
        },
      },
    },
    fetch: {
      configurable: true,
      value: async (_url: unknown, config: RequestInit) => {
        sentAuthorization =
          new Headers(config.headers).get('Authorization') ?? undefined
        return Response.json({ detail: 'Expired share' }, { status: 401 })
      },
    },
  })
  try {
    for (const auth of [undefined, '', 'fixture-entry-only']) {
      query = '?shared_id=fixture-share'
      if (auth !== undefined) query += `&auth=${auth}`
      apiClient.setAuthToken('fixture-product-session')
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'fixture-refresh-session')
      storage.set(STORAGE_KEYS.USER_INFO, 'fixture-user')
      await assert.rejects(
        searchAPI.mindmapShare({ question: 'Question', kb_ids: ['kb'] }),
        (error: unknown) => {
          assert.equal((error as { status?: number }).status, 401)
          return true
        },
      )
      assert.equal(
        storage.get(STORAGE_KEYS.AUTH_TOKEN),
        'fixture-product-session',
      )
      assert.equal(
        storage.get(STORAGE_KEYS.REFRESH_TOKEN),
        'fixture-refresh-session',
      )
      assert.equal(storage.get(STORAGE_KEYS.USER_INFO), 'fixture-user')
      assert.equal(logouts.length, 0)
      assert.equal(
        sentAuthorization,
        `Bearer ${auth || 'fixture-product-session'}`,
      )
    }
  } finally {
    apiClient.setAuthToken(null)
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})
