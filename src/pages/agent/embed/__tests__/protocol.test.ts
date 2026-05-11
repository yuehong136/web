import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EMBED_PROTOCOL_VERSION,
  isEmbedInbound,
  makeOutbound,
} from '../protocol'

test('EMBED_PROTOCOL_VERSION is the literal 1 (changing this breaks host SDKs)', () => {
  assert.equal(EMBED_PROTOCOL_VERSION, 1)
})

test('isEmbedInbound accepts a well-formed embed-init', () => {
  assert.equal(isEmbedInbound({ v: 1, type: 'embed-init', jwt: 'abc' }), true)
  assert.equal(
    isEmbedInbound({
      v: 1,
      type: 'embed-init',
      jwt: 'abc',
      theme: 'dark',
      locale: 'zh-CN',
    }),
    true,
  )
})

test('isEmbedInbound rejects embed-init with empty jwt', () => {
  assert.equal(isEmbedInbound({ v: 1, type: 'embed-init', jwt: '' }), false)
  assert.equal(isEmbedInbound({ v: 1, type: 'embed-init' }), false)
})

test('isEmbedInbound rejects embed-init with invalid theme/locale', () => {
  assert.equal(
    isEmbedInbound({
      v: 1,
      type: 'embed-init',
      jwt: 'abc',
      theme: 'midnight',
    }),
    false,
  )
  assert.equal(
    isEmbedInbound({
      v: 1,
      type: 'embed-init',
      jwt: 'abc',
      locale: 'fr-FR',
    }),
    false,
  )
})

test('isEmbedInbound accepts auth-refreshed, set-theme, set-locale, trigger-save', () => {
  assert.equal(
    isEmbedInbound({ v: 1, type: 'auth-refreshed', jwt: 'xyz' }),
    true,
  )
  assert.equal(
    isEmbedInbound({ v: 1, type: 'set-theme', theme: 'light' }),
    true,
  )
  assert.equal(
    isEmbedInbound({ v: 1, type: 'set-locale', locale: 'en-US' }),
    true,
  )
  assert.equal(isEmbedInbound({ v: 1, type: 'trigger-save' }), true)
})

test('isEmbedInbound rejects mismatched version', () => {
  assert.equal(isEmbedInbound({ v: 2, type: 'embed-init', jwt: 'abc' }), false)
  assert.equal(isEmbedInbound({ v: 0, type: 'trigger-save' }), false)
  assert.equal(isEmbedInbound({ type: 'trigger-save' }), false)
})

test('isEmbedInbound rejects unknown types and outbound types', () => {
  assert.equal(isEmbedInbound({ v: 1, type: 'unknown' }), false)
  // Outbound types must never be accepted as inbound — they originate from
  // the iframe, not the host.
  assert.equal(isEmbedInbound({ v: 1, type: 'ready' }), false)
  assert.equal(
    isEmbedInbound({ v: 1, type: 'save-success', agentId: 'a', title: 't' }),
    false,
  )
})

test('isEmbedInbound rejects non-objects', () => {
  assert.equal(isEmbedInbound(null), false)
  assert.equal(isEmbedInbound(undefined), false)
  assert.equal(isEmbedInbound('embed-init'), false)
  assert.equal(isEmbedInbound(42), false)
  assert.equal(isEmbedInbound([1, 2, 3]), false)
})

test('makeOutbound injects the protocol version', () => {
  assert.deepEqual(makeOutbound({ type: 'ready' }), {
    v: 1,
    type: 'ready',
  })
  assert.deepEqual(makeOutbound({ type: 'resize', height: 720 }), {
    v: 1,
    type: 'resize',
    height: 720,
  })
})
