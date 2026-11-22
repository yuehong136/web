import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { MemoryOperationsPage } from '@/pages/memory/memory-operations-page'
import { memoryKeys } from '@/hooks/use-memory'
import {
  memoryOperationNeedsPolling,
  memoryOperationReady,
} from '@/lib/memory-operation'
import type {
  MemoryBackgroundExecution,
  MemoryOperation,
  MemoryOperationPage,
  MemoryOperationSummary,
} from '@/types/memory-revisions'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en-US' },
  }),
}))
vi.mock('@/components/layout/workbench-navigation', () => ({
  useRegisterSecondaryNavigation: () => true,
}))
const execution = (
  state: MemoryBackgroundExecution['state'] = 'queued',
): MemoryBackgroundExecution => ({
  state,
  attempt: 0,
  queued_at: '2026-11-15T10:00:00Z',
  heartbeat_at: null,
  finished_at: null,
  error_code: null,
  needs_operator_reconciliation: state === 'needs_reconciliation',
})
const original = (id = 'original'): MemoryOperationSummary => ({
  operation_id: id,
  kind: 'dream_analyze',
  status: 'accepted',
  index_sync_status: 'pending',
  retryable: true,
  can_reconcile: false,
  job_id: 'job-a',
  execution: execution(),
  created_at: '2026-11-15T10:00:00Z',
  updated_at: '2026-11-15T10:00:00Z',
})
let host: HTMLDivElement,
  root: Root,
  cache: QueryClient,
  page: MemoryOperationPage,
  operation: MemoryOperation
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  page = {
    operations: [original()],
    next_cursor: null,
    limit: 20,
    view: 'pending',
    memory_state: 'active',
  }
  operation = original()
  vi.spyOn(memoryAPI.revision, 'operations').mockImplementation(
    async (_mid, params) => ({ ...structuredClone(page), view: params.view }),
  )
  vi.spyOn(memoryAPI.revision, 'operation').mockImplementation(async () =>
    structuredClone(operation),
  )
  vi.spyOn(memoryAPI.revision, 'reconcile').mockImplementation(async () =>
    structuredClone(operation),
  )
  vi.spyOn(memoryAPI.dreaming, 'run').mockRejectedValue(
    new Error('GET must not run analysis'),
  )
  vi.spyOn(memoryAPI.dreaming, 'publish').mockRejectedValue(
    new Error('GET must not publish'),
  )
  vi.spyOn(memoryAPI.memory, 'get').mockRejectedValue(
    new Error('Recovery must not require config'),
  )
  vi.spyOn(memoryAPI.revision, 'capabilities').mockRejectedValue(
    new Error('Recovery must not require capabilities'),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
function LocationProbe() {
  const location = useLocation()
  return (
    <output data-location>
      {location.pathname}
      {location.search}
    </output>
  )
}
async function render(url = '/memory/bank/operations') {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <QueryClientProvider client={cache}>
          <Routes>
            <Route
              path="/memory/:id/operations"
              element={
                <>
                  <MemoryOperationsPage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    ),
  )
}
const button = (key: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('button')].find(
    (value) => value.textContent === key,
  )!

it('discovers the server handle, writes it to the URL, and only performs reads after a reload', async () => {
  await render()
  await vi.waitFor(() =>
    expect(host.querySelector('[data-location]')!.textContent).toContain(
      'operation=original',
    ),
  )
  expect(host.textContent).toContain('memory.recovery.executionStates.queued')
  expect(button('memory.revisions.reconcile')).toBeUndefined()
  const url = host.querySelector('[data-location]')!.textContent!
  await act(async () => root.unmount())
  cache.clear()
  root = createRoot(host)
  await render(url)
  await vi.waitFor(() =>
    expect(memoryAPI.revision.operation).toHaveBeenCalledWith(
      'bank',
      'original',
      expect.anything(),
    ),
  )
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
  expect(memoryAPI.revision.reconcile).not.toHaveBeenCalled()
  expect(memoryAPI.memory.get).not.toHaveBeenCalled()
  expect(memoryAPI.revision.capabilities).not.toHaveBeenCalled()
})

it('honors an explicit original URL handle even when another pending operation is listed', async () => {
  page.operations = [original('other')]
  await render('/memory/bank/operations?operation=original')
  await vi.waitFor(() =>
    expect(memoryAPI.revision.operation).toHaveBeenCalled(),
  )
  expect(host.querySelector('[data-location]')!.textContent).toContain(
    'operation=original',
  )
  expect(
    vi
      .mocked(memoryAPI.revision.operation)
      .mock.calls.every((call) => call[1] === 'original'),
  ).toBe(true)
})

it('requires operator settlement without offering reconciliation or resubmitting model work', async () => {
  operation = {
    ...original(),
    status: 'persistence_unknown',
    index_sync_status: 'unknown',
    execution: execution('needs_reconciliation'),
    needs_operator_reconciliation: true,
    can_reconcile: true,
  }
  await render('/memory/bank/operations?operation=original')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.recovery.operatorRequired'),
  )
  expect(button('memory.revisions.reconcile')).toBeUndefined()
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  expect(memoryAPI.revision.reconcile).not.toHaveBeenCalled()
})

it('reconciles a permitted mixed partial parent only after a user click', async () => {
  operation = {
    operation_id: 'parent',
    kind: 'dream_publish',
    status: 'stale',
    index_sync_status: 'unknown',
    retryable: true,
    can_reconcile: true,
    job_id: 'job-a',
  }
  page.operations = []
  await render('/memory/bank/operations?operation=parent')
  await vi.waitFor(() =>
    expect(button('memory.revisions.reconcile')).toBeDefined(),
  )
  expect(memoryAPI.revision.reconcile).not.toHaveBeenCalled()
  await act(async () => button('memory.revisions.reconcile').click())
  expect(memoryAPI.revision.reconcile).toHaveBeenCalledWith('bank', 'parent')
  expect(host.textContent).not.toContain('memory.revisions.ready')
})

it('recovers deletion audit after the bank is gone without reading configuration or old bodies', async () => {
  const deleted: MemoryOperationSummary = {
    ...original('delete-original'),
    kind: 'delete_memory',
    status: 'ready',
    index_sync_status: 'ready',
    job_id: null,
    execution: null,
    retryable: false,
    can_reconcile: false,
    lifecycle: 'deleted',
    tracked_cleanup_confirmed: true,
    physical_cleanup_complete: false,
    untraceable_copies: true,
  }
  operation = deleted
  vi.mocked(memoryAPI.revision.operations).mockImplementation(
    async (_mid, params) => ({
      operations: params.view === 'all' ? [deleted] : [],
      next_cursor: null,
      limit: 20,
      view: params.view,
      memory_state: 'deleted',
    }),
  )
  cache.setQueryData(memoryKeys.messages('bank'), {
    message_list: [{ content: 'Old private body' }],
  })
  cache.setQueryData(memoryKeys.messages('other'), {
    message_list: [{ content: 'Other body' }],
  })
  await render()
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.deletion.completed'),
  )
  expect(host.querySelector('[data-location]')!.textContent).toContain(
    'operation=delete-original',
  )
  expect(host.textContent).not.toContain('Old private body')
  expect(cache.getQueryData(memoryKeys.messages('bank'))).toBeUndefined()
  expect(cache.getQueryData(memoryKeys.messages('other'))).toBeDefined()
  expect(memoryAPI.memory.get).not.toHaveBeenCalled()
  expect(memoryAPI.revision.capabilities).not.toHaveBeenCalled()
})

it('keeps denied discovery separate from successful recovery and never prints raw error content', async () => {
  vi.mocked(memoryAPI.revision.operations).mockRejectedValue(
    new APIError(403, 'denied', 'Untrusted secret'),
  )
  vi.mocked(memoryAPI.revision.operation).mockRejectedValue(
    new APIError(403, 'denied', 'Untrusted secret'),
  )
  await render('/memory/bank/operations?operation=original')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.recovery.discoveryFailed'),
  )
  expect(host.textContent).not.toContain('Untrusted secret')
  expect(memoryAPI.revision.reconcile).not.toHaveBeenCalled()
  expect(host.querySelector('[data-location]')!.textContent).toContain(
    'operation=original',
  )
})

it('uses the opaque next cursor and resets it when the selected view changes', async () => {
  page.next_cursor = 'next/+?='
  await render()
  await vi.waitFor(() =>
    expect(button('memory.recovery.next').disabled).toBe(false),
  )
  await act(async () => button('memory.recovery.next').click())
  await vi.waitFor(() =>
    expect(memoryAPI.revision.operations).toHaveBeenCalledWith(
      'bank',
      { view: 'pending', limit: 20, cursor: 'next/+?=' },
      expect.anything(),
    ),
  )
  await act(async () => button('memory.recovery.allView').click())
  await vi.waitFor(() =>
    expect(memoryAPI.revision.operations).toHaveBeenCalledWith(
      'bank',
      { view: 'all', limit: 20, cursor: undefined },
      expect.anything(),
    ),
  )
})

it('never mistakes queued analysis for ready and keeps unknown work eligible for read polling', () => {
  expect(
    memoryOperationReady({
      ...original(),
      status: 'ready',
      index_sync_status: 'ready',
    }),
  ).toBe(false)
  expect(memoryOperationNeedsPolling(original())).toBe(true)
  expect(
    memoryOperationNeedsPolling({
      ...original(),
      execution: execution('needs_reconciliation'),
    }),
  ).toBe(true)
  expect(
    memoryOperationNeedsPolling({
      ...original(),
      status: 'ready',
      index_sync_status: 'ready',
      execution: execution('succeeded'),
    }),
  ).toBe(false)
})

it('keeps an indexed RAW append pending while queue notification or its actual writer is unsettled', async () => {
  operation = {
    operation_id: 'append-original',
    kind: 'append_raw',
    status: 'ready',
    index_sync_status: 'ready',
    queue_state: 'unknown',
    retryable: false,
    can_reconcile: true,
    writer_busy: true,
  }
  page.operations = [
    {
      ...operation,
      created_at: original().created_at,
      updated_at: original().updated_at,
    },
  ]
  await render('/memory/bank/operations?operation=append-original')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.writers.queueUnconfirmed'),
  )
  expect(host.textContent).not.toContain('memory.recovery.ready')
  expect(button('memory.revisions.reconcile')).toBeUndefined()
  expect(memoryOperationNeedsPolling(operation)).toBe(true)
})

it.each(['dream_publish', 'append_raw'])(
  'keeps %s unconfirmed until the actual writer has drained',
  async (kind) => {
    operation = {
      operation_id: 'actual-writer',
      kind,
      status: 'ready',
      index_sync_status: 'ready',
      queue_state: 'submitted',
      writer_busy: true,
      retryable: false,
      can_reconcile: false,
    }
    expect(memoryOperationReady(operation)).toBe(false)
    expect(memoryOperationNeedsPolling(operation)).toBe(true)
    await render('/memory/bank/operations?operation=actual-writer')
    await vi.waitFor(() =>
      expect(memoryAPI.revision.operation).toHaveBeenCalled(),
    )
    expect(host.textContent).not.toContain('memory.revisions.ready')
    expect(host.textContent).not.toContain('memory.writers.rawPublished')
    expect(button('memory.revisions.reconcile')).toBeUndefined()
    expect(memoryOperationReady({ ...operation, writer_busy: false })).toBe(
      true,
    )
  },
)

it('does not present an operator-needed or unsettled execution as ready', () => {
  const ready = {
    operation_id: 'unsettled',
    kind: 'dream_publish',
    status: 'ready',
    index_sync_status: 'ready',
    retryable: false,
  }
  expect(memoryOperationReady(ready)).toBe(true)
  expect(
    memoryOperationReady({ ...ready, needs_operator_reconciliation: true }),
  ).toBe(false)
  for (const state of [
    'queued',
    'claimed',
    'running',
    'failed',
    'canceled',
    'needs_reconciliation',
  ] as const)
    expect(
      memoryOperationReady({ ...ready, execution: execution(state) }),
    ).toBe(false)
})

it.each([undefined, null, execution('queued')])(
  'does not offer analysis reconciliation without an explicit server permission',
  async (background) => {
    operation = {
      ...original(),
      execution: background,
      can_reconcile: undefined,
      retryable: true,
    }
    await render('/memory/bank/operations?operation=original')
    await vi.waitFor(() =>
      expect(memoryAPI.revision.operation).toHaveBeenCalled(),
    )
    expect(button('memory.revisions.reconcile')).toBeUndefined()
  },
)
