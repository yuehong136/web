import assert from 'node:assert/strict'
import test from 'node:test'
import { extractSessionStatus } from '../session'
import { buildRuntimeThoughtChainNodes } from '../../features/runtime-workbench/thought-chain-utils'

test('saved strict failure is an error even with a Begin prologue and no session.errors', () => {
  const dsl = {
    path: ['begin', 'ListOperations:list'],
    components: {
      begin: { obj: { component_name: 'Begin', params: {} } },
      'ListOperations:list': {
        obj: {
          component_name: 'ListOperations',
          params: {
            outputs: { _ERROR: { value: 'strict failure', type: 'str' } },
          },
        },
      },
    },
  }
  for (const value of [dsl, JSON.stringify(dsl)]) {
    assert.equal(
      extractSessionStatus({
        id: 'strict',
        dsl: value,
        messages: [
          { role: 'assistant', content: 'prologue' },
          { role: 'user', content: 'run' },
        ],
      }),
      'error',
    )
  }
})

test('message errors take precedence over nonempty display content', () => {
  assert.equal(
    extractSessionStatus({
      id: 'strict',
      messages: [
        {
          role: 'assistant',
          content: 'The run failed.',
          error: 'The run failed.',
        },
      ],
    }),
    'error',
  )
})

test('lenient empty output stays successful and unexecuted errors are ignored', () => {
  assert.equal(
    extractSessionStatus({
      id: 'empty',
      messages: [{ role: 'assistant', content: '[]' }],
      dsl: {
        path: ['begin'],
        components: {
          begin: { obj: { component_name: 'Begin', params: {} } },
          unused: {
            obj: {
              component_name: 'ListOperations',
              params: { outputs: { _ERROR: { value: 'old' } } },
            },
          },
        },
      },
    }),
    'success',
  )
})

test('terminal error without message/component ID is retained after completed Begin', () => {
  const nodes = buildRuntimeThoughtChainNodes(
    [
      {
        event: 'node_started',
        data: { component_id: 'begin', component_name: 'Begin' },
      },
      { event: 'node_finished', data: { component_id: 'begin' } },
      { event: 'error', data: { error: 'The run failed.' } },
    ],
    false,
  )
  assert.equal(
    nodes.find((node) => node.eventName === 'error')?.status,
    'error',
  )
  assert.equal(
    nodes.find((node) => node.componentId === 'begin')?.status,
    'success',
  )
})
