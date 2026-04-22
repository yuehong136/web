import assert from 'node:assert/strict'
import test from 'node:test'
import { NodeHandleId } from '../../constant'
import {
  canStartConnectionDrag,
  hasValidHandleDirection,
} from '../connection-handles'

test('canStartConnectionDrag only allows source handles', () => {
  assert.equal(canStartConnectionDrag('source'), true)
  assert.equal(canStartConnectionDrag('target'), false)
  assert.equal(canStartConnectionDrag(null), false)
})

test('hasValidHandleDirection enforces ragflow default handle direction', () => {
  assert.equal(
    hasValidHandleDirection({
      sourceHandle: NodeHandleId.Start,
      targetHandle: NodeHandleId.End,
    }),
    true,
  )

  assert.equal(
    hasValidHandleDirection({
      sourceHandle: NodeHandleId.End,
      targetHandle: NodeHandleId.End,
    }),
    false,
  )

  assert.equal(
    hasValidHandleDirection({
      sourceHandle: NodeHandleId.Start,
      targetHandle: NodeHandleId.Start,
    }),
    false,
  )
})
