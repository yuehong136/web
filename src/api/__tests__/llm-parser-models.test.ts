import { hasSelectedModelCapability } from '@/stores/model'
import { projectTenantModels } from '@/api/llm'
import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient } from '@/api/client'
import { llmAPI } from '@/api/llm'
import { modelProvidersAPI } from '@/api/llm-providers'

const model = (id: number) => ({
  id,
  name: 'same',
  provider_id: 'p',
  provider_name: 'Provider',
  instance_id: `i${id}`,
  instance_name: `instance-${id}`,
  model_types: ['chat', 'image2text'],
  status: 'active',
  effective_status: 'active',
  max_tokens: 0,
  is_tools: false,
  reference: String(id),
})
const response = (data: unknown) =>
  new Response(JSON.stringify({ code: 0, message: 'success', data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
test('projects exact numeric identities and a single connection name without querying legacy credentials', async (t) => {
  const calls: { url: URL; init?: RequestInit }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: new URL(String(input)), init })
      return response({ items: [model(17)], total: 1, page: 1, page_size: 100 })
    },
  )
  const configured = await llmAPI.getMyLLMs()
  assert.equal(configured.Provider.llm[0].id, '17')
  assert.equal(configured.Provider.llm[0].label, 'same')
  assert.equal(configured.Provider.llm[0].max_tokens, 0)
  const listed = (await llmAPI.list({ available: true })).Provider[0]
  assert.equal(listed.id, '17')
  assert.equal(listed.llm_name, 'same')
  assert.equal((await llmAPI.getModelCatalog()).Provider[0].available, true)
  for (const { url, init } of calls) {
    assert.equal(url.pathname, '/api/v1/models')
    assert.equal(url.searchParams.get('page'), '1')
    assert.equal(url.searchParams.get('page_size'), '100')
    assert.equal(url.searchParams.has('include_details'), false)
    assert.equal(init?.method, 'GET')
  }
})
test('adds instance names only for same-name models on distinct usable connections within a provider', async (t) => {
  const rows = [
    model(1),
    model(2),
    { ...model(3), name: 'unique', instance_name: 'default' },
    { ...model(4), name: 'unique', effective_status: 'inactive' },
    { ...model(5), provider_name: 'Other' },
  ]
  t.mock.method(globalThis, 'fetch', async () =>
    response({ items: rows, total: rows.length, page: 1, page_size: 100 }),
  )
  const configured = await llmAPI.getMyLLMs()
  const listed = await llmAPI.list({ available: true })
  assert.deepEqual(
    configured.Provider.llm.map((row) => [row.id, row.label]),
    [
      ['1', 'same · instance-1'],
      ['1', 'same · instance-1'],
      ['2', 'same · instance-2'],
      ['2', 'same · instance-2'],
      ['3', 'unique'],
      ['3', 'unique'],
      ['4', 'unique'],
      ['4', 'unique'],
    ],
  )
  assert.equal(configured.Other.llm[0].label, 'same')
  assert.equal(listed.Other[0].llm_name, 'same')
  for (const row of listed.Provider) {
    assert.equal(
      row.llm_name,
      configured.Provider.llm.find((item) => item.id === row.id)?.label,
    )
  }
})

test('counts connections rather than capabilities or model rows', () => {
  const rows = projectTenantModels([
    model(1),
    { ...model(2), instance_id: 'i1', instance_name: 'instance-1' },
  ] as Parameters<typeof projectTenantModels>[0])
  assert.ok(rows.Provider.llm.every((row) => row.label === 'same'))
  assert.deepEqual(
    rows.Provider.llm.map((row) => row.reference),
    ['1', '1', '2', '2'],
  )
})
test('requires complete stable pagination and rejects duplicates, missing totals, malformed IDs and partial inventories', async (t) => {
  let wire: unknown
  const fetch = t.mock.method(globalThis, 'fetch', async () => response(wire))
  for (const invalid of [
    { items: [], page: 1, page_size: 100 },
    { items: [], total: 1, page: 1, page_size: 100 },
    { items: [model(1), model(1)], total: 2, page: 1, page_size: 100 },
    { items: [model(1)], total: 2, page: 1, page_size: 100 },
    { items: [{ ...model(1), id: '1' }], total: 1, page: 1, page_size: 100 },
    {
      items: [{ ...model(1), reference: '2' }],
      total: 1,
      page: 1,
      page_size: 100,
    },
    {
      items: [{ ...model(1), model_types: ['chat', 'chat'] }],
      total: 1,
      page: 1,
      page_size: 100,
    },
    {
      items: [{ ...model(1), max_tokens: -1 }],
      total: 1,
      page: 1,
      page_size: 100,
    },
    { items: [], total: '0', page: 1, page_size: 100 },
  ]) {
    wire = invalid
    await assert.rejects(
      modelProvidersAPI.models(),
      (error: unknown) =>
        error instanceof APIError && error.code === 'INVALID_MODEL_INVENTORY',
    )
  }
  wire = { items: [], total: 0, page: 1, page_size: 100 }
  assert.deepEqual(await modelProvidersAPI.models(), [])
  let page = 0
  fetch.mock.mockImplementation(async () => {
    page++
    return response({
      items:
        page === 1
          ? Array.from({ length: 100 }, (_, i) => model(i + 1))
          : [model(101)],
      total: 101,
      page,
      page_size: 100,
    })
  })
  assert.equal((await modelProvidersAPI.models()).length, 101)
  assert.equal(page, 2)
})
test('rejects a changed owner between pages and honors caller cancellation', async (t) => {
  apiClient.setAuthToken('owner-a')
  t.mock.method(globalThis, 'fetch', async () => {
    apiClient.setAuthToken('owner-b')
    return response({ items: [], total: 0, page: 1, page_size: 100 })
  })
  try {
    await assert.rejects(modelProvidersAPI.models())
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(
      modelProvidersAPI.models(controller.signal),
      (error: unknown) =>
        error instanceof DOMException && error.name === 'AbortError',
    )
  } finally {
    apiClient.setAuthToken(null)
  }
})
test('preserves business failures through the real APIClient for both supported envelopes', async (t) => {
  let wire: unknown
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify(wire), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  )
  for (wire of [
    { code: 109, message: 'access denied', data: {} },
    { retcode: 109, retmsg: 'access denied', data: {} },
  ])
    for (const read of [
      () => llmAPI.getMyLLMs(),
      () => llmAPI.getModelCatalog(),
    ])
      await assert.rejects(
        read(),
        (error: unknown) =>
          error instanceof APIError &&
          error.status === 200 &&
          error.code === '109',
      )
})
test('encodes management identities, preserves empty instance catalogs, and sends explicit default clearing', async (t) => {
  const calls: { url: URL; init?: RequestInit }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: new URL(String(input)), init })
      return response(true)
    },
  )
  await modelProvidersAPI.createInstance('a/b', {
    instance_name: 'primary',
    api_key: 'synthetic',
    base_url: '',
    region: '',
    model_ids: [],
  })
  await modelProvidersAPI.updateInstance('a/b', 'name @1', {
    api_key: '',
    region: '',
  })
  await modelProvidersAPI.setDefault('ocr', null)
  assert.equal(calls[0].url.pathname, '/api/v1/providers/a%2Fb/instances')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)).model_ids, [])
  assert.equal(
    calls[1].url.pathname,
    '/api/v1/providers/a%2Fb/instances/name%20%401',
  )
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {
    api_key: '',
    region: '',
  })
  assert.deepEqual(JSON.parse(String(calls[2].init?.body)), {
    model_type: 'ocr',
    model_id: null,
  })
})

test('Agent image input follows the selected model rather than provider tags', () => {
  const rows = projectTenantModels([
    { ...model(1), model_types: ['chat'] },
    { ...model(2), model_types: ['chat', 'image2text'] },
    { ...model(3), model_types: ['image2text'], effective_status: 'inactive' },
  ] as Parameters<typeof projectTenantModels>[0])
  assert.equal(hasSelectedModelCapability(rows, '1', 'image2text'), false)
  assert.equal(hasSelectedModelCapability(rows, '2', 'image2text'), true)
  assert.equal(hasSelectedModelCapability(rows, '3', 'image2text'), false)
  assert.equal(
    hasSelectedModelCapability(rows, 'same@Provider', 'image2text'),
    false,
  )
})

test('connection sends a read-only typed candidate and rejects malformed verification receipts', async (t) => {
  let wire: unknown = {
    verified: true,
    model_name: 'custom',
    model_type: 'chat',
  }
  const calls: { url: string; body: unknown }[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) })
      return response(wire)
    },
  )
  const candidate = {
    api_key: 'synthetic',
    base_url: 'https://api.siliconflow.com/v1',
    region: 'intl',
    model_ids: [],
    custom_model: {
      model_name: 'custom',
      model_types: ['chat'] as ['chat'],
      max_tokens: 0,
      is_tools: false,
    },
  }
  assert.deepEqual(
    await modelProvidersAPI.verifyConnection('a/b', candidate),
    wire,
  )
  assert.equal(
    new URL(calls[0].url).pathname,
    '/api/v1/providers/a%2Fb/connection',
  )
  assert.deepEqual(calls[0].body, candidate)
  for (wire of [
    null,
    true,
    {},
    { verified: false, model_name: 'custom', model_type: 'chat' },
    { verified: true, model_name: '', model_type: 'chat' },
    { verified: true, model_name: 'custom', model_type: 'invalid' },
  ])
    await assert.rejects(modelProvidersAPI.verifyConnection('a/b', candidate))
})

test('discovers paginated candidates using body-only credentials, stable names and strict metadata', async (t) => {
  const calls: { url: URL; init?: RequestInit }[] = []
  const item = {
    model_name: 'stable-voice-id',
    display_name: 'Readable voice',
    model_types: ['tts'],
    max_tokens: 0,
    is_tools: false,
    features: [],
    source: 'remote',
    id: 99,
    status: 'active',
  }
  let wire: unknown = { items: [item], total: 101, page: 2, page_size: 100 }
  t.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: new URL(String(input)), init })
      return response(wire)
    },
  )
  const input = { api_key: 'synthetic-private-token', base_url: '', region: '' }
  const data = await modelProvidersAPI.discoverModels('Fish Audio', input, 2)
  assert.equal(data.items[0].model_name, 'stable-voice-id')
  assert.equal(data.items[0].display_name, 'Readable voice')
  assert.equal(data.items[0].max_tokens, 0)
  assert.equal('id' in data.items[0], false)
  assert.equal('status' in data.items[0], false)
  assert.equal(
    calls[0].url.pathname,
    '/api/v1/providers/Fish%20Audio/models/discovery',
  )
  assert.deepEqual(
    [...calls[0].url.searchParams],
    [
      ['page', '2'],
      ['page_size', '100'],
    ],
  )
  assert.equal(calls[0].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), input)
  for (wire of [
    { items: [item], total: 1, page: 1, page_size: 100 },
    { items: [item], total: 102, page: 2, page_size: 100 },
    {
      items: [{ ...item, max_tokens: -1 }],
      total: 101,
      page: 2,
      page_size: 100,
    },
    {
      items: [{ ...item, model_types: [] }],
      total: 101,
      page: 2,
      page_size: 100,
    },
    {
      items: [{ ...item, source: 'registered' }],
      total: 101,
      page: 2,
      page_size: 100,
    },
    {
      items: [{ ...item, model_name: ' stable-id ' }],
      total: 101,
      page: 2,
      page_size: 100,
    },
    { items: [item, item], total: 102, page: 2, page_size: 100 },
  ])
    await assert.rejects(
      modelProvidersAPI.discoverModels('Fish Audio', input, 2),
    )
})

test('does not deliver discovery from a previous owner or cancelled request', async (t) => {
  apiClient.setAuthToken('discovery-owner-a')
  const controller = new AbortController()
  t.after(() => apiClient.setAuthToken(null))
  t.mock.method(globalThis, 'fetch', async () => {
    apiClient.setAuthToken('discovery-owner-b')
    controller.abort()
    return response({ items: [], total: 0, page: 1, page_size: 100 })
  })
  await assert.rejects(
    modelProvidersAPI.discoverModels(
      'Ollama',
      { api_key: '', base_url: '', region: '' },
      1,
      controller.signal,
    ),
  )
})
