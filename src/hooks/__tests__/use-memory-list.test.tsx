import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import type { RequestConfig } from '@/api/client-types'
import type { MemoryListResponse } from '@/types/memory'
import { memoryKeys, useAllMemoryList } from '../use-memory'

type Call = { page: number; signal: AbortSignal | null | undefined }
let root: Root, client: QueryClient, calls: Call[]
let resolveSecond: (value: MemoryListResponse) => void
const listKey = () =>
  memoryKeys.list({ page: 1, page_size: Number.MAX_SAFE_INTEGER })
const pageData = (page: number) =>
  ({
    memory_list: Array.from({ length: 100 }, (_, index) => ({
      id: `memory-${(page - 1) * 100 + index + 1}`,
    })),
    total_count: 300,
  }) as MemoryListResponse

function Probe() {
  const query = useAllMemoryList()
  return <output>{query.data?.memory_list.length ?? 0}</output>
}
async function render(observers = 1) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        {Array.from({ length: observers }, (_, index) => (
          <Probe key={index} />
        ))}
      </QueryClientProvider>,
    ),
  )
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
async function waitForSecondPage() {
  await vi.waitFor(() => expect(calls.map((call) => call.page)).toEqual([1, 2]))
  expect(calls[0].signal).toBeInstanceOf(AbortSignal)
  expect(calls[1].signal).toBe(calls[0].signal)
  expect(calls[1].signal?.aborted).toBe(false)
}
async function deliverSecondPage() {
  await act(async () => resolveSecond(pageData(2)))
  await settle()
}

beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  root = createRoot(document.createElement('div'))
  calls = []
  const secondPage = new Promise<MemoryListResponse>((resolve) => {
    resolveSecond = resolve
  })
  vi.spyOn(apiClient, 'get').mockImplementation(
    async <T,>(endpoint: string, config?: RequestConfig): Promise<T> => {
      const url = new URL(endpoint, 'https://memory-fixture.invalid')
      expect(url.pathname).toBe('/memories')
      expect(url.searchParams.get('page_size')).toBe('100')
      const page = Number(url.searchParams.get('page'))
      calls.push({ page, signal: config?.signal })
      return (page === 2 ? await secondPage : pageData(page)) as T
    },
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  vi.restoreAllMocks()
})

it('cancels the active memory page and never requests a later page after explicit query cancellation', async () => {
  await render()
  await waitForSecondPage()
  await act(async () => client.cancelQueries({ queryKey: memoryKeys.lists() }))
  expect(calls[1].signal?.aborted).toBe(true)
  // Simulate a transport which delivers its response even after abort.
  await deliverSecondPage()
  expect(calls.map((call) => call.page)).toEqual([1, 2])
  expect(client.getQueryData(listKey())).toBeUndefined()
})

it('aborts the active memory page when its last observer unmounts and ignores a late result', async () => {
  await render()
  await waitForSecondPage()
  await render(0)
  expect(calls[1].signal?.aborted).toBe(true)
  await deliverSecondPage()
  expect(calls.map((call) => call.page)).toEqual([1, 2])
  expect(client.getQueryData(listKey())).toBeUndefined()
})

it('keeps a shared memory request active while another observer still uses it', async () => {
  await render(2)
  await waitForSecondPage()
  await render(1)
  expect(calls[1].signal?.aborted).toBe(false)
  await deliverSecondPage()
  await vi.waitFor(async () => {
    await settle()
    expect(
      client.getQueryData<MemoryListResponse>(listKey())?.memory_list,
    ).toHaveLength(300)
  })
  expect(calls.map((call) => call.page)).toEqual([1, 2, 3])
  expect(calls[2].signal).toBe(calls[0].signal)
  expect(calls[2].signal?.aborted).toBe(false)
})
