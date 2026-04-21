import assert from 'node:assert/strict'
import test from 'node:test'
import { Position } from '@xyflow/react'
import { Operator } from '../constant'
import useGraphStore from '../store'
import type { RAGFlowNodeType } from '../types'

function createIterationNodes() {
  return [
    {
      id: 'iteration-1',
      type: 'iterationNode',
      position: { x: 120, y: 120 },
      width: 500,
      height: 250,
      data: { label: Operator.Iteration, name: 'Iteration_1', form: {} },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'iteration-start-1',
      type: 'iterationStartNode',
      parentId: 'iteration-1',
      position: { x: 24, y: 108 },
      draggable: false,
      data: {
        label: Operator.IterationStart,
        name: 'Iteration Item',
        form: {},
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'agent-1',
      type: 'agentNode',
      parentId: 'iteration-1',
      position: { x: 200, y: 48 },
      width: 208,
      height: 96,
      data: { label: Operator.Agent, name: 'Agent_1', form: {} },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
  ] as RAGFlowNodeType[]
}

test('iteration drag keeps the start lane fixed and only grows to the right/bottom', () => {
  useGraphStore.setState({
    nodes: createIterationNodes(),
    edges: [],
  })

  useGraphStore.getState().onNodesChange([
    {
      id: 'agent-1',
      type: 'position',
      position: { x: 40, y: 8 },
    },
  ])

  let nodes = useGraphStore.getState().nodes
  let agentNode = nodes.find((node) => node.id === 'agent-1')
  let startNode = nodes.find((node) => node.id === 'iteration-start-1')
  let iterationNode = nodes.find((node) => node.id === 'iteration-1')

  assert.deepEqual(agentNode?.position, { x: 116, y: 24 })
  assert.deepEqual(startNode?.position, { x: 24, y: 108 })
  assert.equal(iterationNode?.width, 500)
  assert.equal(iterationNode?.height, 250)

  useGraphStore.getState().onNodesChange([
    {
      id: 'agent-1',
      type: 'position',
      position: { x: 292, y: 154 },
    },
  ])

  nodes = useGraphStore.getState().nodes
  agentNode = nodes.find((node) => node.id === 'agent-1')
  startNode = nodes.find((node) => node.id === 'iteration-start-1')
  iterationNode = nodes.find((node) => node.id === 'iteration-1')

  assert.deepEqual(agentNode?.position, { x: 292, y: 154 })
  assert.deepEqual(startNode?.position, { x: 24, y: 108 })
  assert.equal(iterationNode?.width, 560)
  assert.equal(iterationNode?.height, 310)
})
