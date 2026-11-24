import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { useAuthStore } from '@/stores/auth'
import { setProductLanguage } from '@/locales/i18n'
import { memoryCompactionKeys } from '@/hooks/memory-compaction-keys'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { MemoryCompactionWorkspace } from '../memory-compaction-workspace'
import { MemoryOperationPanel } from '../memory-operation-panel'
import {
  compactionCapability,
  compactionList,
  compactionResult,
} from './memory-compaction-fixtures'
import type { MemoryCompactionResult } from '@/types/memory-compaction'

vi.mock('../memory-source-panel', () => ({ MemorySourcePanel: () => null }))
vi.mock('../memory-source-reader', () => ({
  MemorySourceReader: ({ onInvalid }: { onInvalid: () => void }) => (
    <button data-invalidate onClick={onInvalid}>
      Invalidate test source boundary
    </button>
  ),
}))
let host: HTMLDivElement, root: Root, cache: QueryClient
beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  useAuthStore.setState({ token: 'owned-actor' })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    context_compactions: compactionCapability,
    revisions: {
      supported: true,
      managed: true,
      activation_scope: 'memory_bank',
      ordinary_writes_after_activation: true,
      managed_delete_supported: true,
      max_content_bytes: 65535,
      max_content_tokens: 8192,
    },
  })
  vi.spyOn(memoryAPI.compaction, 'create').mockImplementation(
    async (_id, body) => compactionResult(body.operation_id),
  )
  vi.spyOn(memoryAPI.compaction, 'operation').mockImplementation(
    async (_id, op) => compactionResult(op),
  )
  vi.spyOn(memoryAPI.compaction, 'list').mockResolvedValue(compactionList())
  vi.spyOn(memoryAPI.compaction, 'cancel').mockImplementation(
    async (_id, op) => {
      const value = compactionResult(op)
      value.operation.status = 'canceled'
      value.operation.writer_busy = true
      value.operation.needs_operator_reconciliation = true
      value.artifact.state = 'canceled'
      value.artifact.valid_for_current = false
      value.artifact.package = null
      return value
    },
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
function Location() {
  const location = useLocation(),
    navigate = useNavigate()
  return (
    <>
      <output data-location>{location.pathname + location.search}</output>
      <button
        data-select-other
        onClick={() =>
          navigate('/memory/bank/compaction?compaction_operation=other-op')
        }
      >
        Select test operation
      </button>
    </>
  )
}
async function render(
  path = '/memory/bank/compaction',
  node = (
    <MemoryCompactionWorkspace
      memoryId="bank"
      operationIdFactory={() => 'compaction-original'}
    />
  ),
) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryRouter initialEntries={[path]}>
          {node}
          <Location />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}
const find = (label: string) =>
  Array.from(host.querySelectorAll('button')).find(
    (b) => b.textContent === label,
  )
async function click(label: string) {
  await vi.waitFor(() => expect(find(label)?.disabled).toBe(false))
  await act(async () => find(label)!.click())
}
async function fill(selector: string, value: string) {
  const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    selector,
  )!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      input.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const bodyText = 'Owned summary <script>window.__unsafe=1</script>'

it('no automatic generation; explicit paid command preserves order and original URL; refresh only reads', async () => {
  await render()
  await vi.waitFor(() =>
    expect(find('Generate compression (model cost)')?.disabled).toBe(false),
  )
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
  expect(memoryAPI.compaction.operation).not.toHaveBeenCalled()
  await fill('#compaction-source-order', '9223372036854775807\n2')
  await click('Generate compression (model cost)')
  await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
  expect(
    vi.mocked(memoryAPI.compaction.create).mock.calls[0]?.[1],
  ).toMatchObject({
    source_ids: ['9223372036854775807', '2'],
    prefix_count: 1,
    operation_id: 'compaction-original',
  })
  expect(host.querySelector('[data-location]')?.textContent).toContain(
    'compaction_operation=compaction-original',
  )
  expect(host.querySelector('script')).toBeNull()
  expect(host.textContent).toContain('Generated — not applied')
  const before = vi.mocked(memoryAPI.compaction.operation).mock.calls.length
  await click('Read current status')
  await vi.waitFor(() =>
    expect(vi.mocked(memoryAPI.compaction.operation).mock.calls.length).toBe(
      before + 1,
    ),
  )
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
  expect(Object.values({ ...localStorage }).join('')).not.toContain(bodyText)
})

it('the explicit creation URL transition does not invalidate a delayed successful generation', async () => {
  let resolveCreate!: (value: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.create).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
  )
  await render()
  await vi.waitFor(() =>
    expect(find('Generate compression (model cost)')?.disabled).toBe(false),
  )
  await fill('#compaction-source-order', '9223372036854775807\n2')
  await click('Generate compression (model cost)')
  await vi.waitFor(() =>
    expect(memoryAPI.compaction.operation).toHaveBeenCalled(),
  )
  await act(async () => resolveCreate(compactionResult()))
  await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
  expect(find('Copy consumption reference')?.disabled).toBe(false)
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
})

it('refresh restoration reads server metadata and never regenerates or upgrades list validity', async () => {
  await render(
    '/memory/bank/compaction?compaction_operation=compaction-original',
  )
  await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
  expect(host.textContent).toContain(
    'Current source validity has not been checked',
  )
  expect(
    host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,
  ).toBe(true)
})

it('unknown result keeps original ID; cancellation is not drain completion', async () => {
  const unknown = compactionResult()
  unknown.operation.status = 'persistence_unknown'
  unknown.operation.writer_busy = true
  unknown.operation.needs_operator_reconciliation = true
  unknown.artifact.state = 'persistence_unknown'
  unknown.artifact.valid_for_current = false
  unknown.artifact.package = null
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(unknown)
  await render(
    '/memory/bank/compaction?compaction_operation=compaction-original',
  )
  await click('Cancel this generation')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Canceled — not applied'),
  )
  expect(host.textContent).toContain('still draining')
  expect(find('Prepare a new explicit request')).toBeUndefined()
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
  expect(host.querySelector('[data-location]')?.textContent).toContain(
    'compaction-original',
  )
})

it('in-flight generation can be canceled and its late response cannot restore the package', async () => {
  let resolveCreate!: (value: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.create).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
  )
  const running = compactionResult()
  running.operation.status = 'running'
  running.operation.writer_busy = true
  running.artifact.state = 'running'
  running.artifact.valid_for_current = false
  running.artifact.package = null
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(running)
  await render()
  await vi.waitFor(() =>
    expect(find('Generate compression (model cost)')?.disabled).toBe(false),
  )
  await fill('#compaction-source-order', '9223372036854775807\n2')
  await click('Generate compression (model cost)')
  await click('Cancel this generation')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Canceled — not applied'),
  )
  await act(async () => resolveCreate(compactionResult()))
  await vi.waitFor(() => expect(host.textContent).not.toContain(bodyText))
  expect(host.textContent).toContain('Canceled — not applied')
  expect(host.textContent).toContain('still draining')
  expect(find('Prepare a new explicit request')).toBeUndefined()
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
  expect(memoryAPI.compaction.cancel).toHaveBeenCalledTimes(1)
  const canceled = structuredClone(running)
  canceled.operation.status = 'canceled'
  canceled.operation.writer_busy = false
  canceled.artifact.state = 'canceled'
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(canceled)
  await click('Read current status')
  await vi.waitFor(() =>
    expect(find('Prepare a new explicit request')?.disabled).toBe(false),
  )
  expect(host.textContent).not.toContain(bodyText)
})

it('unknown cancellation fences the late generation response until a new explicit status read', async () => {
  let resolveCreate!: (value: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.create).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveCreate = resolve
      }),
  )
  const running = compactionResult()
  running.operation.status = 'running'
  running.operation.writer_busy = true
  running.artifact.state = 'running'
  running.artifact.valid_for_current = false
  running.artifact.package = null
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(running)
  vi.mocked(memoryAPI.compaction.cancel).mockRejectedValue(
    new APIError(503, '503', 'unknown cancellation'),
  )
  await render()
  await vi.waitFor(() =>
    expect(find('Generate compression (model cost)')?.disabled).toBe(false),
  )
  await fill('#compaction-source-order', '9223372036854775807\n2')
  await click('Generate compression (model cost)')
  await click('Cancel this generation')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Cancellation is unconfirmed'),
  )
  await act(async () => resolveCreate(compactionResult()))
  await vi.waitFor(() => expect(host.textContent).not.toContain(bodyText))
  expect(
    cache
      .getQueriesData({ queryKey: memoryCompactionKeys.bank('bank') })
      .some(
        ([, value]) =>
          (value as MemoryCompactionResult | undefined)?.artifact?.package,
      ),
  ).toBe(false)
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
  expect(host.textContent).toContain('Cancellation is unconfirmed')
  expect(find('Prepare a new explicit request')).toBeUndefined()
  expect(host.querySelector('[data-location]')?.textContent).toContain(
    'compaction-original',
  )
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(
    compactionResult(),
  )
  await click('Read current status')
  await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
})

it.each([403, 404, 409, 500])(
  'failed fresh GET %i clears old package and retains recovery identity',
  async (status) => {
    await render(
      '/memory/bank/compaction?compaction_operation=compaction-original',
    )
    await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
    vi.mocked(memoryAPI.compaction.operation).mockRejectedValue(
      new APIError(status, String(status), 'unsafe details'),
    )
    await click('Read current status')
    await vi.waitFor(() => expect(host.textContent).not.toContain(bodyText))
    expect(host.textContent).not.toContain('Original retained 🧭 text')
    expect(host.textContent).not.toContain('unsafe details')
    expect(host.querySelector('[data-location]')?.textContent).toContain(
      'compaction-original',
    )
    expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
  },
)

it('known nested withdrawal removes cached body immediately and blocks a late old GET', async () => {
  await render(
    '/memory/bank/compaction?compaction_operation=compaction-original',
  )
  await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
  let resolve!: (value: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.operation).mockImplementationOnce(
    () =>
      new Promise((ok) => {
        resolve = ok
      }),
  )
  await click('Read current status')
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.operation('bank', 'withdraw'), {
      kind: 'withdraw_source',
      source: { source_id: '9223372036854775807' },
      stop_supply: 'withdrawn',
    }),
  )
  expect(
    cache
      .getQueriesData({ queryKey: memoryCompactionKeys.bank('bank') })
      .some(
        ([, value]) =>
          (value as MemoryCompactionResult | undefined)?.artifact?.package,
      ),
  ).toBe(false)
  await vi.waitFor(() => expect(host.textContent).not.toContain(bodyText))
  await act(async () => resolve(compactionResult()))
  expect(host.textContent).not.toContain(bodyText)
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
})

it('source-reader invalidation fences a previously started operation GET', async () => {
  await render(
    '/memory/bank/compaction?compaction_operation=compaction-original',
  )
  await vi.waitFor(() => expect(host.textContent).toContain(bodyText))
  await click('Read the bound original source')
  let resolve!: (value: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.operation).mockImplementationOnce(
    () =>
      new Promise((ok) => {
        resolve = ok
      }),
  )
  await act(async () => {
    void cache.refetchQueries({ queryKey: memoryCompactionKeys.bank('bank') })
  })
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[data-invalidate]')!.click(),
  )
  expect(
    cache
      .getQueriesData({ queryKey: memoryCompactionKeys.bank('bank') })
      .some(
        ([, value]) =>
          (value as MemoryCompactionResult | undefined)?.artifact?.package,
      ),
  ).toBe(false)
  await vi.waitFor(() => expect(host.textContent).not.toContain(bodyText))
  await act(async () => resolve(compactionResult()))
  await vi.waitFor(() => expect(host.textContent).not.toContain(bodyText))
})

it('late POST cannot overwrite a different selected operation or actor', async () => {
  let resolve!: (value: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.create).mockImplementationOnce(
    () =>
      new Promise((ok) => {
        resolve = ok
      }),
  )
  await render()
  await vi.waitFor(() =>
    expect(find('Generate compression (model cost)')?.disabled).toBe(false),
  )
  await fill('#compaction-source-order', '9223372036854775807\n2')
  await click('Generate compression (model cost)')
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[data-select-other]')!.click(),
  )
  await act(async () => resolve(compactionResult()))
  expect(host.querySelector('[data-location]')?.textContent).toContain(
    'other-op',
  )
  await act(async () => useAuthStore.setState({ token: 'different-actor' }))
  expect(host.querySelector('[data-location]')?.textContent).toContain(
    'other-op',
  )
  expect(memoryAPI.compaction.create).toHaveBeenCalledTimes(1)
})

it('legacy generic operation panel offers only a compression link, never writer success/reconcile', async () => {
  vi.spyOn(memoryAPI.revision, 'operation').mockResolvedValue({
    kind: 'context_compact',
    operation_id: 'compaction-original',
    status: 'generated',
    index_sync_status: 'ready',
    retryable: true,
    can_reconcile: true,
  })
  const reconcile = vi.spyOn(memoryAPI.revision, 'reconcile')
  await render(
    '/memory/bank/operations',
    <MemoryOperationPanel
      memoryId="bank"
      operationId="compaction-original"
      onRefresh={() => {}}
    />,
  )
  await vi.waitFor(() =>
    expect(host.querySelector('a')?.getAttribute('href')).toBe(
      '/memory/bank/compaction?compaction_operation=compaction-original',
    ),
  )
  expect(host.textContent).not.toContain('The operation is confirmed ready')
  expect(find('Reconcile this operation')).toBeUndefined()
  expect(reconcile).not.toHaveBeenCalled()
})

it('Chinese scope/cost boundaries render; absent capability disables generation', async () => {
  await setProductLanguage('zh-CN')
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue({})
  await render()
  await vi.waitFor(() =>
    expect(host.textContent).toContain('当前后端不支持显式上下文压缩'),
  )
  expect(find('生成压缩产物（模型费用）')?.disabled).toBe(true)
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
})
