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
    current.request({ question: 'Question', kbIds: ['kb'] }),
  )
  expect(current.error).toBe('searchPage.workspace.mapFailed')
  expect(JSON.stringify(current)).not.toContain('private provider detail')
  await act(async () => current.refresh())
  expect(request).toHaveBeenCalledTimes(2)
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
