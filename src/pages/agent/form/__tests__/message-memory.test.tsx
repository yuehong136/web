import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { MessageForm } from '../message'
import en from '@/locales/en-US/flow'
import zh from '@/locales/zh-CN/flow'
import useGraphStore from '../../store'
import { BeginId, Operator } from '../../constant'
import {
  buildGraphNode,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../../operators'
import type { RAGFlowNodeType } from '../../types'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/components/prompt-editor', () => ({
  PromptEditor: () => <textarea aria-label="owned-message-content" />,
}))
let root: Root, container: HTMLDivElement, cache: QueryClient
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.scrollIntoView = vi.fn()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.memory, 'list').mockResolvedValue({
    memory_list: [
      { id: 'memory-old', name: 'Old memory' },
      { id: 'memory-new', name: 'New memory' },
    ],
    total_count: 2,
  } as Awaited<ReturnType<typeof memoryAPI.memory.list>>)
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  container.remove()
  useGraphStore.setState({ nodes: [], edges: [] })
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function render(enabled?: boolean) {
  const form: Record<string, unknown> = {
    content: ['Owned response'],
    memory_ids: ['memory-old'],
  }
  if (enabled !== undefined) form.structured_memory = enabled
  const node = buildGraphNode(Operator.Message, { id: 'Message:source', form })
  if (enabled === undefined)
    delete (node.data.form as Record<string, unknown>).structured_memory
  await act(async () => {
    useGraphStore.setState({
      nodes: [
        buildGraphNode(Operator.Begin, { id: BeginId }),
        node,
      ] as RAGFlowNodeType[],
      edges: [],
    })
    root.render(
      <QueryClientProvider client={cache}>
        <MessageForm key={String(enabled)} node={node as RAGFlowNodeType} />
      </QueryClientProvider>,
    )
  })
}

function structuredSwitch() {
  const labels = [...container.querySelectorAll('label')]
  const label = labels.find((el) => el.textContent === 'flow.structuredMemory')!
  return document.getElementById(label.htmlFor) as HTMLButtonElement
}
function current() {
  return useGraphStore.getState().nodes.find((n) => n.id === 'Message:source')!
    .data.form as Record<string, unknown>
}
it('legacy Message starts off, an explicit switch writes a boolean and a saved reload restores it', async () => {
  await render()
  expect(structuredSwitch().getAttribute('aria-checked')).toBe('false')
  await act(async () => structuredSwitch().click())
  await vi.waitFor(() => expect(current().structured_memory).toBe(true))
  const dsl = serializeGraphToDsl({
    graph: { nodes: useGraphStore.getState().nodes, edges: [] },
  })
  expect(dsl.components['Message:source'].obj.params.structured_memory).toBe(
    true,
  )
  const reloaded = deserializeDslToGraph(
    JSON.parse(JSON.stringify(dsl)),
  ).graph.nodes.find((n) => n.id === 'Message:source')!
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MessageForm key="reloaded" node={reloaded as RAGFlowNodeType} />
      </QueryClientProvider>,
    ),
  )
  expect(structuredSwitch().getAttribute('aria-checked')).toBe('true')
  await act(async () => structuredSwitch().click())
  await vi.waitFor(() => expect(current().structured_memory).toBe(false))
})
it('changing the memory selection preserves the explicit mode and never creates sources or runs maintenance', async () => {
  const create = vi.spyOn(memoryAPI.sources, 'create'),
    maintenance = vi.spyOn(memoryAPI.dreaming, 'create')
  await render(true)
  await vi.waitFor(() => expect(container.textContent).toContain('Old memory'))
  const triggers = [...container.querySelectorAll<HTMLButtonElement>('button')]
  const selector = triggers.find((el) =>
    el.textContent?.includes('Old memory'),
  )!
  await act(async () => selector.click())
  await vi.waitFor(() =>
    expect(document.querySelector('[data-value="memory-new"]')).not.toBeNull(),
  )
  await act(async () =>
    document.querySelector<HTMLElement>('[data-value="memory-new"]')!.click(),
  )
  await vi.waitFor(() =>
    expect(current().memory_ids).toEqual(['memory-old', 'memory-new']),
  )
  expect(current().structured_memory).toBe(true)
  expect(create).not.toHaveBeenCalled()
  expect(maintenance).not.toHaveBeenCalled()
})

it('explains authenticated structured scope in both locales and preserves the legacy User ID when switching modes', async () => {
  expect(en.flow.structuredMemoryDescription).toContain(
    'Uses the current authenticated user; User ID applies only to the legacy mode.',
  )
  expect(zh.flow.structuredMemoryDescription).toContain(
    '结构化模式使用当前认证用户；用户 ID 仅影响旧模式。',
  )
  await render()
  expect(container.textContent).toContain('flow.structuredMemoryDescription')
  const label = [...container.querySelectorAll('label')].find(
    (el) => el.textContent === 'flow.userId',
  )!
  const input = document.getElementById(label.htmlFor) as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, ' legacy user ')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => structuredSwitch().click())
  await vi.waitFor(() => expect(current().structured_memory).toBe(true))
  expect(current().user_id).toBe(' legacy user ')
  await act(async () => structuredSwitch().click())
  await vi.waitFor(() => expect(current().structured_memory).toBe(false))
  expect(current().user_id).toBe(' legacy user ')
})
