import {
  homeMessageIdentity,
  resolveHomeModelIdentity,
} from '../model-identity'
import type { MyLLMProvider } from '@/stores/model'
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
        label: 'bound-model',
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

const providers: MyLLMProvider = {
  OpenAI: {
    tags: 'chat',
    llm: [
      {
        id: 117,
        name: 'gpt-test',
        label: 'gpt-test',
        type: 'chat',
        status: '0',
        used_token: 0,
      },
    ],
  },
  DeepSeek: {
    tags: 'chat',
    llm: [{ id: 118, name: 'deepseek-test', type: 'chat', used_token: 0 }],
  },
}
test('numeric model references capture a readable identity without changing submitted IDs', () => {
  const resources = getHomeContextResources({
    selectedModelId: '117',
    selectedMCPIds: [],
    modelProviders: providers,
  })
  assert.equal(resources[0].id, '117')
  assert.equal(resources[0].label, 'gpt-test')
  assert.equal(resources[0].provider, 'OpenAI')
  const turn = createHomeTurn({
    content: 'Hello',
    scope: { identity: 'owner', threadId: 'thread' },
    resources,
  })
  assert.deepEqual(
    homeMessageIdentity(turn.assistantMessage.contextManifest, {}, '118'),
    { label: 'gpt-test', provider: 'OpenAI' },
  )
})
test('old numeric snapshots resolve by message reference rather than the current selection', () => {
  const turn = createHomeTurn({
    content: 'Hello',
    scope: { identity: 'owner', threadId: 'thread' },
    resources: [
      {
        kind: 'model',
        id: '117',
        label: '117',
        origin: 'turn',
        availability: 'unknown',
      },
    ],
  })
  assert.deepEqual(
    homeMessageIdentity(
      turn.assistantMessage.contextManifest,
      providers,
      '118',
    ),
    { label: 'gpt-test', provider: 'OpenAI' },
  )
  assert.deepEqual(
    homeMessageIdentity(turn.assistantMessage.contextManifest, {}, '118'),
    { label: undefined, provider: undefined },
  )
  assert.deepEqual(resolveHomeModelIdentity(providers, 'gpt-test@OpenAI'), {
    label: 'gpt-test',
    provider: 'OpenAI',
  })
})
