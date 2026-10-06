// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useFetchFactories, useFetchMyLLMs } from '../use-llm-request'
import { llmAPI } from '@/api/llm'

vi.mock('@/api/llm', () => ({
  llmAPI: { getMyLLMs: vi.fn(), getFactories: vi.fn() },
}))

type Snapshot = { myLLMs: object; factories: unknown[] }
let root: Root, client: QueryClient, snapshots: Snapshot[]

function Probe({ onRender }: { onRender: (snapshot: Snapshot) => void }) {
  const { myLLMs } = useFetchMyLLMs()
  const { factories } = useFetchFactories()
  onRender({ myLLMs, factories })
  return null
}
async function render() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Probe onRender={(snapshot) => snapshots.push(snapshot)} />
      </QueryClientProvider>,
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  root = createRoot(document.createElement('div'))
  snapshots = []
})
afterEach(() => {
  act(() => root.unmount())
  client.clear()
})

// Memo/effect dependencies on these values must not change on every render
// while the lists are unavailable (the knowledge settings form reset loop).
it.each([
  ['pending', () => new Promise<never>(() => {})],
  ['rejected', () => Promise.reject(new Error('Models unavailable'))],
])(
  'returns the same empty model lists across renders while %s',
  async (_state, load) => {
    vi.mocked(llmAPI.getMyLLMs).mockImplementation(load)
    vi.mocked(llmAPI.getFactories).mockImplementation(load)
    await render()
    await render()
    expect(snapshots.length).toBeGreaterThan(1)
    const [first, last] = [snapshots[0], snapshots.at(-1)!]
    expect(last.myLLMs).toEqual({})
    expect(last.myLLMs).toBe(first.myLLMs)
    expect(last.factories).toEqual([])
    expect(last.factories).toBe(first.factories)
  },
)
