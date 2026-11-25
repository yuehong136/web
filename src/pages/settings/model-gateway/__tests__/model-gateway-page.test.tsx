// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client-types'
import type {
  GatewayCatalog,
  GatewayCatalogModel,
  GatewayKey,
  GatewayLog,
  GatewayOverview,
} from '@/api/model-gateway'
import { createQueryClient } from '@/lib/query-client'
import { setProductLanguage } from '@/locales/i18n'
import { ModelGatewayPage } from '@/pages/settings/model-gateway'

const modelId = (value: number) => value.toString(16).padStart(32, '0')

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  updateCatalogModel: vi.fn(),
  updateCatalogInstance: vi.fn(),
  updateSettings: vi.fn(),
  getOverview: vi.fn(),
  listKeys: vi.fn(),
  createKey: vi.fn(),
  updateKey: vi.fn(),
  revokeKey: vi.fn(),
  queryLogs: vi.fn(),
  usage: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/api/model-gateway', async (original) => ({
  ...(await original<typeof import('@/api/model-gateway')>()),
  modelGatewayAPI: {
    getCatalog: mocks.getCatalog,
    updateCatalogModel: mocks.updateCatalogModel,
    updateCatalogInstance: mocks.updateCatalogInstance,
    updateSettings: mocks.updateSettings,
    getOverview: mocks.getOverview,
    listKeys: mocks.listKeys,
    createKey: mocks.createKey,
    updateKey: mocks.updateKey,
    revokeKey: mocks.revokeKey,
    queryLogs: mocks.queryLogs,
    usage: mocks.usage,
  },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

const PLAINTEXT = `sk-mrag-${'a'.repeat(32)}-${'S'.repeat(43)}`

const model = (
  overrides: Partial<GatewayCatalogModel> &
    Pick<GatewayCatalogModel, 'model_id' | 'model_name'>,
): GatewayCatalogModel => ({
  provider: 'Tongyi-Qianwen',
  instance_id: 'tq',
  instance_name: 'default',
  model_types: ['chat'],
  servable_types: ['chat'],
  state: 'callable',
  reason: null,
  enabled: true,
  enabled_by_default: true,
  call_name: overrides.model_name,
  names: [
    overrides.model_name,
    `${overrides.provider ?? 'Tongyi-Qianwen'}/${overrides.model_name}`,
  ],
  alias: null,
  preferred: false,
  shares_name: false,
  description: null,
  rpm_limit: null,
  tpm_limit: null,
  max_parallel_requests: null,
  requests_7d: 0,
  ...overrides,
})

const catalog: GatewayCatalog = {
  new_models_enabled: true,
  connections: [
    { instance_id: 'tq', instance_name: 'default', provider: 'Tongyi-Qianwen' },
    { instance_id: 'vl', instance_name: 'gpu-a', provider: 'VLLM' },
    { instance_id: 'zp', instance_name: 'default', provider: 'ZHIPU-AI' },
  ],
  models: [
    model({
      model_id: modelId(11),
      model_name: 'qwen-flash',
      requests_7d: 9812,
    }),
    model({
      model_id: modelId(12),
      model_name: 'qwen-max',
      state: 'closed',
      enabled: false,
    }),
    model({
      model_id: modelId(13),
      model_name: 'qwen-plus',
      shares_name: true,
      weight: 3,
      order: 1,
      pools: [{ name: 'qwen-plus', deployments: 2 }],
      rpm_limit: 600,
    }),
    model({
      model_id: modelId(21),
      model_name: 'Qwen3-32B',
      provider: 'VLLM',
      instance_id: 'vl',
      instance_name: 'gpu-a',
    }),
    model({
      model_id: modelId(31),
      model_name: 'glm-4-plus',
      provider: 'ZHIPU-AI',
      instance_id: 'zp',
      state: 'unavailable',
      reason: 'provider_not_supported',
    }),
  ],
}

const gatewayKey = (overrides: Partial<GatewayKey> = {}): GatewayKey => ({
  id: 'k1',
  name: 'support-bot',
  description: null,
  tags: null,
  redacted_key: 'sk-mrag-k7q2m9x4…',
  status: 'active',
  expires_at: null,
  allow_all_models: false,
  allowed_instance_ids: ['tq'],
  allowed_model_ids: [modelId(21), modelId(99)],
  rpm_limit: 120,
  tpm_limit: null,
  max_parallel_requests: null,
  token_quota: 30_000_000,
  quota_period: 'month',
  quota_used: 18_600_000,
  last_used_at: null,
  create_time: 1,
  update_time: 1,
  ...overrides,
})

const log: GatewayLog = {
  id: 'req_1',
  key_id: 'k1',
  key_name: 'support-bot',
  model: 'qwen-plus',
  gateway_model_id: null,
  upstream_model_id: modelId(13),
  upstream_model_name: null,
  endpoint: 'chat.completions',
  stream: false,
  status_code: 429,
  error_type: 'requests',
  error_code: 'rate_limit_exceeded',
  prompt_tokens: null,
  completion_tokens: null,
  total_tokens: null,
  usage_source: 'unavailable',
  started_at: '2026-11-17T08:41:55Z',
  first_token_ms: null,
  duration_ms: 3,
  end_user: null,
  client_ip: '10.0.0.1',
}

const overview: GatewayOverview = {
  base_url: 'http://127.0.0.1:9390/v1',
  listen_port: 9390,
  data_plane: 'up',
  counts: { providers: 3, callable_models: 2, active_keys: 1 },
  window: {
    start: '2026-11-10T12:00:00+00:00',
    end: '2026-11-17T12:00:00+00:00',
    days: 7,
  },
  totals: {
    requests: 100,
    errors: 4,
    prompt_tokens: 1000,
    completion_tokens: 500,
    total_tokens: 1500,
    usage_unknown: 0,
    first_token_p50_ms: 620,
  },
  previous_requests: 80,
  errors_by_code: [{ status_code: 429, code: 'rate_limit_exceeded', count: 3 }],
  bucket: 'day',
  series: [{ start: '2026-11-17T00:00:00+00:00', requests: 100, errors: 4 }],
  top_models: [],
  top_keys: [],
  recent_errors: [log],
}

let root: Root
let container: HTMLDivElement

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const waitFor = async <T,>(find: () => T | null | undefined | false) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const found = find()
    if (found) return found
    await flush()
  }
  throw new Error('Timed out waiting for element')
}
const pageText = () => document.body.textContent ?? ''
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent?.trim() === text,
  )
const labelled = <T extends HTMLElement = HTMLElement>(label: string) =>
  document.querySelector<T>(`[aria-label="${label}"]`)
const submit = () =>
  document.querySelector<HTMLButtonElement>('form button[type="submit"]')!
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
  await flush()
}
const typeInto = (field: HTMLInputElement, value: string) =>
  act(async () => {
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!
    set!.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })

async function renderPage(entry = '/settings/model-gateway') {
  const client = createQueryClient({ notifyMutationError: mocks.notify })
  const router = createMemoryRouter(
    [{ path: '/settings/model-gateway', element: <ModelGatewayPage /> }],
    { initialEntries: [entry] },
  )
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )
  return router
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  mocks.getCatalog.mockResolvedValue(catalog)
  mocks.listKeys.mockResolvedValue([gatewayKey()])
  mocks.getOverview.mockResolvedValue(overview)
  mocks.queryLogs.mockResolvedValue({
    items: [log],
    total: 1,
    page: 1,
    page_size: 20,
  })
  mocks.usage.mockResolvedValue({
    group_by: 'day',
    start: '',
    end: '',
    items: [],
  })
  await setProductLanguage('en-US')
  // Radix measures switches and checkboxes; jsdom has no ResizeObserver.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('says the gateway is not enabled when its routes do not exist', async () => {
  mocks.getCatalog.mockRejectedValue(
    new APIError(404, 'HTTP_ERROR', 'Not Found'),
  )
  mocks.listKeys.mockRejectedValue(new APIError(404, 'HTTP_ERROR', 'Not Found'))

  await renderPage()
  await waitFor(() => pageText().includes('The model gateway is not enabled'))

  expect(pageText()).toContain('model_gateway.enabled')
  // A missing route is final: it must not be retried.
  expect(mocks.getCatalog).toHaveBeenCalledTimes(1)
  expect(document.querySelector('[role="tab"]')).toBeNull()
})

it('shows the base URL with a sample for the first callable chat model', async () => {
  await renderPage()
  const baseUrl = await waitFor(() =>
    document.querySelector('[data-testid="gateway-base-url"]'),
  )

  expect(baseUrl.textContent).toBe('http://127.0.0.1:9390/v1')
  expect(
    document.querySelector('[data-testid="code-sample-python"]')?.textContent,
  ).toContain('model="qwen-flash"')
  expect(pageText()).toContain('Data plane running')
  expect(pageText()).toContain('+25% vs previous period')
  expect(pageText()).toContain('rate_limit_exceeded')
  expect(mocks.getOverview).toHaveBeenCalledWith(7, expect.anything())
})

it('groups the catalog by connection and opens a model with its id', async () => {
  mocks.updateCatalogModel.mockResolvedValue({
    ...catalog.models[1],
    enabled: true,
    state: 'callable',
  })
  mocks.updateCatalogInstance.mockResolvedValue(catalog)
  await renderPage('/settings/model-gateway?tab=models')
  const section = await waitFor(() => labelled('Tongyi-Qianwen · default'))

  expect(section.textContent).toContain('Tongyi-Qianwen/')
  expect(section.textContent).toContain('2 / 3 models open')
  // A model that serves a name with others says so, with its place in the order.
  expect(section.textContent).toContain('2 deployments')
  expect(section.textContent).toContain('Order 1 · Weight 3')
  expect(section.textContent).toContain('600 req/min')
  expect(labelled('VLLM · gpu-a')).not.toBeNull()
  // A provider the gateway cannot relay collapses into one card.
  expect(labelled('ZHIPU-AI')?.textContent).toContain('glm-4-plus')
  expect(pageText()).toContain('3 / 4 models open on the gateway')

  await click(labelled('Open qwen-max on the gateway')!)
  expect(mocks.updateCatalogModel).toHaveBeenCalledWith(modelId(12), {
    enabled: true,
  })

  const openAll = labelled('Open all models of Tongyi-Qianwen · default')!
  expect(openAll.getAttribute('aria-checked')).toBe('false')
  await click(openAll)
  expect(mocks.updateCatalogInstance).toHaveBeenCalledWith('tq', {
    enabled: true,
  })
})

it('lists keys with their scope, stale grants and quota', async () => {
  await renderPage('/settings/model-gateway?tab=keys')
  await waitFor(() => pageText().includes('support-bot'))

  expect(pageText()).toContain('Tongyi-Qianwen all · VLLM 1')
  // Model 99 is no longer in the catalog.
  expect(pageText()).toContain('1 no longer valid')
  expect(pageText()).toContain('This month 18.6M / 30M')
  expect(pageText()).toContain('Never expires')
})

it('turns a checked connection into picked models when one is unchecked', async () => {
  mocks.listKeys.mockResolvedValue([])
  mocks.createKey.mockResolvedValue({
    ...gatewayKey({
      id: 'k2',
      name: 'indexer',
      allowed_instance_ids: ['vl'],
      allowed_model_ids: [modelId(13)],
    }),
    key: PLAINTEXT,
  })
  await renderPage('/settings/model-gateway?tab=keys')
  await click(await waitFor(() => button('Create key')))
  await typeInto(
    await waitFor(() =>
      document.querySelector<HTMLInputElement>('#gateway-key-name'),
    ),
    'indexer',
  )

  const tongyi = labelled('Allow every model of Tongyi-Qianwen · default')!
  await click(tongyi)
  expect(tongyi.getAttribute('aria-checked')).toBe('true')
  expect(pageText()).toContain('This key can call 2 models now')

  await click(labelled('Allow qwen-flash')!)
  expect(tongyi.getAttribute('aria-checked')).toBe('mixed')
  await click(labelled('Allow every model of VLLM · gpu-a')!)
  // A closed model cannot be picked.
  expect(labelled<HTMLButtonElement>('Allow qwen-max')?.disabled).toBe(true)

  await click(submit())
  await waitFor(() => mocks.createKey.mock.calls.length > 0)
  expect(mocks.createKey).toHaveBeenCalledWith({
    name: 'indexer',
    description: null,
    allow_all_models: false,
    allowed_instance_ids: ['vl'],
    allowed_model_ids: [modelId(13)],
    rpm_limit: null,
    tpm_limit: null,
    max_parallel_requests: null,
    token_quota: null,
    quota_period: null,
    expires_at: null,
  })
})

it('shows the new key once with environment variables, then forgets it', async () => {
  mocks.createKey.mockResolvedValue({
    ...gatewayKey({ id: 'k2', name: 'indexer', allow_all_models: true }),
    key: PLAINTEXT,
  })
  await renderPage('/settings/model-gateway?tab=keys')
  await click(await waitFor(() => button('Create key')))
  await typeInto(
    await waitFor(() =>
      document.querySelector<HTMLInputElement>('#gateway-key-name'),
    ),
    'indexer',
  )
  await click(submit())
  const env = await waitFor(() =>
    document.querySelector('[data-testid="code-sample-env"]'),
  )

  expect(env.textContent).toBe(
    `OPENAI_BASE_URL=http://127.0.0.1:9390/v1\nOPENAI_API_KEY=${PLAINTEXT}`,
  )
  expect(pageText()).toContain('Can call 3 models, and models opened later')
  expect(pageText()).toContain('The full key is shown only this once')
  expect(button('Download .env')).toBeDefined()

  await click(button('Done')!)
  await waitFor(() => !pageText().includes(PLAINTEXT))
  expect(document.body.innerHTML).not.toContain(PLAINTEXT)
})

it('shows a fixed message when creation fails, never the server text', async () => {
  mocks.createKey.mockRejectedValue(
    new APIError(
      409,
      '409',
      'duplicate key value violates unique constraint "uq_gateway_keys_tenant_name_live"',
    ),
  )
  await renderPage('/settings/model-gateway?tab=keys')
  await click(await waitFor(() => button('Create key')))
  await typeInto(
    await waitFor(() =>
      document.querySelector<HTMLInputElement>('#gateway-key-name'),
    ),
    'support-bot',
  )

  await click(submit())
  const alert = await waitFor(() => document.querySelector('[role="alert"]'))

  expect(alert.textContent).toBe('This name is already in use.')
  expect(pageText()).not.toContain('uq_gateway_keys')
})

it('reads log filters from the link and writes new ones back to it', async () => {
  const router = await renderPage(
    '/settings/model-gateway?tab=logs&key=k1&outcome=error&range=7',
  )
  await waitFor(() => mocks.queryLogs.mock.calls.length > 0)

  expect(mocks.queryLogs.mock.calls[0][0]).toMatchObject({
    page: 1,
    page_size: 20,
    key_id: 'k1',
    outcome: 'error',
  })

  const endUser = labelled<HTMLInputElement>('End user')!
  await typeInto(endUser, 'wx_8812')
  await act(async () => {
    endUser.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  await flush()

  const params = new URLSearchParams(router.state.location.search)
  expect(params.get('user')).toBe('wx_8812')
  expect(params.get('key')).toBe('k1')
  expect(params.get('tab')).toBe('logs')
  await waitFor(() =>
    mocks.queryLogs.mock.calls.some(([query]) => query.end_user === 'wx_8812'),
  )
})

it('explains a failed call in its detail panel', async () => {
  await renderPage('/settings/model-gateway?tab=logs')
  const row = await waitFor(() =>
    labelled<HTMLButtonElement>(
      Array.from(document.querySelectorAll('button[aria-pressed]'))
        .map((element) => element.getAttribute('aria-label'))
        .find((label) => label?.includes('support-bot')) ?? '__none__',
    ),
  )
  await click(row)

  await waitFor(() => pageText().includes('Over the requests or tokens'))
  expect(pageText()).toContain('Not forwarded')
  expect(pageText()).toContain('POST /v1/chat/completions')
  expect(pageText()).toContain(
    'The gateway does not store request or response bodies.',
  )
})

it('opens a key in the detail panel and rotates it under a new name', async () => {
  await renderPage('/settings/model-gateway?tab=keys')
  const row = await waitFor(() =>
    document.querySelector<HTMLButtonElement>('button[aria-pressed="false"]'),
  )
  await click(row)
  await waitFor(() => pageText().includes('Limits and details'))

  expect(pageText()).toContain(
    'whole connection, including models opened later',
  )
  expect(pageText()).toContain('qwen-flash, qwen-plus')
  expect(pageText()).toContain('1 model deleted')
  expect(mocks.usage).toHaveBeenCalledWith(
    expect.objectContaining({ group_by: 'day', key_id: 'k1' }),
    expect.anything(),
  )

  await click(button('Rotate')!)
  const name = await waitFor(() =>
    document.querySelector<HTMLInputElement>('#gateway-key-name'),
  )
  expect(name.value).toMatch(/^support-bot \(.+\)$/)
  expect(pageText()).toContain(
    'Issues a new key with the settings of "support-bot"',
  )
})
