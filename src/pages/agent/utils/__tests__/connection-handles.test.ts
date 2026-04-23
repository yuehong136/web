import assert from 'node:assert/strict'
import test from 'node:test'
import { Position } from '@xyflow/react'
import { NodeHandleId, RewriteQuestionHandleId } from '../../constant'
import {
  canOpenHandleDropdown,
  canStartConnectionDrag,
  getConnectionStartPosition,
  hasValidHandleDirection,
  isPipelineHandleConnectable,
  violatesPipelineSingleConnection,
} from '../connection-handles'

test('canStartConnectionDrag only allows source handles', () => {
  assert.equal(canStartConnectionDrag('source'), true)
  assert.equal(canStartConnectionDrag('target'), false)
  assert.equal(canStartConnectionDrag(null), false)
})

test('getConnectionStartPosition preserves rewrite-question left handle direction', () => {
  assert.equal(
    getConnectionStartPosition(RewriteQuestionHandleId.Left),
    Position.Left,
  )
  assert.equal(
    getConnectionStartPosition(RewriteQuestionHandleId.Right),
    Position.Right,
  )
  assert.equal(getConnectionStartPosition(NodeHandleId.Start), Position.Right)
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

test('hasValidHandleDirection allows ragflow rewrite-question loose handles', () => {
  assert.equal(
    hasValidHandleDirection({
      sourceHandle: NodeHandleId.Start,
      targetHandle: RewriteQuestionHandleId.Left,
    }),
    true,
  )

  assert.equal(
    hasValidHandleDirection({
      sourceHandle: RewriteQuestionHandleId.Right,
      targetHandle: NodeHandleId.End,
    }),
    true,
  )
})

test('isPipelineHandleConnectable only closes connected pipeline end handles', () => {
  assert.equal(
    isPipelineHandleConnectable({
      isPipeline: true,
      handleType: 'target',
      hasDownstreamConnection: false,
      hasUpstreamConnection: true,
    }),
    false,
  )

  assert.equal(
    isPipelineHandleConnectable({
      isPipeline: true,
      handleType: 'source',
      hasDownstreamConnection: true,
      hasUpstreamConnection: false,
    }),
    true,
  )
})

test('canOpenHandleDropdown keeps connected pipeline source handles closed on click', () => {
  assert.equal(
    canOpenHandleDropdown({
      isPipeline: true,
      handleType: 'source',
      hasDownstreamConnection: true,
      hasUpstreamConnection: false,
    }),
    false,
  )

  assert.equal(
    canOpenHandleDropdown({
      isPipeline: true,
      handleType: 'target',
      hasDownstreamConnection: false,
      hasUpstreamConnection: false,
    }),
    true,
  )
})

test('violatesPipelineSingleConnection enforces single-in single-out in pipeline', () => {
  assert.equal(
    violatesPipelineSingleConnection({
      isPipeline: true,
      sourceHasDownstreamConnection: true,
      targetHasUpstreamConnection: false,
    }),
    true,
  )

  assert.equal(
    violatesPipelineSingleConnection({
      isPipeline: true,
      sourceHasDownstreamConnection: false,
      targetHasUpstreamConnection: true,
    }),
    true,
  )

  assert.equal(
    violatesPipelineSingleConnection({
      isPipeline: true,
      sourceHasDownstreamConnection: false,
      targetHasUpstreamConnection: false,
    }),
    false,
  )
})
