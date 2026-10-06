// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  afterEach,
  beforeEach,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import { APIError } from '@/api/client-types'
import { createQueryClient } from '@/lib/query-client'
import { setProductLanguage } from '@/locales/i18n'
import ApiDocumentationPage from '@/pages/settings/ApiKeysPage'
import type { SystemAPIToken } from '@/types/api'

const mocks = vi.hoisted(() => ({
  getTokenList: vi.fn(),
  deleteToken: vi.fn(),
  createToken: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/api/system', () => ({
  systemAPI: {
    getTokenList: mocks.getTokenList,
    deleteToken: mocks.deleteToken,
    createToken: mocks.createToken,
  },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error, warning: mocks.warning },
}))
vi.mock('@/pages/settings/api-documentation-data', async (original) => ({
  ...(await original<
    typeof import('@/pages/settings/api-documentation-data')
  >()),
  loadApiSpecification: async () => ({
    spec: {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1' },
      paths: { '/ping': { get: { operationId: 'ping', summary: 'Ping' } } },
    },
    source: 'static' as const,
  }),
}))
vi.mock('@/hooks/use-environment-request', () => {
  const resolver = {
    currentEnvironment: null,
    selectedEnvironmentId: null,
    selectEnvironment: () => {},
    getVariableMap: () => ({}),
    resolveText: (text: string) => text,
  }
  return { useEnvironmentResolver: () => resolver }
})
vi.mock('@/components/environment', () => ({
  ModernEnvironmentSelector: () => null,
  NewEnvironmentManager: () => null,
}))
vi.mock('@monaco-editor/react', () => ({
  default: () => null,
  loader: { config: () => {} },
}))

const apiKey = (name: string, token: string): SystemAPIToken => ({
  tenant_id: 'shared-tenant',
  token,
  beta: '',
  name,
  create_time: 1,
  create_date: '2026-01-01T00:00:00Z',
  update_time: null,
  update_date: null,
})
const serverError = () => new APIError(500, 'SERVER_ERROR', 'token-second')

let root: Root
let container: HTMLDivElement
let consoleError: MockInstance<typeof console.error>
let nativeConfirm: MockInstance<typeof window.confirm>

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  nativeConfirm = vi.spyOn(window, 'confirm')
  consoleError = vi.spyOn(console, 'error')
  mocks.getTokenList.mockResolvedValue([
    apiKey('First key', 'token-first'),
    apiKey('Second key', 'token-second'),
  ])
  mocks.deleteToken.mockResolvedValue(true)
  mocks.createToken.mockResolvedValue(apiKey('Second key', 'token-new'))
  await setProductLanguage('zh-CN')
  const client = createQueryClient({ notifyMutationError: mocks.notify })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ApiDocumentationPage />
      </QueryClientProvider>,
    ),
  )
  await click(await waitFor(() => textButton('API Key')))
  await waitFor(() => document.querySelector('.divide-y > div'))
})
afterEach(async () => {
  expect(nativeConfirm).not.toHaveBeenCalled()
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

const textButton = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent?.trim() === text,
  )!
const rowTrigger = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const menuItem = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
    (element) => element.textContent === text,
  )!
const alertDialog = () => document.querySelector('[role="alertdialog"]')
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
  await flush()
}
const waitFor = async <T,>(find: () => T | null | undefined) => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const found = find()
    if (found) return found
    await flush()
  }
  throw new Error('Timed out waiting for element')
}
const openRowMenu = (label = 'Second key 的操作') =>
  act(async () => {
    const trigger = rowTrigger(label)
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
const requestAction = async (item: string, label?: string) => {
  await openRowMenu(label)
  await click(menuItem(item))
}

it('gives each key its own row identity even when keys share a tenant_id', () => {
  const rows = Array.from(document.querySelectorAll('.divide-y > div'))
  expect(rows.map((row) => row.textContent)).toEqual([
    expect.stringContaining('First key'),
    expect.stringContaining('Second key'),
  ])
  const messages = consoleError.mock.calls.map((args) => args.join(' '))
  expect(messages.filter((message) => message.includes('same key'))).toEqual([])
})

it('confirms deletion in an alert dialog, cancels without deleting, and restores focus', async () => {
  await requestAction('删除')
  expect(alertDialog()?.textContent).toContain('Second key')
  expect(mocks.deleteToken).not.toHaveBeenCalled()
  await click(textButton('取消'))
  expect(alertDialog()).toBeNull()
  expect(document.activeElement).toBe(rowTrigger('Second key 的操作'))
  expect(mocks.deleteToken).not.toHaveBeenCalled()

  await requestAction('删除')
  await click(textButton('确认删除'))
  expect(mocks.deleteToken).toHaveBeenCalledExactlyOnceWith('token-second')
  expect(alertDialog()).toBeNull()
  expect(mocks.success).toHaveBeenCalledWith('API Key 已删除')
  await waitFor(() => mocks.getTokenList.mock.calls.length === 2)
})

it('keeps a failed deletion open for retry with safe global feedback', async () => {
  mocks.deleteToken.mockRejectedValueOnce(serverError())
  await requestAction('删除')
  await click(textButton('确认删除'))
  expect(alertDialog()).toBeTruthy()
  expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ messageKey: 'common.errors.serverError' }),
  )
  await click(textButton('确认删除'))
  expect(mocks.deleteToken).toHaveBeenCalledTimes(2)
  expect(alertDialog()).toBeNull()
})

it('regenerates by creating the replacement before revoking the old token', async () => {
  await requestAction('重新生成')
  expect(alertDialog()?.textContent).toContain('Second key')
  expect(mocks.createToken).not.toHaveBeenCalled()
  await click(textButton('确认重新生成'))
  expect(mocks.createToken).toHaveBeenCalledExactlyOnceWith({
    name: 'Second key',
    description: null,
  })
  expect(mocks.deleteToken).toHaveBeenCalledExactlyOnceWith('token-second')
  expect(mocks.createToken.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.deleteToken.mock.invocationCallOrder[0],
  )
  expect(alertDialog()).toBeNull()
  expect(mocks.success).toHaveBeenCalledWith('已生成新的 API Key，旧令牌已撤销')
})

it('leaves the existing key untouched when creating the replacement fails', async () => {
  mocks.createToken.mockRejectedValueOnce(serverError())
  await requestAction('重新生成')
  await click(textButton('确认重新生成'))
  expect(mocks.deleteToken).not.toHaveBeenCalled()
  expect(mocks.error).toHaveBeenCalledExactlyOnceWith(
    '重新生成失败，原 API Key 未受影响',
  )
  expect(mocks.notify).not.toHaveBeenCalled()
  expect(alertDialog()).toBeTruthy()
})

it('surfaces a partial regeneration and offers to retry revoking only the old token', async () => {
  mocks.deleteToken.mockRejectedValueOnce(serverError())
  await requestAction('重新生成')
  await click(textButton('确认重新生成'))
  // Closing prevents a second confirm from minting yet another key.
  expect(alertDialog()).toBeNull()
  expect(mocks.createToken).toHaveBeenCalledOnce()
  expect(mocks.notify).not.toHaveBeenCalled()
  expect(mocks.warning).toHaveBeenCalledOnce()
  const [message, options] = mocks.warning.mock.calls[0]
  expect(message).toBe('已生成新的 API Key，但旧令牌未能撤销，仍然有效')
  expect(JSON.stringify([message, options])).not.toMatch(/token-(second|new)/)
  await waitFor(() => mocks.getTokenList.mock.calls.length === 2)

  await act(async () => options.action.onClick())
  await flush()
  expect(mocks.deleteToken).toHaveBeenLastCalledWith('token-second')
  expect(mocks.deleteToken).toHaveBeenCalledTimes(2)
  expect(mocks.success).toHaveBeenCalledWith('旧令牌已撤销')
})

it('dismisses only the confirmation on Escape, keeping the key manager open', async () => {
  await requestAction('删除')
  await act(async () => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
  })
  await flush()
  expect(alertDialog()).toBeNull()
  expect(document.querySelectorAll('.divide-y > div')).toHaveLength(2)
  expect(document.activeElement).toBe(rowTrigger('Second key 的操作'))
  expect(mocks.deleteToken).not.toHaveBeenCalled()
})

it('renders the row actions and confirmation in English', async () => {
  await act(async () => setProductLanguage('en-US'))
  await openRowMenu('Actions for Second key')
  expect(menuItem('Regenerate')).toBeTruthy()
  await click(menuItem('Delete'))
  expect(alertDialog()?.textContent).toContain('Delete API key')
  expect(alertDialog()?.textContent).toContain('"Second key"')
  expect(textButton('Cancel')).toBeTruthy()
  await click(textButton('Delete key'))
  expect(mocks.success).toHaveBeenCalledWith('API key deleted')
})
