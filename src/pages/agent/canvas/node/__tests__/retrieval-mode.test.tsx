import { act, type ComponentProps, type PropsWithChildren } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { Operator, RetrievalFrom } from '@/pages/agent/constant'
import { RetrievalNode } from '../retrieval-node'

vi.mock('@/hooks/use-knowledge-request', () => ({
  useFetchKnowledgeList: () => ({ knowledgeBases: [] }),
}))
vi.mock('../toolbar', () => ({
  ToolBar: ({ children }: PropsWithChildren) => <>{children}</>,
}))
vi.mock('../node-wrapper', () => ({
  NodeWrapper: ({ children }: PropsWithChildren) => <>{children}</>,
}))
vi.mock('../handle', () => ({
  CommonHandle: () => null,
  LeftEndHandle: () => null,
}))
vi.mock('../node-header', () => ({ default: () => null }))

let root: Root
let client: QueryClient
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const renderMode = async (mode: string) => {
  const form = {
    retrieval_from: mode,
    memory_ids: ['memory-1'],
    dataset_ids: [],
    kb_ids: [],
  }
  const props: ComponentProps<typeof RetrievalNode> = {
    id: 'retrieval-mode-fixture',
    data: {
      name: 'Retrieval',
      label: Operator.Retrieval,
      form,
    },
    isConnectable: true,
    selected: false,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    type: 'retrieval',
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <RetrievalNode {...props} />
      </QueryClientProvider>,
    ),
  )
}

const memoryPage = (page: number) => ({
  total_count: 201,
  memory_list: Array.from(
    { length: Math.min(100, 201 - (page - 1) * 100) },
    (_, index) => {
      const number = (page - 1) * 100 + index + 1
      return { id: `memory-${number}`, name: `Memory ${number}` }
    },
  ),
})

it('does not request a memory inventory for a dataset retrieval node', async () => {
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue(memoryPage(1))

  await renderMode(RetrievalFrom.Dataset)

  expect(get).not.toHaveBeenCalled()
})

it('aborts an in-flight memory page when the node switches to datasets and never requests the next page', async () => {
  const pages: number[] = []
  const signals: AbortSignal[] = []
  let releaseSecondPage!: (value: ReturnType<typeof memoryPage>) => void
  const secondPage = new Promise<ReturnType<typeof memoryPage>>((resolve) => {
    releaseSecondPage = resolve
  })
  vi.spyOn(apiClient, 'get').mockImplementation(async (endpoint, config) => {
    const url = new URL(endpoint, 'http://fixture.test')
    expect(url.pathname).toBe('/memories')
    expect(url.searchParams.get('page_size')).toBe('100')
    expect(config?.signal).toBeInstanceOf(AbortSignal)
    const page = Number(url.searchParams.get('page'))
    pages.push(page)
    signals.push(config!.signal!)
    return page === 2 ? secondPage : memoryPage(page)
  })

  await renderMode(RetrievalFrom.Memory)
  expect(pages).toEqual([1, 2])
  expect(signals[0]).toBe(signals[1])
  expect(signals[1].aborted).toBe(false)

  await renderMode(RetrievalFrom.Dataset)
  expect(signals[1].aborted).toBe(true)

  // Even a transport that delivers its response after abort cannot start page 3.
  await act(async () => {
    releaseSecondPage(memoryPage(2))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  expect(pages).toEqual([1, 2])
  expect(container.textContent).not.toContain('Memory 1')
})
