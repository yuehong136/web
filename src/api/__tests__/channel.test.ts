import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildChannelMutationPayload,
  channelAPI,
  channelErrorMessageKey,
  CHANNEL_ERROR_CODES,
  RUNTIME_STATES,
  type ChannelFormInput,
  type ChannelProviderManifest,
} from '../channel'
import {
  isBindingRevisionStale,
  isRuntimeHealthy,
} from '@/pages/settings/channels/utils'
import { apiClient, type RequestConfig } from '../client'
import { channelKeys, saveChannel } from '@/hooks/use-channel-request'
import {
  createChannelFormSchema,
  getChannelFormDefaults,
  getLatestReleasedRevision,
  getProviderFields,
  isPublishedAgent,
  resolveCanvasRevisionGuard,
} from '@/pages/settings/channels/form-model'

const baseInput: ChannelFormInput = {
  name: ' Leadership demo ',
  provider: 'feishu',
  config: {
    app_id: ' cli_xxx ',
    domain: ' feishu ',
    allowed_open_ids: 'ou_1\nou_2, ou_1',
  },
  secrets: { app_secret: '' },
  listFields: new Set(['allowed_open_ids']),
  targetType: 'multirag.canvas_agent',
  targetId: ' agent_1 ',
  targetRevisionId: 'revision_1',
  privateChatOnly: true,
  bindingEnabled: true,
}

test('update serializer preserves an existing secret when the field is blank', () => {
  const payload = buildChannelMutationPayload(baseInput, 'update')

  assert.equal('channel' in payload.connection, false)
  assert.deepEqual(payload.connection.config.credential, {
    app_id: 'cli_xxx',
  })
  assert.equal('secret' in payload.connection, false)
  assert.equal('app_secret' in payload.connection, false)
  assert.equal('app_secret' in payload.connection.config.credential, false)
  assert.deepEqual(payload.connection.config.allowed_open_ids, ['ou_1', 'ou_2'])
  assert.equal(payload.binding.target_type, 'multirag.canvas_agent')
  assert.equal(payload.binding.target_revision_id, 'revision_1')
  assert.equal(payload.binding.enabled, true)
})

test('create serializer nests credentials and never sends a top-level secret', () => {
  const payload = buildChannelMutationPayload(
    { ...baseInput, secrets: { app_secret: ' new-secret ' } },
    'create',
  )

  assert.equal(payload.connection.channel, 'feishu')
  assert.deepEqual(payload.connection.config, {
    credential: { app_id: 'cli_xxx', app_secret: 'new-secret' },
    domain: 'feishu',
    allowed_open_ids: ['ou_1', 'ou_2'],
  })
  assert.equal('secret' in payload.connection, false)
})

test('nested provider schema is flattened for the Feishu form only', () => {
  const manifest: ChannelProviderManifest = {
    provider: 'feishu',
    display_name: 'Feishu',
    capabilities: {},
    config_schema: {
      properties: {
        credential: { $ref: '#/$defs/FeishuCredentialInput' },
        domain: { type: 'string', default: 'lark' },
        allowed_open_ids: { type: 'array', items: { type: 'string' } },
      },
      $defs: {
        FeishuCredentialInput: {
          type: 'object',
          properties: {
            app_id: { type: 'string', title: 'App ID' },
            app_secret: {
              type: 'string',
              title: 'App Secret',
              writeOnly: true,
            },
          },
        },
      },
    },
  }
  const fields = getProviderFields(manifest)

  assert.equal(
    fields.find((field) => field.key === 'app_secret')?.kind,
    'secret',
  )
  assert.equal(
    fields.find((field) => field.key === 'allowed_open_ids')?.kind,
    'string_list',
  )

  const defaults = getChannelFormDefaults(manifest, {
    id: 'channel_1',
    name: 'Demo',
    channel: 'feishu',
    config: {
      credential: {
        app_id: 'cli_xxx',
        app_secret: 'must-not-reach-form',
      },
      domain: 'lark',
    },
    status: 0,
    generation: 1,
    secret: { configured: true, version: 2 },
    binding: null,
  })
  assert.equal(defaults.config.app_id, 'cli_xxx')
  assert.equal(defaults.config.domain, 'lark')
  assert.equal(defaults.secrets.app_secret, '')
})

test('canvas binding requires a concrete released revision and dialog clears it', () => {
  const schema = createChannelFormSchema(
    {
      provider: 'feishu',
      display_name: 'Feishu',
      capabilities: {},
      config_schema: {},
    },
    true,
    'required',
  )
  const values = {
    name: 'Demo',
    provider: 'feishu',
    config: { app_id: 'cli_xxx', domain: 'feishu', allowed_open_ids: '' },
    secrets: { app_secret: '' },
    targetType: 'multirag.canvas_agent' as const,
    targetId: 'agent_1',
    targetRevisionId: '',
    privateChatOnly: true,
  }

  assert.equal(schema.safeParse(values).success, false)
  assert.equal(
    schema.safeParse({ ...values, targetRevisionId: 'revision_1' }).success,
    true,
  )
  assert.equal(
    schema.safeParse({
      ...values,
      targetType: 'multirag.dialog',
      targetRevisionId: 'revision_1',
    }).success,
    false,
  )
})

test('latest revision selection ignores drafts and adapter fallback ids', () => {
  const latest = getLatestReleasedRevision([
    { id: 'draft_1', release: false },
    { id: 'version-1', release: true },
    { id: 'released_1', release: true, create_time: 200 },
    { id: 'released_2', release: true, create_time: 100 },
    { id: 'released_0', release: true, create_time: 300 },
  ])

  assert.equal(latest?.id, 'released_0')
})

test('published Agent detection follows release timestamps used by list APIs', () => {
  assert.equal(isPublishedAgent({ release_time: 123 }), true)
  assert.equal(isPublishedAgent({ last_publish_time: 123 }), true)
  assert.equal(isPublishedAgent({ release: true }), true)
  assert.equal(isPublishedAgent({}), false)
})

test('revision guard never silently replaces an existing binding', () => {
  const latest = { id: 'revision_latest', release: true }
  assert.equal(resolveCanvasRevisionGuard('', latest), 'revision_latest')
  assert.equal(
    resolveCanvasRevisionGuard('revision_stale', latest),
    'revision_stale',
  )
})

test('save creates channel and disabled binding atomically', async () => {
  const originalCreate = channelAPI.create
  const originalPutBinding = channelAPI.putBinding
  let createRequest: Parameters<typeof channelAPI.create>[0] | undefined
  let putCalled = false
  channelAPI.create = (async (request) => {
    createRequest = request
    return { id: 'channel_1' } as Awaited<ReturnType<typeof channelAPI.create>>
  }) as typeof channelAPI.create
  channelAPI.putBinding = (async () => {
    putCalled = true
    return {} as Awaited<ReturnType<typeof channelAPI.putBinding>>
  }) as typeof channelAPI.putBinding

  try {
    const payload = buildChannelMutationPayload(
      { ...baseInput, secrets: { app_secret: 'new-secret' } },
      'create',
    )
    await saveChannel({ payload })
  } finally {
    channelAPI.create = originalCreate
    channelAPI.putBinding = originalPutBinding
  }

  assert.equal(createRequest?.status, 0)
  assert.equal(createRequest?.binding.enabled, false)
  assert.equal(createRequest?.binding.target_revision_id, 'revision_1')
  assert.equal(putCalled, false)
})

test('save update stores connection and preserves active binding atomically', async () => {
  const originalUpdate = channelAPI.update
  const originalPutBinding = channelAPI.putBinding
  let updateRequest: Parameters<typeof channelAPI.update>[1] | undefined
  let putCalled = false
  const returnedChannel = { id: 'channel_1' } as Awaited<
    ReturnType<typeof channelAPI.update>
  >
  channelAPI.update = (async (_id, request) => {
    updateRequest = request
    return returnedChannel
  }) as typeof channelAPI.update
  channelAPI.putBinding = (async (_id, request) => {
    void request
    putCalled = true
    return returnedChannel
  }) as typeof channelAPI.putBinding

  try {
    const payload = buildChannelMutationPayload(baseInput, 'update')
    assert.equal(
      await saveChannel({ id: 'channel_1', payload }),
      returnedChannel,
    )
  } finally {
    channelAPI.update = originalUpdate
    channelAPI.putBinding = originalPutBinding
  }

  assert.equal(updateRequest?.binding?.enabled, true)
  assert.equal(putCalled, false)
})

test('channel API uses RESTful /api/v1 endpoints', async () => {
  const originalGet = apiClient.get
  const calls: Array<{ endpoint: string; config?: RequestConfig }> = []
  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ endpoint, config })
    return { items: [], total: 0 }
  }) as typeof apiClient.get

  try {
    await channelAPI.list()
    await channelAPI.listProviders()
  } finally {
    apiClient.get = originalGet
  }

  assert.deepEqual(
    calls.map((call) => call.endpoint),
    ['/chat-channels', '/chat-channels/providers'],
  )
  assert.equal(
    calls.every((call) => call.config?.baseURL?.endsWith('/api') === true),
    true,
  )
})

test('error mapping degrades to the generic key on any backend version', () => {
  const fallback = 'channel.messages.toggleFailed'

  // A backend that does not yet return error_code — exactly today's message.
  assert.equal(channelErrorMessageKey(new Error('boom'), fallback), fallback)
  assert.equal(channelErrorMessageKey(null, fallback), fallback)
  assert.equal(
    channelErrorMessageKey({ details: undefined }, fallback),
    fallback,
  )
  // An unknown code must not be rendered raw at an admin.
  assert.equal(
    channelErrorMessageKey({ details: { error_code: 'WAT' } }, fallback),
    fallback,
  )
})

test('every server error code maps to its own message key', () => {
  for (const code of CHANNEL_ERROR_CODES) {
    assert.equal(
      channelErrorMessageKey({ details: { error_code: code } }, 'fallback'),
      `channel.errorCodes.${code}`,
    )
  }
  // The catch-all branch is included: it is the likeliest failure to reach an
  // admin, so it is the one that must not be left without actionable text.
  assert.ok(CHANNEL_ERROR_CODES.includes('CHANNEL_OPERATION_FAILED'))
})

test('runtime state vocabulary matches the server, with no invented values', () => {
  assert.deepEqual(
    [...RUNTIME_STATES],
    ['waiting', 'starting', 'connected', 'stopping', 'stopped', 'error'],
  )
  // `connected` is the only healthy state the server can report; `healthy`,
  // `online` and `running` were client-side inventions.
  assert.equal(isRuntimeHealthy('connected'), true)
  for (const invented of ['healthy', 'online', 'running', 'pending']) {
    assert.equal(isRuntimeHealthy(invented), false)
  }
  assert.equal(isRuntimeHealthy(undefined), false)
})

test('a stale binding only warns when the server says so', () => {
  assert.equal(isBindingRevisionStale({ revision_stale: true } as never), true)
  assert.equal(
    isBindingRevisionStale({ revision_stale: false } as never),
    false,
  )
  // Absent on mutation responses and on dialog targets — never invent a warning.
  assert.equal(isBindingRevisionStale({ revision_stale: null } as never), false)
  assert.equal(isBindingRevisionStale(undefined), false)
  assert.equal(isBindingRevisionStale({} as never), false)
})

test('channel query keys keep list, detail, and runtime invalidation isolated', () => {
  assert.deepEqual(channelKeys.list(), ['channels', 'list'])
  assert.deepEqual(channelKeys.detail('channel_1'), [
    'channels',
    'detail',
    'channel_1',
  ])
  assert.deepEqual(channelKeys.runtime('channel_1'), [
    'channels',
    'detail',
    'channel_1',
    'runtime',
  ])
})
