import assert from 'node:assert/strict'
import test from 'node:test'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'
import {
  createHomeTurn,
  getHomeContextResources,
} from '@/pages/home/utils/home-context'

const app = {
  id: 'app-a',
  name: 'Research assistant',
  llm_id: 'bound-model@provider',
  dataset_ids: ['kb-a'],
  kb_ids: ['legacy-kb'],
  kb_names: ['Research sources'],
} as DialogApp

test('app mode records inherited settings and excludes unsent free model/MCP choices', () => {
  const resources = getHomeContextResources({
    selectedApp: app,
    selectedModelId: 'unsent-free-model',
    selectedMCPIds: ['unsent-tool'],
  })
  assert.deepEqual(
    resources.map(({ kind, id, label, origin }) => ({
      kind,
      id,
      label,
      origin,
    })),
    [
      { kind: 'app', id: 'app-a', label: 'Research assistant', origin: 'turn' },
      {
        kind: 'model',
        id: 'bound-model@provider',
        label: 'bound-model@provider',
        origin: 'inherited',
      },
      {
        kind: 'knowledgeBase',
        id: 'kb-a',
        label: 'Research sources',
        origin: 'inherited',
      },
    ],
  )
  assert.ok(resources.every((resource) => resource.availability === 'unknown'))
})

test('explicitly empty knowledge scope stays empty and absent bindings are not invented', () => {
  const resources = getHomeContextResources({
    selectedApp: { ...app, llm_id: '', dataset_ids: [] },
    selectedModelId: 'unsent-free-model',
    selectedMCPIds: ['unsent-tool'],
  })
  assert.deepEqual(
    resources.map((resource) => resource.kind),
    ['app'],
  )
})

test('MCP mode labels only submitted server IDs and never infers cached tool availability', () => {
  const resources = getHomeContextResources({
    selectedModelId: 'chosen-model',
    selectedMCPIds: ['server-a', 'server-b'],
    selectedMCPServers: [
      {
        id: 'server-a',
        name: 'Named server',
        variables: { tools: { cached: {} } },
      },
      { id: 'not-submitted', name: 'Other server' },
    ] as MCPServer[],
  })
  assert.deepEqual(
    resources.map((resource) => [
      resource.id,
      resource.label,
      resource.availability,
    ]),
    [
      ['chosen-model', 'chosen-model', 'unknown'],
      ['server-a', 'Named server', 'unknown'],
      ['server-b', 'server-b', 'unknown'],
    ],
  )
})

test('one immutable submission snapshot belongs to both messages and survives later selection changes', () => {
  const resources = getHomeContextResources({
    selectedApp: app,
    selectedModelId: '',
    selectedMCPIds: [],
  })
  const scope = { identity: 'user-a:tenant-a', threadId: 'conversation-a' }
  const { userMessage, assistantMessage } = createHomeTurn({
    content: ' Question ',
    scope,
    resources,
  })
  resources[0] = { ...resources[0], label: 'Changed selection' }
  scope.identity = 'user-b:tenant-b'
  assert.equal(userMessage.content, 'Question')
  assert.notEqual(userMessage.id, assistantMessage.id)
  assert.equal(userMessage.contextManifest, assistantMessage.contextManifest)
  assert.equal(userMessage.contextManifest?.stage, 'submitted')
  assert.equal(userMessage.contextManifest?.scope.identity, 'user-a:tenant-a')
  assert.equal(
    userMessage.contextManifest?.resources[0].label,
    'Research assistant',
  )
  assert.ok(Object.isFrozen(userMessage.contextManifest))
  assert.ok(Object.isFrozen(userMessage.contextManifest?.resources[0]))
  // The server receives no display metadata.
  assert.deepEqual(
    [userMessage].map(({ role, content }) => ({ role, content })),
    [{ role: 'user', content: 'Question' }],
  )
})
