import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { UsedModels } from '../used-models'
import { modelProviderKeys } from '@/hooks/use-model-provider-request'
import i18n from '@/locales/i18n'

const mocks = vi.hoisted(() => ({
  providers: vi.fn(),
  instances: vi.fn(),
  models: vi.fn(),
}))
vi.mock('@/api/llm-providers', () => ({ modelProvidersAPI: mocks }))
let root: Root, container: HTMLDivElement, client: QueryClient
const add = vi.fn()
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const render = () =>
  act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <UsedModels handleAddModel={add} />
      </QueryClientProvider>,
    ),
  )
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.resetAllMocks()
  await i18n.changeLanguage('en-US')
  mocks.providers.mockResolvedValue([{ name: 'OpenAI' }])
  mocks.models.mockResolvedValue([])
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.unstubAllGlobals()
})

it('hides a provider only after the real instances query confirms an empty list', async () => {
  let resolve!: (instances: unknown[]) => void
  mocks.instances.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    }),
  )
  await render()
  await flush()
  expect(mocks.instances).toHaveBeenCalledWith(
    'OpenAI',
    expect.any(AbortSignal),
  )
  expect(container.querySelector('article')?.textContent).toContain('OpenAI')
  expect(container.textContent).toContain('Loading')
  await act(async () => resolve([]))
  await flush()
  expect(container.querySelector('article')).toBeNull()
  expect(add).not.toHaveBeenCalled()
})

it('keeps a failed instances query visible and retries to a populated provider', async () => {
  mocks.instances.mockRejectedValueOnce(new Error('private provider detail'))
  mocks.instances.mockResolvedValueOnce([
    {
      id: 'instance-a',
      provider_id: 'provider-a',
      provider_name: 'OpenAI',
      instance_name: 'Primary connection',
      has_api_key: true,
      base_url: 'https://fixture.invalid',
      region: '',
      status: 'active',
    },
  ])
  await render()
  await flush()
  await flush()
  expect(container.querySelector('article')?.textContent).toContain('OpenAI')
  expect(container.textContent).not.toContain('private provider detail')
  const retry = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Retry',
  )!
  expect(retry).toBeDefined()
  await act(async () => retry.click())
  await flush()
  expect(container.textContent).toContain('Primary connection')
  expect(mocks.instances).toHaveBeenCalledTimes(2)
})

it('shows a refetch error even when a previous successful instances list was empty', async () => {
  mocks.instances.mockResolvedValueOnce([])
  await render()
  await flush()
  await flush()
  expect(container.querySelector('article')).toBeNull()
  mocks.instances.mockRejectedValueOnce(new Error('private failure'))
  await act(async () =>
    client.refetchQueries({ queryKey: modelProviderKeys.instances('OpenAI') }),
  )
  await flush()
  expect(container.querySelector('article')?.textContent).toContain('Retry')
})
