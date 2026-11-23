import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { knowledgeAPI } from '@/api/knowledge'
import { useFetchKnowledgeList } from '../use-knowledge-request'

let root: Root
let host: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps the current page on screen while the next page loads', async () => {
  const pages: Record<number, () => void> = {}
  vi.spyOn(knowledgeAPI.knowledgeBase, 'list').mockImplementation(
    (params) =>
      new Promise((resolve) => {
        const page = params?.page ?? 1
        pages[page] = () =>
          resolve({
            kbs: [{ id: `kb-${page}`, name: `Page ${page}` }],
            total: 24,
          } as never)
      }),
  )
  let seen: ReturnType<typeof useFetchKnowledgeList> | undefined
  let goTo!: (page: number) => void
  function Probe() {
    const [page, setPage] = useState(1)
    goTo = setPage
    seen = useFetchKnowledgeList({ page, page_size: 12 })
    return null
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    ),
  )
  // First load: nothing to show yet.
  expect(seen?.isLoading).toBe(true)
  await act(async () => pages[1]())
  await vi.waitFor(() =>
    expect(seen?.knowledgeBases.map((kb) => kb.id)).toEqual(['kb-1']),
  )

  await act(async () => goTo(2))
  await vi.waitFor(() => expect(pages[2]).toBeTypeOf('function'))
  // Page 2 is on its way; page 1 stays instead of a loading state.
  expect(seen?.isLoading).toBe(false)
  expect(seen?.isFetching).toBe(true)
  expect(seen?.knowledgeBases.map((kb) => kb.id)).toEqual(['kb-1'])
  await act(async () => pages[2]())
  await vi.waitFor(() =>
    expect(seen?.knowledgeBases.map((kb) => kb.id)).toEqual(['kb-2']),
  )
  expect(seen?.isFetching).toBe(false)
  client.clear()
})
