import assert from 'node:assert/strict'
import test from 'node:test'
import { Position } from '@xyflow/react'
import { NodeHandleId, Operator, SwitchElseTo } from '../constant'
import useGraphStore from '../store'
import type { RAGFlowNodeType } from '../types'

function createSwitchNodes() {
  return [
    {
      id: 'switch-1',
      type: 'switchNode',
      position: { x: 120, y: 120 },
      data: {
        label: Operator.Switch,
        name: 'Switch_1',
        form: {
          conditions: [
            {
              logical_operator: 'and',
              items: [{ operator: '=' }],
              to: [],
            },
          ],
          [SwitchElseTo]: [],
        },
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'message-1',
      type: 'messageNode',
      position: { x: 420, y: 120 },
      data: {
        label: Operator.Message,
        name: 'Message_1',
        form: { content: ['done'] },
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'placeholder-1',
      type: 'placeholderNode',
      position: { x: 420, y: 260 },
      data: {
        label: Operator.Placeholder,
        name: 'Placeholder_1',
        form: {},
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
    },
  ] as RAGFlowNodeType[]
}

test('switch form targets ignore placeholder nodes during connect and disconnect', () => {
  useGraphStore.setState({
    nodes: createSwitchNodes(),
    edges: [],
  })

  useGraphStore.getState().updateSwitchFormData(
    'switch-1',
    'Case 1',
    'placeholder-1',
    true,
  )
  useGraphStore.getState().updateSwitchFormData(
    'switch-1',
    SwitchElseTo,
    'placeholder-1',
    true,
  )

  let switchNode = useGraphStore.getState().getNode('switch-1')
  let form = (switchNode?.data.form || {}) as Record<string, unknown>

  assert.deepEqual(
    ((form.conditions as Array<Record<string, unknown>>)[0]?.to as unknown[]) || [],
    [],
  )
  assert.deepEqual((form[SwitchElseTo] as unknown[]) || [], [])

  useGraphStore.setState({
    nodes: createSwitchNodes(),
    edges: [
      {
        id: 'edge-case',
        source: 'switch-1',
        target: 'placeholder-1',
        sourceHandle: 'Case 1',
        targetHandle: NodeHandleId.End,
      },
      {
        id: 'edge-else',
        source: 'switch-1',
        target: 'placeholder-1',
        sourceHandle: SwitchElseTo,
        targetHandle: NodeHandleId.End,
      },
      {
        id: 'edge-valid',
        source: 'switch-1',
        target: 'message-1',
        sourceHandle: 'Case 1',
        targetHandle: NodeHandleId.End,
      },
    ],
  })

  useGraphStore.getState().updateSwitchFormData(
    'switch-1',
    'Case 1',
    'message-1',
    false,
  )

  switchNode = useGraphStore.getState().getNode('switch-1')
  form = (switchNode?.data.form || {}) as Record<string, unknown>

  assert.deepEqual(
    ((form.conditions as Array<Record<string, unknown>>)[0]?.to as unknown[]) || [],
    [],
  )
})
