import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { memoryKeys } from '@/hooks/use-memory'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import {
  clearDeletedMemory,
  confirmedMemoryDeletion,
} from '@/hooks/memory-deletion-cache'
import { MemoryDeletionDialog } from '../memory-deletion-dialog'
import { MemoryManagedNotice } from '../memory-managed-notice'
import { MemoryOperationPanel } from '../memory-operation-panel'
import { memoryOperationReady } from '@/lib/memory-operation'
import type { Memory } from '@/types/memory'
import type { MemoryOperation } from '@/types/memory-revisions'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
const bank = { id: 'bank', name: 'Owned bank' } as Memory
const other = { id: 'other', name: 'Other bank' } as Memory
const operation = (id = 'delete', done = false): MemoryOperation => ({
  operation_id: id,
  kind: 'delete_memory',
  status: done ? 'ready' : 'published',
  index_sync_status: done ? 'ready' : 'pending',
  retryable: !done,
  lifecycle: done ? 'deleted' : 'deleting',
  stop_supply: 'stopped',
  tracked_cleanup_confirmed: done,
  physical_cleanup_complete: false,
  untraceable_copies: true,
  blocked_by: done ? [] : ['writer_attempts'],
  writer_drain: {
    active_attempts: 1,
    unknown_attempts: 0,
    pending_appends: 0,
    untracked_tasks: 0,
  },
})
let host: HTMLDivElement, root: Root, client: QueryClient
const closed = vi.fn()
const button = (key: string) =>
  Array.from(document.body.querySelectorAll('button')).find(
    (b) => b.textContent === key,
  )!
async function click(key: string) {
  await act(async () => button(key).click())
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  client.setQueryData(memoryKeys.list({}), {
    memory_list: [bank, other],
    total_count: 2,
  })
  closed.mockClear()
  vi.spyOn(toast, 'success').mockReturnValue('toast')
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    deletions: {
      supported: true,
      requires_writer_drain: true,
      audit_tombstone: true,
      physical_erasure_certified: false,
      publication_state: 'operation',
    },
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
  vi.spyOn(memoryAPI.revision, 'operation').mockImplementation(
    async (_bank, id) => operation(id),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  host.remove()
  vi.restoreAllMocks()
})
async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryDeletionDialog memory={bank} onClose={closed} />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() => expect(button('common.delete').disabled).toBe(false))
}

it('waits for writers and explicit cleanup confirmation rather than accepting 202 or index ready as deleted', async () => {
  const post = vi
    .spyOn(memoryAPI.revision, 'deleteBank')
    .mockImplementation(async (_bank, id) => operation(id))
  const legacy = vi.spyOn(memoryAPI.memory, 'delete')
  await render()
  await click('common.delete')
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.deletion.pending'),
  )
  expect(closed).not.toHaveBeenCalled()
  expect(toast.success).not.toHaveBeenCalled()
  expect(legacy).not.toHaveBeenCalled()
  expect(button('common.cancel').disabled).toBe(true)
  expect(document.body.textContent).toContain(
    'memory.deletion.drain.active_attempts',
  )
  const id = post.mock.calls[0][1]
  vi.mocked(memoryAPI.revision.operation).mockResolvedValue({
    ...operation(id),
    index_sync_status: 'ready',
  })
  await click('memory.revisions.refreshStatus')
  expect(closed).not.toHaveBeenCalled()
  vi.mocked(memoryAPI.revision.operation).mockResolvedValue(operation(id, true))
  await click('memory.revisions.refreshStatus')
  await vi.waitFor(() => expect(closed).toHaveBeenCalledOnce())
  expect(post).toHaveBeenCalledOnce()
  expect(client.getQueryData(memoryKeys.list({}))).toEqual({
    memory_list: [other],
    total_count: 1,
  })
})

it('retains the original command after a 503 and a busy reconciliation without reposting', async () => {
  const post = vi
    .spyOn(memoryAPI.revision, 'deleteBank')
    .mockRejectedValue(new APIError(503, 'unknown', 'Unconfirmed', {}))
  const reconcile = vi
    .spyOn(memoryAPI.revision, 'reconcile')
    .mockRejectedValue(
      new APIError(
        409,
        'publication_attempt_still_inflight',
        'Still running',
        {},
      ),
    )
  await render()
  await click('common.delete')
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.revisions.unknown'),
  )
  const id = post.mock.calls[0][1]
  expect(document.body.textContent).toContain(id)
  expect(button('common.delete')).toBeUndefined()
  await vi.waitFor(() =>
    expect(button('memory.revisions.reconcile')).toBeDefined(),
  )
  await click('memory.revisions.reconcile')
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.revisions.inflight'),
  )
  expect(reconcile).toHaveBeenCalledWith('bank', id)
  expect(post).toHaveBeenCalledOnce()
  expect(closed).not.toHaveBeenCalled()
  expect(client.getQueryData(memoryKeys.list({}))).toEqual({
    memory_list: [bank, other],
    total_count: 2,
  })
})

it('does not enable managed deletion when the backend capability remains false', async () => {
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue({
    revisions: {
      supported: true,
      managed: true,
      activation_scope: 'memory_bank',
      ordinary_writes_after_activation: false,
      managed_delete_supported: false,
      max_content_bytes: 65535,
      max_content_tokens: 8192,
    },
  })
  const post = vi.spyOn(memoryAPI.revision, 'deleteBank')
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryDeletionDialog memory={bank} onClose={closed} />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.deletion.unavailable'),
  )
  expect(button('common.delete').disabled).toBe(true)
  expect(post).not.toHaveBeenCalled()
})

it('uses coordinated deletion for a strict unmanaged bank when the deletion capability is enabled', async () => {
  const capabilities = await memoryAPI.revision.capabilities('bank')
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue({
    ...capabilities,
    revisions: { ...capabilities.revisions!, managed: false },
  })
  const post = vi
    .spyOn(memoryAPI.revision, 'deleteBank')
    .mockImplementation(async (_bank, id) => operation(id))
  const legacy = vi.spyOn(memoryAPI.memory, 'delete')
  await render()
  await click('common.delete')
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.deletion.pending'),
  )
  expect(post).toHaveBeenCalledOnce()
  expect(legacy).not.toHaveBeenCalled()
  expect(closed).not.toHaveBeenCalled()
})

it('requires the full deletion receipt and preserves unrelated bank caches and the operation handle', async () => {
  expect(
    confirmedMemoryDeletion({ ...operation(), lifecycle: 'deleted' }),
  ).toBe(false)
  expect(
    confirmedMemoryDeletion({
      ...operation(),
      tracked_cleanup_confirmed: true,
    }),
  ).toBe(false)
  client.setQueryData(memoryKeys.messageContent('bank', '11'), {
    content: 'deleted body',
  })
  client.setQueryData(memoryKeys.messageContent('other', '12'), {
    content: 'other body',
  })
  client.setQueryData(
    memoryRevisionKeys.operation('bank', 'delete'),
    operation('delete', true),
  )
  await clearDeletedMemory(client, 'bank')
  expect(
    client.getQueryData(memoryKeys.messageContent('bank', '11')),
  ).toBeUndefined()
  expect(client.getQueryData(memoryKeys.messageContent('other', '12'))).toEqual(
    { content: 'other body' },
  )
  expect(
    client.getQueryData(memoryRevisionKeys.operation('bank', 'delete')),
  ).toBeDefined()
})

it('retains legacy deletion for an unmanaged bank without the coordinated capability', async () => {
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue({})
  const legacy = vi
    .spyOn(memoryAPI.memory, 'delete')
    .mockResolvedValue(undefined)
  const post = vi.spyOn(memoryAPI.revision, 'deleteBank')
  await render()
  await click('common.delete')
  await vi.waitFor(() => expect(closed).toHaveBeenCalledOnce())
  expect(legacy).toHaveBeenCalledWith('bank')
  expect(post).not.toHaveBeenCalled()
})

it('reports each managed writer capability and keeps old restricted behavior when flags are absent', async () => {
  await act(async () =>
    root.render(
      <MemoryManagedNotice
        activation
        capabilities={{
          writes: {
            supported: true,
            append: true,
            automatic_extraction: false,
            fifo: true,
            publication_state: 'operation',
            queue_replay: 'stable_task_id',
            untracked_legacy_tasks: 'operator_attestation',
          },
        }}
      />,
    ),
  )
  const rows = Array.from(host.querySelectorAll('li')).map(
    (item) => item.textContent,
  )
  expect(rows).toEqual([
    'memory.writers.append: memory.writers.supported',
    'memory.writers.automatic_extraction: memory.writers.unavailable',
    'memory.writers.fifo: memory.writers.supported',
  ])
  expect(host.textContent).toContain('memory.writers.legacyDrain')
  expect(host.textContent).not.toContain('memory.revisions.activationImpact')
  await act(async () => root.render(<MemoryManagedNotice activation />))
  expect(host.textContent).toContain('memory.revisions.activationImpact')
})

it('cancels an in-flight stale list before it can restore a confirmed deleted bank', async () => {
  let resolveOld!: (value: unknown) => void
  const request = client.fetchQuery({
    queryKey: memoryKeys.list({}),
    staleTime: 0,
    queryFn: () =>
      new Promise((resolve) => {
        resolveOld = resolve
      }),
  })
  void request.catch(() => undefined)
  await clearDeletedMemory(client, 'bank')
  resolveOld({ memory_list: [bank, other], total_count: 2 })
  await Promise.resolve()
  expect(client.getQueryData(memoryKeys.list({}))).toEqual({
    memory_list: [other],
    total_count: 1,
  })
})

it('requires a confirmed queue acknowledgement for append readiness without changing old operation kinds', () => {
  const append: MemoryOperation = {
    operation_id: 'append',
    kind: 'append_raw',
    status: 'published',
    index_sync_status: 'ready',
    retryable: true,
  }
  for (const queue_state of ['pending', 'unknown', undefined] as const)
    expect(memoryOperationReady({ ...append, queue_state })).toBe(false)
  for (const queue_state of ['submitted', 'not_required'] as const)
    expect(memoryOperationReady({ ...append, queue_state })).toBe(true)
  expect(
    memoryOperationReady({
      ...append,
      queue_state: 'submitted',
      index_sync_status: 'pending',
    }),
  ).toBe(false)
  expect(memoryOperationReady({ ...append, kind: 'revise' })).toBe(true)
})

it('keeps an indexed append with unknown queue acknowledgement out of the success state', async () => {
  vi.mocked(memoryAPI.revision.operation).mockResolvedValue({
    operation_id: 'append',
    kind: 'append_raw',
    status: 'published',
    index_sync_status: 'ready',
    queue_state: 'unknown',
    retryable: true,
    raw_source_id: '9007199254740993',
    extraction_task_id: 'stable-task',
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryOperationPanel
          memoryId="bank"
          operationId="append"
          onRefresh={() => undefined}
        />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.writers.queueUnconfirmed'),
  )
  expect(host.textContent).not.toContain('memory.revisions.ready')
  expect(host.textContent).not.toContain('memory.writers.rawPublished')
  expect(host.textContent).toContain('memory.writers.extractionBoundary')
  expect(host.textContent).toContain('9007199254740993')
  expect(host.textContent).toContain('stable-task')
  expect(host.querySelector('.bg-components-alert-success-bg')).toBeNull()
  expect(host.querySelector('.bg-components-alert-warning-bg')).not.toBeNull()
})

it('labels a submitted extraction task separately from raw conversation publication', async () => {
  vi.mocked(memoryAPI.revision.operation).mockResolvedValue({
    operation_id: 'append',
    kind: 'append_raw',
    status: 'published',
    index_sync_status: 'ready',
    queue_state: 'submitted',
    retryable: false,
    extraction_task_id: 'stable-task',
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryOperationPanel
          memoryId="bank"
          operationId="append"
          onRefresh={() => undefined}
        />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.writers.rawPublished'),
  )
  expect(host.textContent).toContain('memory.writers.extractionBoundary')
  expect(host.textContent).not.toContain('memory.revisions.ready')
})
