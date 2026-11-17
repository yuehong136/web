import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EdgeChangeset,
  NodeChangeset,
  Position,
  type Edge,
} from '@xyflow/react'
import { Operator } from '../constant'
import useGraphStore from '../store'
import type { RAGFlowNodeType } from '../types'

// xyflow 13 hands `onNodesChange` / `onEdgesChange` a changeset instead of an
// array. These cases pin the store to the interactions the canvas relies on.

function node(
  id: string,
  extra: Partial<RAGFlowNodeType> = {},
): RAGFlowNodeType {
  return {
    id,
    type: 'agentNode',
    position: { x: 0, y: 0 },
    data: { label: Operator.Agent, name: id, form: {} },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    ...extra,
  } as RAGFlowNodeType
}

function edge(id: string, source: string, target: string): Edge {
  return { id, source, target, type: 'buttonEdge' }
}

function reset() {
  useGraphStore.setState({
    nodes: [node('a'), node('b', { position: { x: 300, y: 0 } })],
    edges: [edge('a-b', 'a', 'b')],
  })
}

test('node changesets move, select, measure and remove nodes', () => {
  reset()
  const changes = new NodeChangeset<RAGFlowNodeType>([
    { id: 'a', type: 'position', position: { x: 40, y: 20 }, dragging: true },
    { id: 'a', type: 'select', selected: true },
    {
      id: 'b',
      type: 'dimensions',
      dimensions: { width: 208, height: 96 },
    },
  ])
  useGraphStore.getState().onNodesChange(changes)

  let [a, b] = useGraphStore.getState().nodes
  assert.deepEqual(a.position, { x: 40, y: 20 })
  assert.equal(a.dragging, true)
  assert.equal(a.selected, true)
  assert.deepEqual(b.measured, { width: 208, height: 96 })

  useGraphStore
    .getState()
    .onNodesChange(new NodeChangeset([{ id: 'b', type: 'remove' }]))
  ;[a, b] = useGraphStore.getState().nodes
  assert.equal(a.id, 'a')
  assert.equal(b, undefined)
})

test('node changesets keep unchanged nodes by reference', () => {
  reset()
  const before = useGraphStore.getState().nodes
  useGraphStore
    .getState()
    .onNodesChange(
      new NodeChangeset([{ id: 'a', type: 'select', selected: true }]),
    )
  const after = useGraphStore.getState().nodes
  assert.notEqual(after[0], before[0])
  assert.equal(after[1], before[1])
})

test('edge changesets select and remove edges', () => {
  reset()
  useGraphStore
    .getState()
    .onEdgesChange(
      new EdgeChangeset([{ id: 'a-b', type: 'select', selected: true }]),
    )
  assert.equal(useGraphStore.getState().edges[0].selected, true)

  useGraphStore
    .getState()
    .onEdgesChange(new EdgeChangeset([{ id: 'a-b', type: 'remove' }]))
  assert.deepEqual(useGraphStore.getState().edges, [])
})

test('the iteration start node ignores drags inside its container', () => {
  useGraphStore.setState({
    nodes: [
      node('iteration', {
        type: 'iterationNode',
        width: 500,
        height: 250,
        data: { label: Operator.Iteration, name: 'Iteration', form: {} },
      }),
      node('start', {
        type: 'iterationStartNode',
        parentId: 'iteration',
        position: { x: 24, y: 108 },
        data: { label: Operator.IterationStart, name: 'Start', form: {} },
      }),
    ],
    edges: [],
  })
  useGraphStore
    .getState()
    .onNodesChange(
      new NodeChangeset([
        { id: 'start', type: 'position', position: { x: 200, y: 10 } },
      ]),
    )
  const start = useGraphStore.getState().nodes.find((n) => n.id === 'start')
  assert.deepEqual(start?.position, { x: 24, y: 108 })
})
