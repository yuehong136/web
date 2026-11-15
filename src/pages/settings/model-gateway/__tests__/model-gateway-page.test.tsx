// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client-types'
import type { GatewayKey, GatewayModel } from '@/api/model-gateway'
import { createQueryClient } from '@/lib/query-client'
import { setProductLanguage } from '@/locales/i18n'
import { ModelGatewayPage } from '@/pages/settings/model-gateway'

const mocks = vi.hoisted(() => ({
  listModels: vi.fn(),
  listKeys: vi.fn(),
  listCandidates: vi.fn(),
  createKey: vi.fn(),
  updateKey: vi.fn(),
  revokeKey: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/api/model-gateway', async (original) => ({
  ...(await original<typeof import('@/api/model-gateway')>()),
  modelGatewayAPI: {
    listModels: mocks.listModels,
    listKeys: mocks.listKeys,
    listCandidates: mocks.listCandidates,
    createKey: mocks.createKey,
    updateKey: mocks.updateKey,
    revokeKey: mocks.revokeKey,
  },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

const PLAINTEXT = `sk-mrag-${'a'.repeat(32)}-${'S'.repeat(43)}`

const model: GatewayModel = {
  id: 'gm-1',
  name: 'chat-default',
  model_id: 7,
  model_type: 'chat',
  status: 'active',
  description: null,
  target: {
    model_name: 'qwen-upstream',
    provider: 'VLLM',
    instance: 'default',
    model_types: ['chat'],
    available: true,
    relayable: true,
  },
  rpm_limit: 600,
  tpm_limit: null,
  max_parallel_requests: null,
  create_time: 1,
  update_time: 1,
}

const gatewayKey = (overrides: Partial<GatewayKey> = {}): GatewayKey => ({
  id: 'k'.repeat(32),
  name: 'eval-runner',
  description: 'nightly evals',
  tags: null,
  redacted_key: 'sk-mrag-kkkkkkkk...',
  status: 'active',
  expires_at: null,
  allow_all_models: false,
  allowed_model_ids: ['gm-1'],
  rpm_limit: 60,
  tpm_limit: null,
  max_parallel_requests: null,
  token_quota: 1_000_000,
  quota_period: 'month',
  quota_used: 250_000,
  last_used_at: null,
  create_time: 1,
  update_time: 1,
  ...overrides,
})

let root: Root
let container: HTMLDivElement

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const waitFor = async <T,>(find: () => T | null | undefined | false) => {
  for (let attempt = 0; attempt < 50; attempt++) {
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
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
  await flush()
}
const openTab = async (name: string) => {
  const tab = Array.from(
    document.querySelectorAll<HTMLElement>('[role="tab"]'),
  ).find((element) => element.textContent?.trim() === name)!
  // Radix tabs activate on mouse down, not on click.
  await act(async () => {
    tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
  })
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

async function renderPage() {
  const client = createQueryClient({ notifyMutationError: mocks.notify })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ModelGatewayPage />
      </QueryClientProvider>,
    ),
  )
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  mocks.listModels.mockResolvedValue([model])
  mocks.listKeys.mockResolvedValue([gatewayKey()])
  mocks.listCandidates.mockResolvedValue([])
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
  mocks.listModels.mockRejectedValue(
    new APIError(404, 'HTTP_ERROR', 'Not Found'),
  )
  mocks.listKeys.mockRejectedValue(new APIError(404, 'HTTP_ERROR', 'Not Found'))

  await renderPage()
  await waitFor(() => pageText().includes('The model gateway is not enabled'))

  expect(pageText()).toContain('model_gateway.enabled')
  // A missing route is final: it must not be retried.
  expect(mocks.listModels).toHaveBeenCalledTimes(1)
  expect(document.querySelector('[role="tab"]')).toBeNull()
})

it('lists published models, then keys with their limits and quota use', async () => {
  await renderPage()
  await waitFor(() => pageText().includes('chat-default'))

  expect(pageText()).toContain('VLLM / qwen-upstream')
  expect(pageText()).toContain('600 req/min')

  await openTab('API keys')
  await waitFor(() => pageText().includes('eval-runner'))

  expect(pageText()).toContain('sk-mrag-kkkkkkkk...')
  expect(pageText()).toContain('Models: 1')
  expect(pageText()).toContain('60 req/min')
  expect(pageText()).toContain('250,000 / 1,000,000 tokens this month')
})

it('creates a key from a name alone and shows its plaintext exactly once', async () => {
  mocks.createKey.mockResolvedValue({
    ...gatewayKey({ id: 'a'.repeat(32), name: 'indexing-job' }),
    key: PLAINTEXT,
  })
  await renderPage()
  await waitFor(() => pageText().includes('chat-default'))
  await openTab('API keys')
  await click(await waitFor(() => button('Create key')))

  await typeInto(
    await waitFor(() =>
      document.querySelector<HTMLInputElement>('#gateway-key-name'),
    ),
    'indexing-job',
  )
  await click(button('Create')!)
  await waitFor(() => pageText().includes(PLAINTEXT))

  // Nothing but the name was needed: no scope, no limits, no quota, no expiry.
  expect(mocks.createKey).toHaveBeenCalledWith({
    name: 'indexing-job',
    description: null,
    allow_all_models: false,
    allowed_model_ids: [],
    rpm_limit: null,
    tpm_limit: null,
    max_parallel_requests: null,
    token_quota: null,
    quota_period: null,
    expires_at: null,
  })
  expect(pageText()).toContain('It is shown only this once')
  // The list is refreshed, and it never carries the plaintext.
  expect(mocks.listKeys.mock.calls.length).toBeGreaterThanOrEqual(2)

  await click(button('I have saved it')!)
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
  await renderPage()
  await waitFor(() => pageText().includes('chat-default'))
  await openTab('API keys')
  await click(await waitFor(() => button('Create key')))
  await typeInto(
    await waitFor(() =>
      document.querySelector<HTMLInputElement>('#gateway-key-name'),
    ),
    'eval-runner',
  )

  await click(button('Create')!)
  const alert = await waitFor(() => document.querySelector('[role="alert"]'))

  expect(alert.textContent).toBe('This name is already in use.')
  expect(pageText()).not.toContain('uq_gateway_keys')
  // The form stays open so the name can be corrected.
  expect(document.querySelector('#gateway-key-name')).not.toBeNull()
})

it('requires a name before anything is sent', async () => {
  await renderPage()
  await waitFor(() => pageText().includes('chat-default'))
  await openTab('API keys')
  await click(await waitFor(() => button('Create key')))
  await waitFor(() => document.querySelector('#gateway-key-name'))

  await click(button('Create')!)
  const alert = await waitFor(() => document.querySelector('[role="alert"]'))

  expect(alert.textContent).toBe('Enter a name.')
  expect(mocks.createKey).not.toHaveBeenCalled()
})

it('offers no further actions on a revoked key', async () => {
  mocks.listKeys.mockResolvedValue([gatewayKey({ status: 'revoked' })])
  await renderPage()
  await waitFor(() => pageText().includes('chat-default'))
  await openTab('API keys')
  await waitFor(() => pageText().includes('Revoked'))

  for (const label of ['Edit', 'Enable', 'Revoke'])
    expect(button(label)?.disabled).toBe(true)
})
