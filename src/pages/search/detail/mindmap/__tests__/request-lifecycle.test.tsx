import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { searchAPI } from '@/api/search'
import { useSearchMindmap } from '../use-search-mindmap'

let root: Root
let container: HTMLDivElement
let client: QueryClient
let current: ReturnType<typeof useSearchMindmap>
function Surface() {
  const hook = useSearchMindmap()
  useLayoutEffect(() => {
    current = hook
  }, [hook])
  return null
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Surface />
      </QueryClientProvider>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('allows a failed request to retry with retained inputs and fixed feedback', async () => {
  const request = vi
    .spyOn(searchAPI, 'mindmap')
    .mockRejectedValueOnce(new Error('private provider detail'))
    .mockResolvedValueOnce({ label: 'Evidence', children: [] })
  await act(async () =>
    current.request({
      question: 'Question',
      kbIds: ['kb'],
      searchId: 'search-A',
    }),
  )
  expect(current.error).toBe('searchPage.workspace.mapFailed')
  expect(JSON.stringify(current)).not.toContain('private provider detail')
  await act(async () => current.refresh())
  expect(request).toHaveBeenCalledTimes(2)
  expect(request.mock.calls[1][0]).toMatchObject({ search_id: 'search-A' })
  expect(request.mock.calls[1][0]).not.toHaveProperty('searchId')
  expect(current.mindmap?.label).toBe('Evidence')
  expect(current.error).toBeNull()
})

it('ignores a superseded response and aborts its actual request', async () => {
  let resolveOld!: (value: unknown) => void
  let oldSignal: AbortSignal | undefined
  vi.spyOn(searchAPI, 'mindmap')
    .mockImplementationOnce((data) => {
      oldSignal = data.signal
      return new Promise((resolve) => {
        resolveOld = resolve
      })
    })
    .mockResolvedValueOnce({ label: 'New', children: [] })
  let pending!: Promise<void>
  await act(async () => {
    pending = current.request({ question: 'Old', kbIds: ['kb'] })
  })
  await act(async () => current.request({ question: 'New', kbIds: ['kb'] }))
  expect(oldSignal?.aborted).toBe(true)
  await act(async () => {
    resolveOld({ label: 'Old', children: [] })
    await pending
  })
  expect(current.mindmap?.label).toBe('New')
  expect(current.isLoading).toBe(false)
  expect(current).not.toHaveProperty('progress')
})

it('a nonempty search identity participates in deduplication and share routing', async () => {
  const normal = vi
    .spyOn(searchAPI, 'mindmap')
    .mockResolvedValue({ label: 'Normal', children: [] })
  const shared = vi
    .spyOn(searchAPI, 'mindmapShare')
    .mockResolvedValue({ label: 'Shared', children: [] })
  const params = {
    question: ' Same question ',
    kbIds: ['kb'],
    searchId: 'search-A',
  }
  await act(async () => current.request(params))
  await act(async () => current.request(params))
  expect(normal).toHaveBeenCalledTimes(1)
  await act(async () => current.request({ ...params, searchId: 'search-B' }))
  expect(normal).toHaveBeenCalledTimes(2)
  expect(normal.mock.calls[1][0]).toMatchObject({
    question: 'Same question',
    search_id: 'search-B',
  })
  await act(async () => current.request({ ...params, isShareMode: true }))
  expect(shared.mock.calls[0][0]).toMatchObject({ search_id: 'search-A' })
  expect(current.mindmap?.label).toBe('Shared')
})

it('canceling and reopening an identical search aborts the old request and permits retry', async () => {
  let signal: AbortSignal | undefined
  let resolveOld!: (value: unknown) => void
  vi.spyOn(searchAPI, 'mindmap')
    .mockImplementationOnce((data) => {
      signal = data.signal
      return new Promise((resolve) => {
        resolveOld = resolve
      })
    })
    .mockResolvedValue({ label: 'Reopened', children: [] })
  const params = { question: 'Question', kbIds: ['kb'], searchId: 'search-A' }
  let pending!: Promise<void>
  await act(async () => {
    pending = current.request(params)
  })
  await act(async () => current.cancel())
  expect(signal?.aborted).toBe(true)
  await act(async () => current.request(params))
  await act(async () => {
    resolveOld({ label: 'Canceled', children: [] })
    await pending
  })
  expect(current.mindmap?.label).toBe('Reopened')
})
