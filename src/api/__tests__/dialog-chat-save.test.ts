import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { defaultChatSettings } from '@/components/chat/chat-settings.constants'
import type { ChatSettings } from '@/components/chat/chat-settings.types'
import { settingsToDialogUpdate } from '@/hooks/chat-settings-payload'
import zhCN from '@/locales/zh-CN/chat'
import { createInitialConfig } from '@/pages/studio/create-app/constants'
import {
  normalizeDialogConfig,
  normalizeDialogSearchMode,
} from '@/pages/studio/create-app/data'
import { buildChatSaveRequest } from '@/pages/studio/create-app/save-payload'
import type { AppConfig } from '@/pages/studio/create-app/types'
import { dialogAPI } from '../dialog'

const knowledgeBlock = zhCN.chat.knowledgePrompt.block

interface ChatRequestBody {
  dataset_ids: string[]
  search_mode?: unknown
  llm_setting: unknown
  prompt_config: {
    system: string
    parameters: { key: string; optional: boolean }[]
    empty_response: string
  }
}

interface ChatCall {
  method: string | undefined
  url: URL
  body: ChatRequestBody
}

const mockChatsEndpoint = (
  t: TestContext,
  echoSearchMode: unknown = { type: 'dense' },
) => {
  const calls: ChatCall[] = []
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({
      method: init.method,
      url: new URL(url),
      body: JSON.parse(String(init.body)) as ChatRequestBody,
    })
    return new Response(
      JSON.stringify({
        code: 0,
        data: {
          id: 'chat-1',
          dataset_ids: ['kb-1'],
          search_mode: echoSearchMode,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  })
  return calls
}

const studioConfig = (overrides: Partial<AppConfig> = {}): AppConfig => ({
  ...createInitialConfig({ name: 'Support Bot' }),
  llm_id: 'qwen-plus@Tongyi-Qianwen',
  ...overrides,
})

test('a new Studio app with a dataset is created with a retrievable prompt and the documented search mode', async (t) => {
  const calls = mockChatsEndpoint(t)

  await dialogAPI.createChat(
    buildChatSaveRequest(studioConfig({ kb_ids: ['kb-1'] }), knowledgeBlock),
  )

  assert.equal(calls.length, 1)
  const [{ method, url, body }] = calls
  assert.equal(method, 'POST')
  assert.equal(url.pathname, '/api/v1/chats')
  assert.deepEqual(body.dataset_ids, ['kb-1'])
  assert.deepEqual(body.search_mode, { type: 'dense' })
  assert.ok(body.prompt_config.system.includes('{knowledge}'))
  assert.ok(body.prompt_config.system.endsWith(knowledgeBlock))
  assert.deepEqual(body.prompt_config.parameters, [
    { key: 'knowledge', optional: false },
  ])
  assert.equal(body.prompt_config.empty_response, '抱歉，我无法回答这个问题。')
  assert.equal('kb_ids' in body, false)
})

test('hybrid weights are sent as the documented shape and read back from the response', async (t) => {
  const searchMode = {
    type: 'hybrid' as const,
    weight_dense: 0.6,
    weight_sparse: 0.4,
  }
  const calls = mockChatsEndpoint(t, searchMode)

  const chat = await dialogAPI.updateChat(
    'chat-1',
    buildChatSaveRequest(
      studioConfig({ kb_ids: ['kb-1'], search_mode: searchMode }),
      knowledgeBlock,
    ),
  )

  const [{ method, url, body }] = calls
  assert.equal(method, 'PUT')
  assert.equal(url.pathname, '/api/v1/chats/chat-1')
  assert.deepEqual(body.search_mode, searchMode)
  assert.deepEqual(normalizeDialogSearchMode(chat.search_mode), searchMode)
})

test('an app without retrieval sources drops the knowledge block and parameter', async (t) => {
  const calls = mockChatsEndpoint(t)
  const initial = studioConfig()

  await dialogAPI.createChat(
    buildChatSaveRequest(
      {
        ...initial,
        systemPrompt: `${initial.systemPrompt}\n\n${knowledgeBlock}`,
        prompt_config: {
          ...initial.prompt_config,
          parameters: [
            { key: 'knowledge', optional: false },
            { key: 'user', optional: true },
          ],
        },
      },
      knowledgeBlock,
    ),
  )

  const [{ body }] = calls
  assert.deepEqual(body.dataset_ids, [])
  assert.equal(body.prompt_config.system, initial.systemPrompt)
  assert.deepEqual(body.prompt_config.parameters, [
    { key: 'user', optional: true },
  ])
  assert.equal(body.prompt_config.empty_response, '')
})

test('an app opened from the create dialog saves llm_setting as an object', async (t) => {
  const calls = mockChatsEndpoint(t)
  // The create dialog stores `llm_setting: {}`, so every generation switch loads disabled.
  const { config } = normalizeDialogConfig({
    name: 'Support Bot',
    llm_id: 'qwen-plus@Tongyi-Qianwen',
    llm_setting: {},
    kb_ids: ['kb-1'],
    prompt_config: { system: '你是一个智能助手，请提供有帮助的回答。' },
  })

  await dialogAPI.updateChat(
    'chat-1',
    buildChatSaveRequest(config, knowledgeBlock),
  )

  assert.deepEqual(calls[0].body.llm_setting, {})
  assert.ok(calls[0].body.prompt_config.system.endsWith(knowledgeBlock))
})

// The Explore chat settings panel after loading a chat without retrieval.
const exploreSettings = (
  overrides: Partial<ChatSettings> = {},
): ChatSettings => ({
  ...defaultChatSettings,
  name: 'Support Bot',
  systemPrompt: '你是一个智能助手，请提供有帮助的回答。',
  ...overrides,
})

const saveExploreSettings = (settings: ChatSettings) =>
  dialogAPI.updateChat(
    'chat-1',
    settingsToDialogUpdate(settings, knowledgeBlock),
  )

test('Explore settings that attach a dataset PUT a retrievable prompt', async (t) => {
  const calls = mockChatsEndpoint(t)
  const settings = exploreSettings({
    kbIds: ['kb-1'],
    variables: [
      { key: 'user', optional: true },
      { key: '', optional: false },
    ],
  })

  await saveExploreSettings(settings)

  assert.equal(calls.length, 1)
  const [{ method, url, body }] = calls
  assert.equal(method, 'PUT')
  assert.equal(url.pathname, '/api/v1/chats/chat-1')
  assert.deepEqual(body.dataset_ids, ['kb-1'])
  assert.equal(
    body.prompt_config.system,
    `${settings.systemPrompt}\n\n${knowledgeBlock}`,
  )
  assert.deepEqual(body.prompt_config.parameters, [
    { key: 'user', optional: true },
    { key: 'knowledge', optional: false },
  ])
})

test('Explore settings with only a Tavily key PUT a retrievable prompt', async (t) => {
  const calls = mockChatsEndpoint(t)

  await saveExploreSettings(exploreSettings({ tavilyApiKey: 'tvly-key' }))

  const [{ body }] = calls
  assert.deepEqual(body.dataset_ids, [])
  assert.ok(body.prompt_config.system.endsWith(knowledgeBlock))
  assert.deepEqual(body.prompt_config.parameters, [
    { key: 'knowledge', optional: false },
  ])
})

test('Explore settings keep an existing placeholder and knowledge variable as written', async (t) => {
  const calls = mockChatsEndpoint(t)

  await saveExploreSettings(
    exploreSettings({
      kbIds: ['kb-1'],
      systemPrompt: 'Answer only from {knowledge}.',
      variables: [{ key: 'knowledge', optional: true }],
    }),
  )

  const [{ body }] = calls
  assert.equal(body.prompt_config.system, 'Answer only from {knowledge}.')
  assert.deepEqual(body.prompt_config.parameters, [
    { key: 'knowledge', optional: true },
  ])
})

test('Explore settings without retrieval sources PUT the prompt and variables as edited', async (t) => {
  const calls = mockChatsEndpoint(t)
  // Unlike Studio, Explore keeps a block left over from an earlier retrieval save.
  const systemPrompt = `Be brief.\n\n${knowledgeBlock}`

  await saveExploreSettings(
    exploreSettings({
      systemPrompt,
      variables: [
        { key: 'knowledge', optional: false },
        { key: 'user', optional: true },
      ],
    }),
  )

  const [{ body }] = calls
  assert.deepEqual(body.dataset_ids, [])
  assert.equal(body.prompt_config.system, systemPrompt)
  assert.deepEqual(body.prompt_config.parameters, [
    { key: 'knowledge', optional: false },
    { key: 'user', optional: true },
  ])
})
