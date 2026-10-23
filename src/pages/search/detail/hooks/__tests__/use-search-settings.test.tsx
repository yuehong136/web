import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { searchAPI } from '@/api/search'
import { setProductLanguage } from '@/locales/i18n'
import { toast } from '@/lib/toast'
import type { UpdateSearchRequest } from '@/types'
import type { SearchApp, SearchConfig } from '@/types/search'
import { useSearchSettings } from '../useSearchSettings'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const makeApp = (
  id = 'A',
  topK = 10,
  tenantId = `tenant-${id}`,
): SearchApp => ({
  id,
  tenant_id: tenantId,
  name: `App ${id}`,
  description: 'Saved description',
  avatar: '',
  create_time: 0,
  update_time: 1,
  search_config: {
    kb_ids: [`kb-${id}`],
    top_k: topK,
    similarity_threshold: 0.2,
    vector_similarity_weight: 0.3,
    summary: false,
    related_search: false,
    use_rerank: false,
    use_kg: false,
  },
})
const acknowledge = (request: UpdateSearchRequest): SearchApp => ({
  ...makeApp(request.search_id, 10, request.tenant_id),
  name: request.name,
  description: request.description || '',
  avatar: request.avatar,
  search_config: request.search_config as unknown as SearchConfig,
  update_time: 2,
})
const deferred = <Value,>() => {
  let resolve!: (value: Value) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<Value>((accept, fail) => {
    resolve = accept
    reject = fail
  })
  return { promise, resolve, reject }
}

let root: Root
let container: HTMLDivElement
let client: QueryClient
let mounted: boolean
let current: ReturnType<typeof useSearchSettings>
function Surface({ value }: { value: SearchApp | null }) {
  const settings = useSearchSettings(value)
  useLayoutEffect(() => {
    current = settings
  }, [settings])
  return (
    <output>
      {JSON.stringify({
        draft: settings.config,
        applied: settings.appliedConfig,
      })}
    </output>
  )
}
const renderApp = async (value: SearchApp | null) => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Surface value={value} />
      </QueryClientProvider>,
    ),
  )
}
const startSave = async () => {
  let pending!: Promise<void>
  await act(async () => {
    pending = current.saveConfig()
  })
  return { pending }
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  mounted = true
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})
afterEach(async () => {
  if (mounted) await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('applies only the acknowledged server configuration, including normalized basic info', async () => {
  const update = vi
    .spyOn(searchAPI, 'update')
    .mockImplementation(async (request) => ({
      ...acknowledge(request),
      search_config: { ...makeApp().search_config, top_k: 12 },
    }))
  await renderApp(makeApp())
  await act(async () => {
    current.updateConfig({ top_k: 11 })
    current.updateBasicInfo({
      name: '  New name  ',
      description: '  Description  ',
    })
  })
  expect(current.appliedConfig.top_k).toBe(10)
  expect(current.isDirty).toBe(true)
  await act(async () => current.saveConfig())
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'New name',
      description: 'Description',
      search_config: expect.objectContaining({ top_k: 11 }),
    }),
  )
  expect(current.appliedConfig.top_k).toBe(12)
  expect(current.config.top_k).toBe(12)
  expect(current.basicInfo.name).toBe('New name')
  expect(current.basicInfo.description).toBe('Description')
  expect(current.isDirty).toBe(false)
  expect(current.isSaving).toBe(false)
  expect(toast.success).toHaveBeenCalledTimes(1)
})

it('keeps edits made during a save as a dirty draft above the acknowledged baseline', async () => {
  const result = deferred<SearchApp>()
  const update = vi.spyOn(searchAPI, 'update').mockReturnValue(result.promise)
  await renderApp(makeApp())
  await act(async () => current.updateConfig({ top_k: 11 }))
  const { pending } = await startSave()
  expect(current.isSaving).toBe(true)
  await act(async () => {
    current.updateConfig({ top_k: 22 })
    current.updateBasicInfo({ name: 'Next draft' })
  })
  await act(async () => {
    result.resolve(acknowledge(update.mock.calls[0][0]))
    await pending
  })
  expect(current.appliedConfig.top_k).toBe(11)
  expect(current.config.top_k).toBe(22)
  expect(current.basicInfo.name).toBe('Next draft')
  expect(current.isDirty).toBe(true)
  expect(current.isSaving).toBe(false)
  await act(async () => {
    current.updateConfig({ top_k: 11 })
    current.updateBasicInfo({ name: 'App A' })
  })
  expect(current.isDirty).toBe(false)
})

it.each([makeApp('B'), makeApp('A', 20, 'other-tenant')])(
  'isolates an old save from another app or tenant, while the current scope can save',
  async (nextApp) => {
    const oldResult = deferred<SearchApp>()
    const nextResult = deferred<SearchApp>()
    const update = vi
      .spyOn(searchAPI, 'update')
      .mockReturnValueOnce(oldResult.promise)
      .mockReturnValueOnce(nextResult.promise)
    await renderApp(makeApp())
    await act(async () => current.updateConfig({ top_k: 11 }))
    const { pending: oldPending } = await startSave()
    await renderApp(nextApp)
    expect(current.config.kb_ids).toEqual(nextApp.search_config.kb_ids)
    expect(current.isSaving).toBe(false)
    await act(async () => current.updateConfig({ top_k: 44 }))
    const { pending: nextPending } = await startSave()
    await act(async () => {
      oldResult.resolve(acknowledge(update.mock.calls[0][0]))
      await oldPending
    })
    expect(current.config.top_k).toBe(44)
    expect(current.appliedConfig.top_k).toBe(nextApp.search_config.top_k)
    expect(current.isSaving).toBe(true)
    expect(toast.success).not.toHaveBeenCalled()
    await act(async () => {
      nextResult.resolve(acknowledge(update.mock.calls[1][0]))
      await nextPending
    })
    expect(current.appliedConfig.top_k).toBe(44)
    expect(current.isDirty).toBe(false)
    expect(toast.success).toHaveBeenCalledTimes(1)
  },
)

it('keeps an unsaved draft across a same-app query refetch', async () => {
  await renderApp(makeApp())
  await act(async () => {
    current.updateConfig({ top_k: 22 })
    current.updateBasicInfo({ description: 'Unsaved description' })
  })
  await renderApp({ ...makeApp('A', 12), update_time: 2 })
  expect(current.config.top_k).toBe(22)
  expect(current.basicInfo.description).toBe('Unsaved description')
  expect(current.appliedConfig.top_k).toBe(12)
  expect(current.isDirty).toBe(true)
})

it('does not let refetches race an in-flight save or roll back a newer acknowledgement', async () => {
  const result = deferred<SearchApp>()
  const update = vi.spyOn(searchAPI, 'update').mockReturnValue(result.promise)
  await renderApp(makeApp())
  await act(async () => current.updateConfig({ top_k: 11 }))
  const { pending } = await startSave()
  await renderApp({ ...makeApp('A', 9), update_time: 1 })
  expect(current.config.top_k).toBe(11)
  expect(current.appliedConfig.top_k).toBe(10)
  expect(current.isSaving).toBe(true)
  await act(async () => {
    result.resolve(acknowledge(update.mock.calls[0][0]))
    await pending
  })
  await renderApp({ ...makeApp('A', 8), update_time: 1 })
  expect(current.config.top_k).toBe(11)
  expect(current.appliedConfig.top_k).toBe(11)
  expect(current.isDirty).toBe(false)
})

it('updates a clean form from a newer confirmed query result', async () => {
  await renderApp(makeApp())
  await renderApp({ ...makeApp('A', 12), name: 'Server name', update_time: 2 })
  expect(current.config.top_k).toBe(12)
  expect(current.basicInfo.name).toBe('Server name')
  expect(current.isDirty).toBe(false)
})

it('ignores duplicate saves before React renders the pending state', async () => {
  const result = deferred<SearchApp>()
  const update = vi.spyOn(searchAPI, 'update').mockReturnValue(result.promise)
  await renderApp(makeApp())
  let pending!: Promise<void>
  await act(async () => {
    pending = current.saveConfig()
    await current.saveConfig()
  })
  expect(update).toHaveBeenCalledTimes(1)
  expect(current.isSaving).toBe(true)
  await act(async () => {
    result.resolve(acknowledge(update.mock.calls[0][0]))
    await pending
  })
  expect(toast.success).toHaveBeenCalledTimes(1)
})

it.each([
  undefined,
  null,
  true,
  {},
  makeApp('B'),
  makeApp('A', 10, 'other-tenant'),
  {
    ...makeApp(),
    search_config: [],
  },
])(
  'does not synthesize success from an absent, malformed or mismatched acknowledgement (%j)',
  async (response) => {
    vi.spyOn(searchAPI, 'update').mockResolvedValue(response as SearchApp)
    await renderApp(makeApp())
    await act(async () => current.updateConfig({ top_k: 22 }))
    await act(async () => current.saveConfig())
    expect(current.config.top_k).toBe(22)
    expect(current.appliedConfig.top_k).toBe(10)
    expect(current.isDirty).toBe(true)
    expect(current.isSaving).toBe(false)
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledTimes(1)
  },
)

it('retains the draft and confirmed config after failure, and permits an explicit retry', async () => {
  const update = vi
    .spyOn(searchAPI, 'update')
    .mockRejectedValueOnce(new Error('private backend detail'))
    .mockImplementationOnce(async (request) => acknowledge(request))
  await renderApp(makeApp())
  await act(async () => current.updateConfig({ top_k: 22 }))
  await act(async () => current.saveConfig())
  expect(current.config.top_k).toBe(22)
  expect(current.appliedConfig.top_k).toBe(10)
  expect(current.isSaving).toBe(false)
  expect(JSON.stringify(vi.mocked(toast.error).mock.calls)).not.toContain(
    'private backend detail',
  )
  await act(async () => current.saveConfig())
  expect(update).toHaveBeenCalledTimes(2)
  expect(current.appliedConfig.top_k).toBe(22)
  expect(current.isDirty).toBe(false)
})

it.each(['success', 'failure'] as const)(
  'ignores a save finishing after unmount (%s)',
  async (outcome) => {
    const result = deferred<SearchApp>()
    const update = vi.spyOn(searchAPI, 'update').mockReturnValue(result.promise)
    await renderApp(makeApp())
    const { pending } = await startSave()
    await act(async () => root.unmount())
    mounted = false
    await act(async () => {
      if (outcome === 'success')
        result.resolve(acknowledge(update.mock.calls[0][0]))
      else result.reject(new Error('private late failure'))
      await pending
    })
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  },
)

it('rejects retained callbacks from a previous visit to the same app', async () => {
  const update = vi.spyOn(searchAPI, 'update')
  await renderApp(makeApp())
  const previous = current
  await renderApp(makeApp('B'))
  await renderApp(makeApp())
  await act(async () => {
    previous.updateConfig({ top_k: 99 })
    previous.updateBasicInfo({ name: 'Old visit' })
    await previous.saveConfig()
  })
  expect(current.config.top_k).toBe(10)
  expect(current.basicInfo.name).toBe('App A')
  expect(update).not.toHaveBeenCalled()
})

it('clears an absent scope and validates required inputs without sending a request', async () => {
  const update = vi.spyOn(searchAPI, 'update')
  await renderApp(makeApp())
  await renderApp(null)
  expect(current.config.kb_ids).toEqual([])
  expect(current.basicInfo.name).toBe('')
  await act(async () => current.saveConfig())
  await renderApp(makeApp())
  await act(async () => current.updateConfig({ kb_ids: [] }))
  await act(async () => current.saveConfig())
  await act(async () => {
    current.updateConfig({ kb_ids: ['kb-A'] })
    current.updateBasicInfo({ name: '  ' })
  })
  await act(async () => current.saveConfig())
  expect(update).not.toHaveBeenCalled()
  expect(toast.error).toHaveBeenCalledTimes(2)
})
