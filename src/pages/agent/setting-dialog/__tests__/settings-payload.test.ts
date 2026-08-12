import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAgentSettingsPayload } from '../settings-payload'

test('basic settings map name to title without overwriting hidden settings', () => {
  assert.deepEqual(
    buildAgentSettingsPayload({
      agentId: 'agent-1',
      name: '  Renamed agent  ',
      description: '  Updated description  ',
    }),
    {
      id: 'agent-1',
      title: 'Renamed agent',
      description: 'Updated description',
    },
  )
})

test('basic settings allow clearing the description without inventing hidden values', () => {
  assert.deepEqual(
    buildAgentSettingsPayload({
      agentId: 'agent-2',
      name: 'Agent',
      description: '   ',
    }),
    {
      id: 'agent-2',
      title: 'Agent',
      description: '',
    },
  )
})
