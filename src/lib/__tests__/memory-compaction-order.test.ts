import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMemorySourceIds } from '../memory-source-ids'

test('root source order follows explicit user order rather than numeric identity', () => {
  assert.deepEqual(
    parseMemorySourceIds('9223372036854775807\n2\n9007199254740993', 32),
    ['9223372036854775807', '2', '9007199254740993'],
  )
})
test('ambiguous duplicate, rounded and out-of-bounds identities are rejected', () => {
  for (const input of ['', '2\n2', '01', '9223372036854775808', '1e9', '1.5'])
    assert.throws(() => parseMemorySourceIds(input, 32))
  assert.throws(() => parseMemorySourceIds('3\n2', 1))
})
