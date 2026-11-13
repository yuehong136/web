import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { UsedModels } from '../used-models'
import { modelProviderKeys } from '@/hooks/use-model-provider-request'
import i18n from '@/locales/i18n'
import { APIError } from '@/api/client'
import { modelDeletionReferences } from '@/api/llm-reference-error'

const mocks = vi.hoisted(() => ({
  providers: vi.fn(),
  instances: vi.fn(),
  models: vi.fn(),
  deleteProvider: vi.fn(),
  deleteInstance: vi.fn(),
  deleteModel: vi.fn(),
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

it.each(['en-US', 'zh-CN'])(
  'lists typed deletion references inside the open confirmation in %s',
  async (language) => {
    await i18n.changeLanguage(language)
    mocks.providers.mockResolvedValue([{ name: 'ZHIPU-AI' }])
    mocks.instances.mockResolvedValue([
      {
        id: 'instance-a',
        provider_id: 'provider-a',
        provider_name: 'ZHIPU-AI',
        instance_name: 'default',
        has_api_key: true,
        base_url: '',
        region: '',
        status: 'active',
      },
    ])
    mocks.deleteProvider.mockRejectedValue(
      new APIError(409, 'MODEL_REFERENCED', 'private server message', {
        references: [
          {
            resource_type: 'Knowledgebase',
            resource_id: 'dataset-a',
            resource_name: 'stream_citation_e2e',
            model_names: ['glm-5-turbo'],
            is_deleted: false,
          },
          {
            resource_type: 'Dialog',
            resource_id: 'chat-a',
            resource_name: 'Old chat',
            model_names: ['glm-4-airx'],
            is_deleted: true,
          },
          {
            resource_type: 'UserCanvasVersion',
            resource_id: 'version-a',
            resource_name: '<img src=x onerror=alert(1)>',
            model_names: ['glm-5-turbo'],
            is_deleted: false,
          },
        ],
      }),
    )
    await render()
    await flush()
    await flush()
    const providerDelete = container.querySelector(
      'article header button:last-child',
    ) as HTMLButtonElement
    await act(async () => providerDelete.click())
    const dialog = document.querySelector('[role="alertdialog"]')!
    await act(async () =>
      (dialog.querySelector('button:last-child') as HTMLButtonElement).click(),
    )
    await flush()
    await flush()
    expect(mocks.deleteProvider).toHaveBeenCalledWith('ZHIPU-AI')
    const alert = dialog.querySelector('[role="alert"]')!
    expect(alert.querySelectorAll('li')).toHaveLength(3)
    expect(alert.textContent).toContain('stream_citation_e2e')
    expect(alert.textContent).toContain('glm-5-turbo')
    expect(alert.textContent).toContain('glm-4-airx')
    expect(alert.textContent).toContain(
      language === 'zh-CN' ? '已删除的配置' : 'deleted configuration',
    )
    expect(alert.textContent).toContain(
      language === 'zh-CN' ? '当前发布版本' : 'current published version',
    )
    expect(alert.textContent).not.toContain('private server message')
    expect(alert.querySelector('img')).toBeNull()
    expect(dialog.isConnected).toBe(true)
  },
)

it('rejects malformed or unrelated error details instead of rendering arbitrary server data', () => {
  expect(
    modelDeletionReferences(
      new APIError(409, 'MODEL_REFERENCED', 'private', {
        references: [{ secret: 'hidden' }],
      }),
    ),
  ).toBeNull()
  expect(
    modelDeletionReferences(
      new APIError(500, 'MODEL_REFERENCED', 'private', { references: [] }),
    ),
  ).toBeNull()
  expect(modelDeletionReferences(new Error('private'))).toBeNull()
})

it.each(['instance', 'model'])(
  'keeps %s deletion references visible in its own confirmation',
  async (scope) => {
    mocks.instances.mockResolvedValue([
      {
        id: 'instance-a',
        provider_id: 'provider-a',
        provider_name: 'OpenAI',
        instance_name: 'default',
        has_api_key: true,
        base_url: '',
        region: '',
        status: 'active',
      },
    ])
    mocks.models.mockResolvedValue([
      {
        id: 1,
        instance_id: 'instance-a',
        name: 'Referenced model',
        model_types: ['chat'],
        status: 'active',
        is_tools: false,
      },
    ])
    const operation =
      scope === 'instance' ? mocks.deleteInstance : mocks.deleteModel
    operation.mockRejectedValue(
      new APIError(409, 'MODEL_REFERENCED', 'private', {
        references: [
          {
            resource_type: 'UserCanvasVersion',
            resource_id: 'version-a',
            resource_name: 'Historical agent',
            model_names: ['Referenced model'],
            is_deleted: false,
          },
        ],
      }),
    )
    await render()
    await flush()
    await flush()
    if (scope === 'instance') {
      const button = [
        ...container.querySelectorAll('article section button'),
      ].find((button) => button.textContent === 'Delete') as HTMLButtonElement
      await act(async () => button.click())
    } else {
      await vi.waitFor(() =>
        expect(container.querySelector('article section li')).not.toBeNull(),
      )
      const actions = [
        ...container.querySelectorAll('article section li button'),
      ].at(-1) as HTMLButtonElement
      await act(async () => actions.click())
      const remove = [
        ...document.querySelectorAll(
          '[data-radix-popper-content-wrapper] button',
        ),
      ].find((button) => button.textContent === 'Delete') as HTMLButtonElement
      await act(async () => remove.click())
    }
    const dialog = document.querySelector('[role="alertdialog"]')!
    await act(async () =>
      (dialog.querySelector('button:last-child') as HTMLButtonElement).click(),
    )
    await flush()
    await flush()
    expect(operation).toHaveBeenCalledWith(
      'OpenAI',
      'default',
      ...(scope === 'model' ? [1] : []),
    )
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain(
      'Historical agent',
    )
    expect(dialog.querySelector('[role="alert"]')?.textContent).toContain(
      'Referenced model',
    )
    expect(dialog.isConnected).toBe(true)
  },
)
