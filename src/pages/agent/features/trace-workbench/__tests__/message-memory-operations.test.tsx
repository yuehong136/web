import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { MemoryOperationPanel } from '@/components/memory/memory-operation-panel'
import { setProductLanguage } from '@/locales/i18n'
import type { TraceSpanViewModel } from '@/pages/agent/adapters/trace'
import { TraceIoPanel } from '../components/trace-io-panel'

const first = {
  memory_id: 'bank-1',
  operation_id: 'message-source:original',
  kind: 'append_raw',
  status: 'ready',
  index_sync_status: 'ready',
  queue_state: 'not_required',
  raw_source_id: '9223372036854775807',
}
const output = {
  content: 'Answer',
  memory_operations: [
    first,
    {
      ...first,
      memory_id: 'bank-2',
      status: 'persistence_unknown',
      index_sync_status: 'unknown',
    },
  ],
  memory_error: '<script>private failure</script>',
}
const span = (
  data: unknown = output,
  type = 'Message',
): TraceSpanViewModel => ({
  id: 'node',
  name: 'Custom title',
  componentType: type,
  kind: 'node',
  status: 'success',
  children: [],
  confidence: 'exact',
  output: data,
  raw: {},
})
let host: HTMLDivElement, root: Root, cache: QueryClient
beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
function Recovery() {
  const { id } = useParams()
  const location = useLocation()
  const operationId = new URLSearchParams(location.search).get('operation')!
  return (
    <>
      <output data-location>{location.pathname + location.search}</output>
      <MemoryOperationPanel
        memoryId={id!}
        operationId={operationId}
        onRefresh={() => {}}
      />
    </>
  )
}
async function render(value = span()) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryRouter initialEntries={['/agent/owned']}>
          <Routes>
            <Route
              path="/agent/owned"
              element={<TraceIoPanel span={value} mode="output" />}
            />
            <Route path="/memory/:id/operations" element={<Recovery />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}
async function click(element: Element) {
  await vi.waitFor(() => expect(element.hasAttribute('disabled')).toBe(false))
  await act(async () => {
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

it('renders per-bank snapshot states and encoded original links without requesting or rendering error HTML', async () => {
  const get = vi.spyOn(memoryAPI.revision, 'operation')
  const reconcile = vi.spyOn(memoryAPI.revision, 'reconcile')
  await render()
  expect(get).not.toHaveBeenCalled()
  expect(reconcile).not.toHaveBeenCalled()
  expect(host.textContent).toContain('RAW published (trace snapshot)')
  expect(host.textContent).toContain('Unknown or reconciliation required')
  expect(host.textContent).toContain('9223372036854775807')
  expect(host.querySelector('script')).toBeNull()
  const links = Array.from(host.querySelectorAll('a'))
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/memory/bank-1/operations?operation=message-source%3Aoriginal',
    '/memory/bank-2/operations?operation=message-source%3Aoriginal',
  ])
})

it('opens and refreshes original handle using existing panel; reconciliation is explicit', async () => {
  const live = {
    operation_id: first.operation_id,
    kind: 'append_raw',
    status: 'persistence_unknown',
    index_sync_status: 'unknown',
    retryable: true,
    can_reconcile: true,
    queue_state: 'unknown' as const,
  }
  const get = vi.spyOn(memoryAPI.revision, 'operation').mockResolvedValue(live)
  const reconcile = vi
    .spyOn(memoryAPI.revision, 'reconcile')
    .mockResolvedValue(live)
  await render()
  await click(host.querySelectorAll('a')[1]!)
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(1))
  expect(get.mock.calls[0]?.slice(0, 2)).toEqual(['bank-2', first.operation_id])
  expect(host.querySelector('[data-location]')?.textContent).toBe(
    '/memory/bank-2/operations?operation=message-source%3Aoriginal',
  )
  expect(reconcile).not.toHaveBeenCalled()
  await click(
    Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Read latest status',
    )!,
  )
  await vi.waitFor(() => expect(get).toHaveBeenCalledTimes(2))
  expect(reconcile).not.toHaveBeenCalled()
  await click(
    Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Reconcile this operation',
    )!,
  )
  expect(reconcile.mock.calls[0]).toEqual(['bank-2', first.operation_id])
})

it.each([403, 404])(
  'keeps original handle and fixed feedback on %i without automatic write',
  async (status) => {
    vi.spyOn(memoryAPI.revision, 'operation').mockRejectedValue(
      new APIError(status, String(status), 'Forbidden body'),
    )
    const reconcile = vi.spyOn(memoryAPI.revision, 'reconcile')
    await render()
    await click(host.querySelector('a')!)
    await vi.waitFor(() =>
      expect(host.querySelector('[role="alert"]')).not.toBeNull(),
    )
    expect(host.textContent).toContain(first.operation_id)
    expect(host.textContent).not.toContain('Forbidden body')
    expect(reconcile).not.toHaveBeenCalled()
  },
)

it('legacy/no metadata and other node types show no special actions; error-only has no invented handle', async () => {
  await render(span(output, 'Tool'))
  expect(host.querySelectorAll('a')).toHaveLength(0)
  await render(span({ content: 'Old response' }))
  expect(host.textContent).not.toContain('Memory write operations')
  await render(span({ memory_error: 'private error without handle' }))
  expect(host.textContent).toContain('No usable operation identity')
  expect(host.querySelectorAll('a')).toHaveLength(0)
  expect(host.querySelector('section')?.textContent).not.toContain(
    'private error without handle',
  )
})

it('uses Chinese resources with safe invalid-metadata feedback', async () => {
  await setProductLanguage('zh-CN')
  await render(
    span({
      memory_operations: [{ ...first, raw_source_id: 9007199254740992 }],
    }),
  )
  expect(host.textContent).toContain('记忆写入操作')
  expect(host.textContent).toContain('部分操作元数据无法安全识别')
  expect(host.querySelectorAll('a')).toHaveLength(0)
})

it.each(['LLM', 'LLM ', 'MessageLike', undefined])(
  'generated receipt-shaped data in %s context remains ordinary output without recovery actions',
  async (type) => {
    const get = vi.spyOn(memoryAPI.revision, 'operation'),
      reconcile = vi.spyOn(memoryAPI.revision, 'reconcile')
    const value = span(output)
    value.name = 'Message'
    value.componentType = type
    await render(value)
    expect(host.textContent).not.toContain('Memory write operations')
    expect(host.querySelectorAll('a')).toHaveLength(0)
    expect(get).not.toHaveBeenCalled()
    expect(reconcile).not.toHaveBeenCalled()
  },
)

it.each([
  { content: JSON.stringify({ memory_operations: [first] }) },
  { content: { memory_operations: [first], component_type: 'Message' } },
  { content: [{ role: 'unknown', content: { memory_operations: [first] } }] },
])(
  'receipt-shaped nested Message content does not manufacture a platform action',
  async (value) => {
    const get = vi.spyOn(memoryAPI.revision, 'operation')
    await render(span(value))
    expect(host.textContent).not.toContain('Memory write operations')
    expect(host.querySelectorAll('a')).toHaveLength(0)
    expect(get).not.toHaveBeenCalled()
  },
)
