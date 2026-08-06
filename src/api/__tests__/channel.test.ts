import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildChannelMutationPayload,
  channelAPI,
  channelErrorMessageKey,
  CHANNEL_API_VERSION,
  CHANNEL_ERROR_CODES,
  RUNTIME_STATES,
  SUPPORTED_FORM_VERSION,
  type ChannelFormField,
  type ChannelFormInput,
} from '../channel'
import {
  channelHealth,
  countFaulted,
  filterChannels,
  formatHeartbeatAge,
  isBindingRevisionStale,
  isRuntimeHealthy,
} from '@/pages/settings/channels/utils'
import {
  assembleConfig,
  buildFormValues,
  missingRequiredFields,
  RENDERABLE_KINDS,
} from '@/pages/settings/channels/form-spec'
import { apiClient, type RequestConfig } from '../client'
import { channelKeys, saveChannel } from '@/hooks/use-channel-request'
import {
  createChannelFormSchema,
  getChannelFormDefaults,
  getLatestReleasedRevision,
  isPublishedAgent,
  resolveCanvasRevisionGuard,
} from '@/pages/settings/channels/form-model'

// The config arrives pre-assembled now — `assembleConfig` owns the nesting and
// the trimming — so this fixture states the wire shape directly.
const baseInput: ChannelFormInput = {
  name: ' Leadership demo ',
  provider: 'feishu',
  config: {
    credential: { app_id: 'cli_xxx' },
    domain: 'feishu',
    allowed_open_ids: ['ou_1', 'ou_2'],
  },
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
  // A credential must never appear anywhere but under config.credential, and
  // a blank secret must not travel at all. Same assertions as before the
  // spec-driven rewrite -- only the fixture's shape moved.
  assert.equal('secret' in payload.connection, false)
  assert.equal('app_secret' in payload.connection, false)
  assert.equal(
    'app_secret' in
      (payload.connection.config.credential as Record<string, unknown>),
    false,
  )
  assert.deepEqual(payload.connection.config.allowed_open_ids, ['ou_1', 'ou_2'])
  assert.equal(payload.binding.target_type, 'multirag.canvas_agent')
  assert.equal(payload.binding.target_revision_id, 'revision_1')
  assert.equal(payload.binding.enabled, true)
})

test('create serializer nests credentials and never sends a top-level secret', () => {
  const payload = buildChannelMutationPayload(
    {
      ...baseInput,
      config: {
        credential: { app_id: 'cli_xxx', app_secret: 'new-secret' },
        domain: 'feishu',
        allowed_open_ids: ['ou_1', 'ou_2'],
      },
    },
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

test('the form seeded from a stored channel never carries a secret', () => {
  // Replaces the old 'flattened for the Feishu form only' test, whose very name
  // admitted it pinned a provider special case (CONTRACT §6-A). What survives
  // is the assertion that mattered: the server sent a secret in this fixture
  // and it must not reach the form.
  const fields: ChannelFormField[] = [
    {
      path: 'credential.app_id',
      kind: 'text',
      label: 'App ID',
      required: true,
    },
    {
      path: 'credential.app_secret',
      kind: 'password',
      label: 'App Secret',
      required: true,
      secret: true,
    },
    { path: 'domain', kind: 'select', label: 'Domain' },
  ]

  const defaults = getChannelFormDefaults(fields, 'feishu', {
    id: 'channel_1',
    name: 'Demo',
    channel: 'feishu',
    config: {
      credential: { app_id: 'cli_xxx', app_secret: 'must-not-reach-form' },
      domain: 'lark',
    },
    status: 0,
    generation: 1,
    secret: { configured: true, version: 2 },
    binding: null,
  })

  assert.equal(defaults.config['credential/app_id'], 'cli_xxx')
  assert.equal(defaults.config.domain, 'lark')
  assert.equal(defaults.secrets['credential/app_secret'], '')
  assert.equal(JSON.stringify(defaults).includes('must-not-reach-form'), false)
})

test('canvas binding requires a concrete released revision and dialog clears it', () => {
  const schema = createChannelFormSchema([], true, 'required')
  const values = {
    name: 'Demo',
    provider: 'feishu',
    config: { 'credential/app_id': 'cli_xxx', domain: 'feishu' },
    secrets: { 'credential/app_secret': '' },
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
      {
        ...baseInput,
        config: {
          credential: { app_id: 'cli_xxx', app_secret: 'new-secret' },
          domain: 'feishu',
          allowed_open_ids: ['ou_1', 'ou_2'],
        },
      },
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

const feishuFormFields: ChannelFormField[] = [
  {
    path: 'credential.app_id',
    kind: 'text',
    label: 'App ID',
    required: true,
  },
  {
    path: 'credential.app_secret',
    kind: 'password',
    label: 'App Secret',
    required: true,
    secret: true,
  },
  {
    path: 'domain',
    kind: 'select',
    label: 'Domain',
    required: true,
    default: 'feishu',
  },
  { path: 'allowed_open_ids', kind: 'string_list', label: 'Allowed open IDs' },
]

test('assembleConfig reproduces the Feishu payload without naming its fields', () => {
  const payload = assembleConfig(feishuFormFields, {
    config: {
      'credential/app_id': ' cli_xxx ',
      domain: ' feishu ',
      allowed_open_ids: 'ou_1\nou_2, ou_1',
    },
    secrets: { 'credential/app_secret': ' new-secret ' },
  })

  // Byte-identical to what the hardcoded serializer produced. This is the
  // proof that the generic path is a refactor and not a rewrite.
  assert.deepEqual(payload, {
    credential: { app_id: 'cli_xxx', app_secret: 'new-secret' },
    domain: 'feishu',
    allowed_open_ids: ['ou_1', 'ou_2'],
  })
})

test('a blank secret is omitted entirely, never sent as an empty value', () => {
  const payload = assembleConfig(feishuFormFields, {
    config: {
      'credential/app_id': 'cli_xxx',
      domain: 'feishu',
      allowed_open_ids: '',
    },
    secrets: { 'credential/app_secret': '   ' },
  })

  // Blank means "keep the stored credential". An empty string would read as
  // "clear it", which is the one thing this must never do by accident.
  assert.deepEqual(payload.credential, { app_id: 'cli_xxx' })
  assert.equal('app_secret' in (payload.credential as object), false)
})

test('a second provider serialises without touching this file', () => {
  // The whole point of CHN-P: no code here knows what DingTalk is.
  const dingtalk: ChannelFormField[] = [
    {
      path: 'credential.client_id',
      kind: 'text',
      label: 'Client ID',
      required: true,
    },
    {
      path: 'credential.client_secret',
      kind: 'password',
      label: 'Client Secret',
      required: true,
      secret: true,
    },
  ]

  const payload = assembleConfig(dingtalk, {
    config: { 'credential/client_id': 'ding_aaaa' },
    secrets: { 'credential/client_secret': 'aaaa-bbbb' },
  })

  assert.deepEqual(payload, {
    credential: { client_id: 'ding_aaaa', client_secret: 'aaaa-bbbb' },
  })
})

test('nested and boolean fields survive the round trip', () => {
  const fields: ChannelFormField[] = [
    {
      path: 'credential.nickserv.account',
      kind: 'text',
      label: 'NickServ account',
    },
    { path: 'tls', kind: 'switch', label: 'TLS', default: true },
  ]

  const payload = assembleConfig(fields, {
    config: { 'credential/nickserv/account': 'bot', tls: false },
    secrets: {},
  })

  // Two levels of nesting and a real boolean — neither of which the old
  // Record<string,string> form model could represent at all.
  assert.deepEqual(payload, {
    credential: { nickserv: { account: 'bot' } },
    tls: false,
  })
})

test('form values start with every secret blank', () => {
  const { config, secrets } = buildFormValues(feishuFormFields, {
    id: 'channel_1',
    name: 'Demo',
    channel: 'feishu',
    config: {
      credential: { app_id: 'cli_xxx', app_secret: 'must-not-reach-form' },
      domain: 'lark',
      allowed_open_ids: ['ou_1', 'ou_2'],
    },
    status: 0,
    generation: 1,
    secret: { configured: true, version: 2 },
    binding: null,
  })

  assert.equal(config['credential/app_id'], 'cli_xxx')
  assert.equal(config.domain, 'lark')
  assert.equal(config.allowed_open_ids, 'ou_1\nou_2')
  assert.equal(secrets['credential/app_secret'], '')
})

test('a stored secret satisfies required without re-entry', () => {
  const values = {
    config: {
      'credential/app_id': 'cli_xxx',
      domain: 'feishu',
      allowed_open_ids: '',
    },
    secrets: { 'credential/app_secret': '' },
  }

  assert.deepEqual(missingRequiredFields(feishuFormFields, values, true), [])
  assert.deepEqual(missingRequiredFields(feishuFormFields, values, false), [
    'credential.app_secret',
  ])
})

test('this build states which channel contract it was written against', () => {
  // The whole tooling budget for cross-repo drift. It catches one thing: the
  // documented contract was bumped and nobody looked at this client. Bumps are
  // breaking-only by rule (CONTRACT.md), so a green run here is meaningful
  // rather than routine -- if it went red weekly, everyone would learn to edit
  // the constant instead of reading the change.
  assert.equal(CHANNEL_API_VERSION, 'channel-api/v1')
  assert.equal(SUPPORTED_FORM_VERSION, 1)
})

test('listProviders drops every manifest this client cannot render', async () => {
  const field = {
    path: 'credential.client_id',
    kind: 'text',
    label: 'Client ID',
  }
  const originalGet = apiClient.get
  apiClient.get = (async () => ({
    items: [
      // No form at all: a backend older than CHN-P2.
      {
        provider: 'feishu',
        display_name: 'Feishu',
        capabilities: {},
        config_schema: {},
      },
      // A form version this build does not know. The server bumps that number
      // only when an older client would render the form wrongly, so guessing
      // is the one outcome the version exists to prevent.
      {
        provider: 'wecom',
        display_name: 'WeCom',
        capabilities: {},
        form: { version: SUPPORTED_FORM_VERSION + 1, fields: [field] },
        config_schema: {},
      },
      {
        provider: 'dingtalk',
        display_name: 'DingTalk',
        capabilities: {},
        form: { version: SUPPORTED_FORM_VERSION, fields: [field] },
        config_schema: {},
      },
    ],
  })) as typeof apiClient.get

  try {
    const { items } = await channelAPI.listProviders()
    // Rendering either dropped manifest would put an enabled Save button under
    // a form that is wrong or empty; dropping them routes the page into its
    // "providers unavailable" banner instead, with the list and the
    // enable/disable/delete actions still working.
    assert.deepEqual(
      items.map((item) => item.provider),
      ['dingtalk'],
    )
  } finally {
    apiClient.get = originalGet
  }
})

// The DingTalk form exactly as the backend emits it, copied from
// `GET /chat-channels/providers` (MultiRAG:api/channel_providers/dingtalk.py).
// Kept verbatim, nulls included, so this fails if the wire shape drifts rather
// than if someone tidied the fixture.
const DINGTALK_FIELDS: ChannelFormField[] = [
  {
    path: 'credential.client_id',
    kind: 'text',
    label: 'Client ID',
    i18n_key: 'channel.fields.client_id',
    required: true,
    secret: false,
    placeholder: 'dingxxxxxxxxxxxxxxxx',
    help_text: 'Called AppKey in older DingTalk consoles.',
    default: null,
    options: null,
    max_length: null,
    max_items: null,
  },
  {
    path: 'credential.client_secret',
    kind: 'password',
    label: 'Client Secret',
    i18n_key: 'channel.fields.client_secret',
    required: true,
    secret: true,
    placeholder: null,
    help_text: null,
    default: null,
    options: null,
    max_length: null,
    max_items: null,
  },
  {
    path: 'robot_code',
    kind: 'text',
    label: 'Robot code',
    i18n_key: 'channel.fields.robot_code',
    required: true,
    secret: false,
    placeholder: null,
    help_text: null,
    default: null,
    options: null,
    max_length: null,
    max_items: null,
  },
  {
    path: 'allowed_user_ids',
    kind: 'string_list',
    label: 'Allowed user IDs',
    i18n_key: 'channel.fields.allowed_user_ids',
    required: false,
    secret: false,
    placeholder: null,
    help_text: null,
    default: null,
    options: null,
    max_length: null,
    max_items: 1000,
  },
]

test('a provider this build has never heard of renders and submits', () => {
  // The cross-repo acceptance criterion (CHN-X3), as far as it goes without a
  // live DingTalk transport: this file was written before DingTalk existed and
  // still names none of its fields. Every assertion below is derived from the
  // server's field list.
  assert.deepEqual(
    DINGTALK_FIELDS.map((field) => field.kind).filter(
      (kind) => !RENDERABLE_KINDS.includes(kind),
    ),
    [],
  )

  const defaults = getChannelFormDefaults(DINGTALK_FIELDS, 'dingtalk')
  assert.deepEqual(defaults.config, {
    'credential/client_id': '',
    robot_code: '',
    allowed_user_ids: '',
  })
  // Secrets live in their own bucket and start blank, whatever the provider
  // calls them — `client_secret` here, `app_secret` for Feishu.
  assert.deepEqual(defaults.secrets, { 'credential/client_secret': '' })

  // Required-ness comes from the form layer, so an empty form is incomplete
  // without this file knowing which fields matter.
  assert.deepEqual(missingRequiredFields(DINGTALK_FIELDS, defaults, false), [
    'credential.client_id',
    'credential.client_secret',
    'robot_code',
  ])

  const filled = {
    ...defaults,
    config: {
      'credential/client_id': 'dingaaaaaaaaaaaaaaaa',
      robot_code: 'robot-aaaa',
      allowed_user_ids: 'user_a, user_b',
    },
    secrets: { 'credential/client_secret': 'secret-aaaa-bbbb-cccc' },
  }
  assert.deepEqual(missingRequiredFields(DINGTALK_FIELDS, filled, false), [])

  // The payload the backend's DingTalkConfigInput accepts. Asserted verbatim
  // in MultiRAG:tests/unit/test_channel_provider_spec.py so the two halves of
  // this acceptance cannot drift apart.
  assert.deepEqual(assembleConfig(DINGTALK_FIELDS, filled), {
    credential: {
      client_id: 'dingaaaaaaaaaaaaaaaa',
      client_secret: 'secret-aaaa-bbbb-cccc',
    },
    robot_code: 'robot-aaaa',
    allowed_user_ids: ['user_a', 'user_b'],
  })
})

test('a channel reports one status rather than two that disagree', () => {
  // The card used to show an "enabled" badge next to a separate runtime row,
  // so the only question an operator has -- is this working? -- had no single
  // answer, and in the normal case the two contradicted each other: a channel
  // enabled thirty seconds ago reads "enabled" and "waiting" at once.
  const base = {
    id: 'c1',
    name: 'Demo',
    channel: 'feishu',
    config: {},
    generation: 1,
    secret: { configured: true, version: 1 },
    binding: null,
  }

  const health = (status: unknown, state?: string) =>
    channelHealth({
      ...base,
      status,
      runtime: state ? ({ state } as never) : null,
    } as never)

  assert.equal(health(1, 'connected'), 'connected')
  assert.equal(health(1, 'waiting'), 'pending')
  assert.equal(health(1, 'starting'), 'pending')
  assert.equal(health(1, 'error'), 'faulted')
  // A disabled channel has no runner by definition, so whatever its last
  // runtime row said is stale noise -- reporting it as "faulted" would put a
  // red dot on every channel anyone ever paused.
  assert.equal(health(0, 'error'), 'off')
  assert.equal(health(0, 'connected'), 'off')
  // No runtime row at all is still "not yet connected", not "broken".
  assert.equal(health(1), 'pending')
})

test('a heartbeat is shown as an age, because that is the question it answers', () => {
  const now = Date.UTC(2026, 7, 6, 12, 0, 0)
  const at = (secondsAgo: number) =>
    formatHeartbeatAge(
      new Date(now - secondsAgo * 1000).toISOString(),
      'en',
      now,
    )

  assert.equal(at(5), '5 seconds ago')
  assert.equal(at(90), '1 minute ago')
  assert.equal(at(7200), '2 hours ago')
  assert.equal(at(172800), '2 days ago')
  // A clock skewed into the future must not render "in 3 seconds", which reads
  // as a bug in the page rather than in the clock.
  assert.equal(
    formatHeartbeatAge(new Date(now + 3000).toISOString(), 'en', now),
    'now',
  )
  assert.equal(formatHeartbeatAge(null, 'en', now), '—')
  assert.equal(formatHeartbeatAge('not-a-date', 'en', now), '—')
})

test('the list filter searches what people actually remember a channel by', () => {
  const make = (
    id: string,
    name: string,
    provider: string,
    targetId?: string,
  ) =>
    ({
      id,
      name,
      channel: provider,
      config: {},
      status: 1,
      generation: 1,
      secret: { configured: true, version: 1 },
      binding: targetId
        ? ({
            target_id: targetId,
            target_type: 'multirag.canvas_agent',
          } as never)
        : null,
      runtime: { state: 'connected' } as never,
    }) as never

  const channels = [
    make('1', '小丽0803', 'feishu', 'agent_alpha'),
    make('2', 'Support bot', 'dingtalk', 'agent_beta'),
  ]
  const labels = { feishu: '飞书', dingtalk: '钉钉' }
  const find = (query: string) =>
    filterChannels(channels, {
      query,
      onlyFaulted: false,
      providerLabels: labels,
    }).map((channel) => channel.id)

  assert.deepEqual(find(''), ['1', '2'])
  assert.deepEqual(find('小丽'), ['1'])
  // The localised platform name, which the server never sends — it only knows
  // `feishu` and "Feishu / Lark", so searching in Chinese would find nothing
  // without the label map.
  assert.deepEqual(find('飞书'), ['1'])
  assert.deepEqual(find('dingtalk'), ['2'])
  // The bound target id: the one value people paste in from somewhere else,
  // chasing "which channel points at this agent?".
  assert.deepEqual(find('agent_beta'), ['2'])
  assert.deepEqual(find('  SUPPORT  '), ['2'])
  assert.deepEqual(find('nothing'), [])
})

test('the faults filter narrows to faults and counts them independently', () => {
  const make = (id: string, status: number, state: string) =>
    ({
      id,
      name: id,
      channel: 'feishu',
      config: {},
      status,
      generation: 1,
      secret: { configured: true, version: 1 },
      binding: null,
      runtime: { state } as never,
    }) as never

  const channels = [
    make('ok', 1, 'connected'),
    make('bad', 1, 'error'),
    // Paused, with a stale error row left behind. It must not be counted as a
    // fault, or every channel anyone ever paused would demand attention.
    make('paused', 0, 'error'),
  ]

  assert.equal(countFaulted(channels), 1)
  assert.deepEqual(
    filterChannels(channels, { query: '', onlyFaulted: true }).map((c) => c.id),
    ['bad'],
  )
  // Query and toggle compose rather than override each other.
  assert.deepEqual(
    filterChannels(channels, { query: 'ok', onlyFaulted: true }).map(
      (c) => c.id,
    ),
    [],
  )
})
