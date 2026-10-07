import { act, type SetStateAction } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest'
import { dialogAPI } from '@/api/dialog'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import { dialogKeys } from '@/hooks/use-dialog-apps'
import { createInitialConfig } from '../constants'
import { buildChatSaveRequest } from '../save-payload'
import { useCreateAppSave } from '../hooks/use-create-app-save'
import type { AppConfig } from '../types'

const fixture = () => ({
  ...createInitialConfig({ name: 'Test application' }),
  llm_id: 'model-1',
})
function response(config: AppConfig) {
  return {
    ...buildChatSaveRequest(config, ''),
    id: 'app-1',
    kb_ids: config.kb_ids,
  } as Awaited<ReturnType<typeof dialogAPI.getDetail>>
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
let root: Root
let container: HTMLDivElement
let client: QueryClient
let draft: AppConfig
let save!: ReturnType<typeof useCreateAppSave>
let setConfig: Mock<(value: SetStateAction<AppConfig>) => void>
let setId: Mock<(id: string) => void>
let setSaved: Mock<(config: AppConfig, id: string) => void>

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
  vi.spyOn(toast, 'success').mockImplementation(() => 1)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  draft = fixture()
  setConfig = vi.fn((next: SetStateAction<AppConfig>) => {
    draft = typeof next === 'function' ? next(draft) : next
  })
  setId = vi.fn()
  setSaved = vi.fn()
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function mount(id: string | null = 'app-1') {
  function Harness() {
    save = useCreateAppSave({
      getConfig: () => draft,
      setConfig,
      currentDialogId: id,
      setCurrentDialogId: setId,
      setSavedConfig: setSaved,
    })
    return null
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    ),
  )
}

describe('Studio save and readback', () => {
  it('confirms readback before exposing a saved snapshot and updates domain cache', async () => {
    vi.spyOn(dialogAPI, 'updateChat').mockResolvedValue(response(draft))
    vi.spyOn(dialogAPI, 'getDetail').mockResolvedValue(response(draft))
    await mount()
    let result!: Awaited<ReturnType<typeof save.handleSave>>
    await act(async () => {
      result = await save.handleSave()
    })
    expect(result?.id).toBe('app-1')
    expect(save.saveStatus).toBe('saved')
    expect(setSaved).toHaveBeenCalledOnce()
    expect(client.getQueryData(dialogKeys.detail('app-1'))).toBeDefined()
  })
  it('deduplicates simultaneous save clicks', async () => {
    const pending = deferred<Awaited<ReturnType<typeof dialogAPI.updateChat>>>()
    const update = vi
      .spyOn(dialogAPI, 'updateChat')
      .mockReturnValue(pending.promise)
    vi.spyOn(dialogAPI, 'getDetail').mockResolvedValue(response(draft))
    await mount()
    let first!: Promise<unknown>, second!: Promise<unknown>
    await act(async () => {
      first = save.handleSave()
      second = save.handleSave()
    })
    expect(first).toBe(second)
    expect(update).toHaveBeenCalledOnce()
    await act(async () => {
      pending.resolve(response(draft))
      await first
    })
  })
  it('retains edits made while saving and confirms only the submitted snapshot', async () => {
    const submitted = structuredClone(draft)
    const pending = deferred<Awaited<ReturnType<typeof dialogAPI.updateChat>>>()
    vi.spyOn(dialogAPI, 'updateChat').mockReturnValue(pending.promise)
    vi.spyOn(dialogAPI, 'getDetail').mockResolvedValue(response(submitted))
    await mount()
    let task!: Promise<unknown>
    await act(async () => {
      task = save.handleSave()
    })
    draft = { ...draft, name: 'A newer edit' }
    await act(async () => {
      pending.resolve(response(submitted))
      await task
    })
    expect(draft.name).toBe('A newer edit')
    expect(setConfig).not.toHaveBeenCalled()
    expect(setSaved.mock.calls[0][0].name).toBe(submitted.name)
  })
  it('does not create a duplicate application after a failed readback', async () => {
    const create = vi
      .spyOn(dialogAPI, 'createChat')
      .mockResolvedValue(response(draft))
    const update = vi
      .spyOn(dialogAPI, 'updateChat')
      .mockResolvedValue(response(draft))
    vi.spyOn(dialogAPI, 'getDetail')
      .mockRejectedValueOnce(new Error('private details'))
      .mockResolvedValue(response(draft))
    await mount(null)
    await act(async () => {
      expect(await save.handleSave()).toBeNull()
    })
    expect(save.saveStatus).toBe('unconfirmed')
    expect(setId).toHaveBeenCalledWith('app-1')
    expect(setSaved).not.toHaveBeenCalled()
    await act(async () => {
      expect((await save.handleSave())?.id).toBe('app-1')
    })
    expect(create).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
    expect(toast.error).not.toHaveBeenCalledWith(
      expect.stringContaining('private details'),
    )
  })
  it('fails closed when returned configuration does not match the submitted one', async () => {
    vi.spyOn(dialogAPI, 'updateChat').mockResolvedValue(response(draft))
    vi.spyOn(dialogAPI, 'getDetail').mockResolvedValue(
      response({ ...draft, llm_id: 'another-model' }),
    )
    await mount()
    await act(async () => {
      expect(await save.handleSave()).toBeNull()
    })
    expect(save.saveStatus).toBe('unconfirmed')
    expect(setSaved).not.toHaveBeenCalled()
  })
  it('keeps the draft after a submission failure', async () => {
    vi.spyOn(dialogAPI, 'updateChat').mockRejectedValue(
      new Error('credential should not appear'),
    )
    const read = vi.spyOn(dialogAPI, 'getDetail')
    await mount()
    await act(async () => {
      expect(await save.handleSave()).toBeNull()
    })
    expect(save.saveStatus).toBe('failed')
    expect(read).not.toHaveBeenCalled()
    expect(setConfig).not.toHaveBeenCalled()
  })
  it('requires a name and model before making any request', async () => {
    const update = vi.spyOn(dialogAPI, 'updateChat')
    await mount()
    draft = { ...draft, llm_id: '' }
    await act(async () => {
      expect(await save.handleSave()).toBeNull()
    })
    draft = { ...fixture(), name: '  ' }
    await act(async () => {
      expect(await save.handleSave()).toBeNull()
    })
    expect(update).not.toHaveBeenCalled()
  })
})
