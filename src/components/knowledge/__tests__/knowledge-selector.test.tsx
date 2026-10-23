import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { KnowledgeBaseSelector } from '../KnowledgeBaseSelector'
import { knowledgeAPI } from '@/api/knowledge'
import type { KnowledgeBase } from '@/types/api'
import i18n from '@/locales/i18n'

vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: { knowledgeBase: { list: vi.fn(), get: vi.fn() } },
}))
const kb = (id: string, embd_id = 'embedding@A') =>
  ({ id, name: id, embd_id, parser_id: 'naive' }) as KnowledgeBase
let root: Root
let container: HTMLDivElement
let client: QueryClient
let selected: string[]
const Probe = ({ ids = [] }: { ids?: string[] }) => {
  const [value, setValue] = React.useState(ids)
  React.useEffect(() => {
    selected = value
  }, [value])
  return (
    <QueryClientProvider client={client}>
      <KnowledgeBaseSelector
        selectedIds={value}
        knowledgeBases={[]}
        onChange={setValue}
      />
    </QueryClientProvider>
  )
}
const flush = async (ms = 0) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
const click = async (element: Element | null | undefined) => {
  expect(element).toBeTruthy()
  await act(async () => {
    element!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}
const option = (text: string) =>
  [...document.querySelectorAll('[cmdk-item]')].find((el) =>
    el.textContent?.includes(text),
  )
const search = async (text: string) => {
  const input = document.querySelector('[cmdk-input]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await flush(350)
  await flush(30)
}

beforeEach(async () => {
  Object.assign(globalThis, {
    IS_REACT_ACT_ENVIRONMENT: true,
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  })
  Element.prototype.scrollIntoView = vi.fn()
  vi.mocked(knowledgeAPI.knowledgeBase.list)
    .mockReset()
    .mockResolvedValue({ kbs: [kb('original')], total: 1 })
  vi.mocked(knowledgeAPI.knowledgeBase.get).mockReset()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
})
const open = async (ids?: string[]) => {
  await act(async () => root.render(<Probe ids={ids} />))
  await click(container.querySelector('button'))
  await flush(20)
}

it('searches remotely, caches a selected search result, and keeps incompatible models disabled', async () => {
  await open()
  await click(option('original'))
  vi.mocked(knowledgeAPI.knowledgeBase.list).mockResolvedValue({
    kbs: [kb('matching'), kb('incompatible', 'embedding@B')],
    total: 2,
  })
  await search('remote')
  expect(knowledgeAPI.knowledgeBase.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ keywords: 'remote', page: 1 }),
  )
  expect(container.textContent).toContain('original')
  expect(option('incompatible')?.getAttribute('aria-disabled')).toBe('true')
  await click(option('matching'))
  expect(selected).toEqual(['original', 'matching'])
  vi.mocked(knowledgeAPI.knowledgeBase.list).mockResolvedValue({
    kbs: [],
    total: 0,
  })
  await search('absent')
  expect(document.body.textContent).toContain('No matching knowledge bases')
  expect(container.textContent).toContain('matching')
})

it('ignores an older search response and keeps search available for an empty result', async () => {
  await open()
  let resolveOld: (value: {
    kbs: KnowledgeBase[]
    total: number
  }) => void = () => {}
  vi.mocked(knowledgeAPI.knowledgeBase.list).mockImplementation(
    ({ keywords } = {}) =>
      keywords === 'old'
        ? new Promise((resolve) => {
            resolveOld = resolve
          })
        : Promise.resolve({ kbs: [], total: 0 }),
  )
  await search('old')
  expect(document.body.textContent).toContain('Searching')
  await search('new')
  await act(async () => resolveOld({ kbs: [kb('obsolete')], total: 1 }))
  await flush()
  expect(option('obsolete')).toBeUndefined()
  expect(document.querySelector('[cmdk-input]')).toBeTruthy()
})

it('resolves saved selections outside the current page and fails closed while unresolved', async () => {
  let resolveDetail: (value: KnowledgeBase) => void = () => {}
  vi.mocked(knowledgeAPI.knowledgeBase.get).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveDetail = resolve
      }),
  )
  await open(['outside'])
  expect(option('original')?.getAttribute('aria-disabled')).toBe('true')
  await act(async () => resolveDetail(kb('outside', 'embedding@B')))
  await flush(20)
  expect(option('original')?.getAttribute('aria-disabled')).toBe('true')
  expect(knowledgeAPI.knowledgeBase.get).toHaveBeenCalledWith('outside')
})

it('loads subsequent pages using the server total', async () => {
  vi.mocked(knowledgeAPI.knowledgeBase.list).mockImplementation(
    ({ page } = {}) =>
      Promise.resolve({
        kbs: [kb(page === 2 ? 'page-two' : 'page-one')],
        total: 2,
      }),
  )
  await open()
  await click(
    [...document.querySelectorAll('button')].find(
      (el) => el.textContent === 'More',
    ),
  )
  await flush(20)
  expect(option('page-one')).toBeTruthy()
  expect(option('page-two')).toBeTruthy()
})

it('retries server failures and refreshes the selector when dataset lists are invalidated', async () => {
  vi.mocked(knowledgeAPI.knowledgeBase.list).mockRejectedValueOnce(
    new Error('private server detail'),
  )
  await open()
  await click(
    [...document.querySelectorAll('button')].find(
      (el) => el.textContent === 'Retry',
    ),
  )
  await flush(30)
  expect(option('original')).toBeTruthy()
  expect(document.body.textContent).not.toContain('private server detail')
  vi.mocked(knowledgeAPI.knowledgeBase.list).mockResolvedValue({
    kbs: [kb('newly-created')],
    total: 1,
  })
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['knowledge', 'list'] })
  })
  await flush(30)
  expect(option('newly-created')).toBeTruthy()
})
