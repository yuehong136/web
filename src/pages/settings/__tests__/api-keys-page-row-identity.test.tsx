// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  afterEach,
  beforeEach,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import ApiDocumentationPage from '@/pages/settings/ApiKeysPage'
import type { SystemAPIToken } from '@/types/api'

const mocks = vi.hoisted(() => ({
  getTokenList: vi.fn(),
  deleteToken: vi.fn(),
  createToken: vi.fn(),
}))
vi.mock('@/api/system', () => ({ systemAPI: mocks }))
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

let root: Root
let container: HTMLDivElement
let consoleError: MockInstance<typeof console.error>

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  consoleError = vi.spyOn(console, 'error')
  mocks.getTokenList.mockResolvedValue([
    apiKey('First key', 'token-first'),
    apiKey('Second key', 'token-second'),
  ])
  mocks.deleteToken.mockResolvedValue(true)
  mocks.createToken.mockResolvedValue(apiKey('Second key', 'token-new'))
  await setProductLanguage('zh-CN')
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
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
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

const textButton = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent?.trim() === text,
  )!
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
const openRowMenu = async (name: string) => {
  const row = Array.from(
    document.querySelectorAll<HTMLElement>('.divide-y > div'),
  ).find((element) => element.textContent?.includes(name))!
  await click(Array.from(row.querySelectorAll('button')).at(-1)!)
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

it('deletes the token of the clicked row, not the first key of the tenant', async () => {
  await openRowMenu('Second key')
  await click(textButton('删除'))
  expect(mocks.deleteToken).toHaveBeenCalledExactlyOnceWith('token-second')
})

it('regenerates the token of the clicked row', async () => {
  await openRowMenu('Second key')
  await click(textButton('重新生成'))
  expect(mocks.deleteToken).toHaveBeenCalledExactlyOnceWith('token-second')
  expect(mocks.createToken).toHaveBeenCalledExactlyOnceWith({
    name: 'Second key',
    description: null,
  })
})
