import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { useFetchDocumentFilter } from '../use-document-request'
import { useMetadataSummary } from '../use-metadata'

const calls = vi.hoisted(() => ({
  filter: vi.fn(async () => ({ filter: { parser_id: [] } })),
  summary: vi.fn(async () => ({ summary: {} })),
}))
vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: {
    document: { getFilter: calls.filter },
    metadata: { getSummary: calls.summary },
  },
}))

test('missing dataset never requests filters or metadata, including explicit refetch', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const container = document.createElement('div')
  const root = createRoot(container)
  let filter: ReturnType<typeof useFetchDocumentFilter>
  let summary: ReturnType<typeof useMetadataSummary>
  function Harness({ id }: { id: string }) {
    filter = useFetchDocumentFilter(id)
    summary = useMetadataSummary(id)
    return null
  }
  const render = async (id: string) => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <Harness id={id} />
          </MemoryRouter>
        </QueryClientProvider>,
      )
    })
  }
  try {
    await render('')
    expect(calls.filter).not.toHaveBeenCalled()
    expect(calls.summary).not.toHaveBeenCalled()
    await act(async () => {
      await Promise.all([filter!.refetch(), summary!.refetch()])
    })
    expect(calls.filter).not.toHaveBeenCalled()
    expect(calls.summary).not.toHaveBeenCalled()
    await render('kb-1')
    expect(calls.filter).toHaveBeenCalledWith('kb-1')
    expect(calls.summary).toHaveBeenCalledWith('kb-1', undefined)
  } finally {
    await act(async () => {
      root.unmount()
    })
    client.clear()
  }
})
