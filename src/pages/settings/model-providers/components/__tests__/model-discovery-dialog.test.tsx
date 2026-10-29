import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ModelDiscoveryDialog } from '../model-discovery-dialog'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api/client'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
import i18n from '@/locales/i18n'

const mocks = vi.hoisted(() => ({
  discover: vi.fn(),
  verify: vi.fn(),
  create: vi.fn(),
}))
vi.mock('@/api/llm-providers', () => ({
  modelProvidersAPI: {
    discoverModels: mocks.discover,
    verifyConnection: mocks.verify,
    createInstance: mocks.create,
  },
}))
const model = (name: string, display: string, source = 'remote') => ({
  model_name: name,
  display_name: display,
  model_types: ['chat', 'image2text'],
  max_tokens: 0,
  is_tools: true,
  features: ['thinking'],
  source,
})
const rows = [
  model('stable-a', 'First model'),
  model('stable-b', 'Second model', 'static'),
]
let root: Root, container: HTMLDivElement, client: QueryClient
let native: ReturnType<typeof stubNativeDialog>
const close = vi.fn()
const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent === label,
  )!
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
}
const change = async (id: string, value: string) => {
  await act(async () => {
    const input = document.getElementById(id)!
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const choose = (label: string) =>
  click(
    document.querySelector<HTMLButtonElement>(
      `[role=checkbox][aria-label="${label}"]`,
    )!,
  )
const render = async (configureManually?: () => void) =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ModelDiscoveryDialog
          provider="Ollama"
          close={close}
          configureManually={configureManually}
        />
      </QueryClientProvider>,
    ),
  )
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.clearAllMocks()
  native = stubNativeDialog()
  useAuthStore.setState({ user: { id: 'discovery-owner' } as never })
  apiClient.setAuthToken('discovery-owner')
  await i18n.changeLanguage('en-US')
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  mocks.discover.mockResolvedValue({
    items: rows,
    total: 2,
    page: 1,
    page_size: 100,
  })
  mocks.verify.mockResolvedValue({
    verified: true,
    model_name: 'stable-a',
    model_type: 'chat',
  })
  mocks.create.mockResolvedValue({ id: 'created' })
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  apiClient.setAuthToken(null)
  native.restore()
  vi.unstubAllGlobals()
})

it('keeps discovery separate from registration and verifies the selected typed candidate before atomic creation', async () => {
  await render()
  await change('discovery-instance-name', '  test connection  ')
  await change('discovery-key', 'synthetic-private-key')
  await click(button('Find models'))
  expect(mocks.discover).toHaveBeenCalledWith(
    'Ollama',
    {
      api_key: 'synthetic-private-key',
      base_url: 'http://127.0.0.1:11434',
      region: '',
    },
    1,
    expect.any(AbortSignal),
  )
  expect(mocks.create).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain('Vision')
  expect(document.body.textContent).toContain('Tool calling')
  expect(document.body.textContent).toContain('Reasoning')
  await choose('First model')
  await choose('Second model')
  expect(button('Save').disabled).toBe(true)
  await click(button('Test connection'))
  const candidate = {
    api_key: 'synthetic-private-key',
    base_url: 'http://127.0.0.1:11434',
    region: '',
    model_ids: [],
    custom_models: rows.map(
      ({ model_name, model_types, max_tokens, is_tools }) => ({
        model_name,
        model_types,
        max_tokens,
        is_tools,
      }),
    ),
  }
  expect(mocks.verify).toHaveBeenCalledWith(
    'Ollama',
    candidate,
    expect.any(AbortSignal),
  )
  expect(document.body.textContent).toContain('Connection verified')
  await click(button('Save'))
  expect(mocks.create).toHaveBeenCalledWith(
    'Ollama',
    { instance_name: 'test connection', ...candidate },
    expect.any(AbortSignal),
  )
  expect(close).toHaveBeenCalledOnce()
  expect(JSON.stringify(client.getQueryCache().getAll())).not.toContain(
    'synthetic-private-key',
  )
})

it('shows pending, safe failure and confirmed empty distinctly and retries without registering models', async () => {
  let reject!: (error: Error) => void
  mocks.discover.mockReturnValueOnce(
    new Promise((_resolve, fail) => {
      reject = fail
    }),
  )
  await render()
  await click(button('Find models'))
  expect(document.body.textContent).toContain('Finding models')
  expect(document.body.textContent).not.toContain('No models found')
  await act(async () =>
    reject(new Error('secret provider error synthetic-private-key')),
  )
  expect(document.body.textContent).toContain('Could not find models')
  expect(document.body.textContent).not.toContain('secret provider error')
  expect(document.body.textContent).not.toContain('No models found')
  mocks.discover.mockResolvedValueOnce({
    items: [],
    total: 0,
    page: 1,
    page_size: 100,
  })
  await click(button('Retry'))
  expect(document.body.textContent).toContain('No models found')
  expect(mocks.verify).not.toHaveBeenCalled()
  expect(mocks.create).not.toHaveBeenCalled()
})

it('invalidates verification after a selection change and discards candidates after credentials change', async () => {
  await render()
  await change('discovery-instance-name', 'name')
  await click(button('Find models'))
  await choose('First model')
  await click(button('Test connection'))
  expect(button('Save').disabled).toBe(false)
  await choose('Second model')
  expect(button('Save').disabled).toBe(true)
  expect(document.body.textContent).not.toContain('Connection verified')
  await change('discovery-url', 'http://127.0.0.1:11435')
  expect(document.querySelector('[role=checkbox]')).toBeNull()
  expect(button('Test connection').disabled).toBe(true)
})

it('retains selection across explicit pages and clears private form state on owner changes', async () => {
  mocks.discover.mockResolvedValueOnce({
    items: [rows[0]],
    total: 101,
    page: 1,
    page_size: 100,
  })
  mocks.discover.mockResolvedValueOnce({
    items: [rows[1]],
    total: 101,
    page: 2,
    page_size: 100,
  })
  await render()
  await change('discovery-key', 'synthetic-owner-private-key')
  await click(button('Find models'))
  await choose('First model')
  await click(button('Next'))
  await choose('Second model')
  expect(document.body.textContent).toContain('2 models selected')
  await act(async () =>
    useAuthStore.setState({ user: { id: 'new-owner' } as never }),
  )
  expect(
    (document.getElementById('discovery-key') as HTMLInputElement).value,
  ).toBe('')
  expect(document.querySelector('[role=checkbox]')).toBeNull()
  expect(button('Test connection').disabled).toBe(true)
})

it('aborts discovery on owner changes and ignores the previous owner response', async () => {
  let resolve!: (value: unknown) => void
  mocks.discover.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    }),
  )
  await render()
  await change('discovery-key', 'synthetic-old-owner-key')
  await click(button('Find models'))
  const signal = mocks.discover.mock.calls[0][3] as AbortSignal
  await act(async () =>
    useAuthStore.setState({ user: { id: 'next-owner' } as never }),
  )
  expect(signal.aborted).toBe(true)
  await act(async () =>
    resolve({ items: rows, total: 2, page: 1, page_size: 100 }),
  )
  expect(document.querySelector('[role=checkbox]')).toBeNull()
  expect(
    (document.getElementById('discovery-key') as HTMLInputElement).value,
  ).toBe('')
  expect(mocks.verify).not.toHaveBeenCalled()
  expect(mocks.create).not.toHaveBeenCalled()
})

it('offers manual configuration without discovering, verifying or registering models', async () => {
  const configureManually = vi.fn()
  await render(configureManually)
  await click(button('Configure manually'))
  expect(configureManually).toHaveBeenCalledOnce()
  expect(close).not.toHaveBeenCalled()
  expect(mocks.discover).not.toHaveBeenCalled()
  expect(mocks.verify).not.toHaveBeenCalled()
  expect(mocks.create).not.toHaveBeenCalled()
})
