import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient } from '@/api/client'
import {
  __resetApiClientPatchForTests,
  clearEmbedJwt,
  installApiClientPatch,
  isApiClientPatched,
  normalizeEmbedJwt,
  setEmbedJwt,
} from '../apiclient-embed-patch'

type Internal = {
  authToken: string | null
  clearAuthState: () => void
  notifyUnauthorized: () => void
}

function internal(): Internal {
  return apiClient as unknown as Internal
}

test('installApiClientPatch is idempotent', () => {
  __resetApiClientPatchForTests()
  installApiClientPatch({ onAuthExpired: () => undefined })
  installApiClientPatch({ onAuthExpired: () => undefined })
  assert.equal(isApiClientPatched(), true)
})

test('setEmbedJwt writes to in-memory field only', () => {
  __resetApiClientPatchForTests()
  installApiClientPatch({ onAuthExpired: () => undefined })

  // Capture localStorage writes that would target the main auth key.
  const writes: Array<[string, string]> = []
  const realSet = globalThis.localStorage?.setItem
  if (typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem = function (key: string, value: string) {
      writes.push([key, value])
    }
  }

  try {
    setEmbedJwt('jwt-aaa')
    assert.equal(internal().authToken, 'jwt-aaa')
    // None of the writes should target auth_token (or any of the auth keys).
    for (const [key] of writes) {
      assert.notEqual(key, 'auth_token')
      assert.notEqual(key, 'refresh_token')
      assert.notEqual(key, 'user_info')
    }
  } finally {
    if (typeof globalThis.localStorage !== 'undefined' && realSet) {
      globalThis.localStorage.setItem = realSet
    }
  }
})

test('setEmbedJwt accepts Bearer-prefixed JWT values from hosts', () => {
  __resetApiClientPatchForTests()
  installApiClientPatch({ onAuthExpired: () => undefined })

  assert.equal(normalizeEmbedJwt('Bearer jwt-prefixed'), 'jwt-prefixed')
  assert.equal(normalizeEmbedJwt(' bearer   jwt-lower '), 'jwt-lower')
  assert.equal(normalizeEmbedJwt('Bearer Bearer jwt-double'), 'jwt-double')

  setEmbedJwt('Bearer jwt-ddd')
  assert.equal(internal().authToken, 'jwt-ddd')
})

test('patched clearAuthState only clears in-memory token (no localStorage write)', () => {
  __resetApiClientPatchForTests()
  installApiClientPatch({ onAuthExpired: () => undefined })
  setEmbedJwt('jwt-bbb')

  const removed: string[] = []
  const realRemove = globalThis.localStorage?.removeItem
  if (typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.removeItem = function (key: string) {
      removed.push(key)
    }
  }

  try {
    internal().clearAuthState()
    assert.equal(internal().authToken, null)
    // The patched clearAuthState must not have touched localStorage.
    assert.equal(removed.length, 0)
  } finally {
    if (typeof globalThis.localStorage !== 'undefined' && realRemove) {
      globalThis.localStorage.removeItem = realRemove
    }
  }
})

test('patched notifyUnauthorized routes to the supplied callback (no auth:logout dispatch)', () => {
  __resetApiClientPatchForTests()
  let expiredCount = 0
  installApiClientPatch({
    onAuthExpired: () => {
      expiredCount += 1
    },
  })

  // If a CustomEvent listener accidentally fires we want to know.
  const events: Event[] = []
  const handler = (e: Event) => events.push(e)
  globalThis.addEventListener?.('auth:logout', handler)

  try {
    internal().notifyUnauthorized()
    internal().notifyUnauthorized()
    assert.equal(expiredCount, 2)
    assert.equal(events.length, 0)
  } finally {
    globalThis.removeEventListener?.('auth:logout', handler)
  }
})

test('clearEmbedJwt nulls the in-memory token', () => {
  __resetApiClientPatchForTests()
  installApiClientPatch({ onAuthExpired: () => undefined })
  setEmbedJwt('jwt-ccc')
  clearEmbedJwt()
  assert.equal(internal().authToken, null)
})
