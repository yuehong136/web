import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ChannelBinding } from '@/api/channel'
import { isBindingRevisionStale } from '../utils'

const binding = (overrides: Partial<ChannelBinding> = {}): ChannelBinding => ({
  target_type: 'multirag.canvas_agent',
  target_id: 'agent-1',
  target_revision_id: 'revision-1',
  policy: { private_chat_only: true },
  enabled: true,
  ...overrides,
})

test('a stale bound release warns even while the runner is connected', () => {
  assert.equal(isBindingRevisionStale(binding({ revision_stale: true })), true)
})

test('a current release does not warn', () => {
  assert.equal(
    isBindingRevisionStale(binding({ revision_stale: false })),
    false,
  )
})

test('an unresolved or absent flag never invents a warning', () => {
  // Mutation responses and dialog targets carry null, older servers omit it.
  assert.equal(isBindingRevisionStale(binding({ revision_stale: null })), false)
  assert.equal(isBindingRevisionStale(binding()), false)
  assert.equal(isBindingRevisionStale(null), false)
  assert.equal(isBindingRevisionStale(undefined), false)
})
