import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { MemoryRevisionPanel } from '../memory-revision-panel'
import { MemorySourcePanel } from '../memory-source-panel'
import type { MemoryEntry, MemoryOperation } from '@/types/memory-revisions'
import type { MemoryMessage } from '@/types/memory'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
const entry: MemoryEntry = {
  entry_id: 'entry-a',
  memory_id: 'bank',
  legacy_message_id: '11',
  current_message_id: '11',
  current_revision: 1,
  generation: 1,
  state: 'active',
  current: {
    revision: 1,
    parent_revision: null,
    message_id: '11',
    content: 'Original memory',
    content_sha256: 'a'.repeat(64),
    origin: 'legacy',
    assessment: {},
    redacted: false,
    sources: [],
  },
}
const operation = (id = 'op', ready = false): MemoryOperation => ({
  operation_id: id,
  kind: 'revise',
  status: ready ? 'ready' : 'accepted',
  index_sync_status: ready ? 'ready' : 'pending',
  retryable: !ready,
})
let host: HTMLDivElement, root: Root, client: QueryClient
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    revisions: {
      supported: true,
      managed: false,
      activation_scope: 'memory_bank',
      ordinary_writes_after_activation: false,
      managed_delete_supported: false,
      max_content_bytes: 65535,
      max_content_tokens: 8192,
    },
    source_withdrawals: { supported: true, permanent: true },
  })
  vi.spyOn(memoryAPI.revision, 'history').mockResolvedValue({
    revisions: [],
    next_cursor: null,
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
async function render(messageId = 11) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRevisionPanel
          memoryId="bank"
          message={
            { message_id: messageId, message_type: 'semantic' } as MemoryMessage
          }
        />
      </QueryClientProvider>,
    ),
  )
}
const button = (key: string) =>
  Array.from(host.querySelectorAll('button')).find(
    (b) => b.textContent === key,
  )!
async function click(key: string) {
  await act(async () => button(key).click())
}
async function fill(selector: string, value: string) {
  const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    selector,
  )!
  await act(async () => {
    const prototype =
      input.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

it('reads mapping without adoption and requires explicit bank-wide acknowledgement', async () => {
  vi.spyOn(memoryAPI.revision, 'findEntry').mockResolvedValue(null)
  const adopt = vi
    .spyOn(memoryAPI.revision, 'adoptEntry')
    .mockResolvedValue(operation('adopt', true))
  await render()
  await vi.waitFor(() => expect(button('memory.revisions.adopt')).toBeDefined())
  expect(adopt).not.toHaveBeenCalled()
  expect(host.textContent).toContain('memory.revisions.activationImpact')
  expect(button('memory.revisions.adopt').disabled).toBe(true)
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await click('memory.revisions.adopt')
  await vi.waitFor(() => expect(adopt).toHaveBeenCalledOnce())
  expect(adopt.mock.calls[0][2]).toBe('11')
})

it('rejects unsafe legacy numbers before looking up or adopting the wrong row', async () => {
  const find = vi.spyOn(memoryAPI.revision, 'findEntry')
  await render(9007199254740992)
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.revisions.unsafeId'),
  )
  expect(find).not.toHaveBeenCalled()
})

it('requires a matching preview, never treats accepted as ready, and advances only on explicit reconciliation', async () => {
  vi.spyOn(memoryAPI.revision, 'findEntry').mockResolvedValue(entry)
  const revise = vi
    .spyOn(memoryAPI.revision, 'revise')
    .mockImplementation(async (_bank, _entry, command) =>
      command.dry_run
        ? {
            dry_run: true,
            entry_id: entry.entry_id,
            expected_revision: 1,
            current_revision: 1,
            content: command.content!,
            content_sha256: 'b'.repeat(64),
            estimated_tokens: 12,
            source_checks: [],
            diff: { old_text: 'Original memory', new_text: command.content! },
          }
        : operation(command.operation_id),
    )
  const reconcile = vi
    .spyOn(memoryAPI.revision, 'reconcile')
    .mockImplementation(async (_bank, id) => operation(id, true))
  await render()
  await vi.waitFor(() =>
    expect(host.querySelector('#revision-content')).not.toBeNull(),
  )
  await fill('#revision-content', 'Corrected memory')
  await fill('#revision-reason', 'User correction')
  expect(button('memory.revisions.submit').disabled).toBe(true)
  await click('memory.revisions.preview')
  await vi.waitFor(() =>
    expect(button('memory.revisions.submit').disabled).toBe(false),
  )
  await fill('#revision-reason', 'Updated reason')
  expect(button('memory.revisions.submit').disabled).toBe(true)
  await click('memory.revisions.preview')
  await vi.waitFor(() =>
    expect(button('memory.revisions.submit').disabled).toBe(false),
  )
  await click('memory.revisions.submit')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.revisions.pending'),
  )
  expect(host.textContent).not.toContain('memory.revisions.ready')
  expect(reconcile).not.toHaveBeenCalled()
  await click('memory.revisions.refreshStatus')
  expect(reconcile).not.toHaveBeenCalled()
  await click('memory.revisions.reconcile')
  await vi.waitFor(() => expect(reconcile).toHaveBeenCalledOnce())
  expect(revise.mock.calls.filter((call) => !call[2].dry_run)).toHaveLength(1)
})

it('requires a fresh preview after 409 and keeps unknown commits tied to their original operation', async () => {
  vi.spyOn(memoryAPI.revision, 'findEntry').mockResolvedValue(entry)
  let reject = 409
  const revise = vi
    .spyOn(memoryAPI.revision, 'revise')
    .mockImplementation(async (_bank, _entry, command) => {
      if (!command.dry_run)
        throw new APIError(reject, 'fixture', 'Untrusted secret', {
          error_code: 'expected_revision_mismatch',
        })
      return {
        dry_run: true,
        entry_id: entry.entry_id,
        expected_revision: 1,
        current_revision: 1,
        content: command.content!,
        content_sha256: 'b'.repeat(64),
        estimated_tokens: 1,
        source_checks: [],
        diff: { old_text: 'Original memory', new_text: command.content! },
      }
    })
  await render()
  await vi.waitFor(() =>
    expect(host.querySelector('#revision-reason')).not.toBeNull(),
  )
  await fill('#revision-reason', 'Correct')
  await click('memory.revisions.preview')
  await vi.waitFor(() =>
    expect(button('memory.revisions.submit').disabled).toBe(false),
  )
  await click('memory.revisions.submit')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.revisions.conflict'),
  )
  expect(button('memory.revisions.submit').disabled).toBe(true)
  expect(host.textContent).not.toContain('Untrusted secret')
  reject = 503
  await click('memory.revisions.preview')
  await vi.waitFor(() =>
    expect(button('memory.revisions.submit').disabled).toBe(false),
  )
  await click('memory.revisions.submit')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.revisions.unknown'),
  )
  expect(button('memory.revisions.preview').disabled).toBe(true)
  await click('memory.revisions.refreshStatus')
  expect(revise.mock.calls.filter((call) => !call[2].dry_run)).toHaveLength(2)
})

it('requires reason and explicit source-wide withdrawal confirmation, with read-only initial lookup', async () => {
  vi.spyOn(memoryAPI.revision, 'source').mockResolvedValue({
    managed: true,
    memory_id: 'bank',
    source_id: '9007199254740993',
    source_revision: 2,
    generation: 1,
    state: 'active',
    content_sha256: 'a'.repeat(64),
    scope: { user_id: 'external' },
  })
  const withdraw = vi
    .spyOn(memoryAPI.revision, 'withdraw')
    .mockResolvedValue(operation('withdraw'))
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemorySourcePanel memoryId="bank" sourceId="9007199254740993" />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(button('memory.revisions.withdraw')).toBeDefined(),
  )
  expect(withdraw).not.toHaveBeenCalled()
  expect(button('memory.revisions.withdraw').disabled).toBe(true)
  await fill('input', 'Source revoked')
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await click('memory.revisions.withdraw')
  await vi.waitFor(() => expect(withdraw).toHaveBeenCalledOnce())
  expect(withdraw.mock.calls[0][1]).toBe('9007199254740993')
  expect(withdraw.mock.calls[0][3]).toBe(2)
  expect(host.textContent).toContain('memory.revisions.withdrawScope')
})

it('refreshes a stale source revision after 409 and requires a new withdrawal acknowledgement', async () => {
  let revision = 2
  vi.spyOn(memoryAPI.revision, 'source').mockImplementation(async () => ({
    managed: true,
    memory_id: 'bank',
    source_id: '10',
    source_revision: revision,
    generation: revision,
    state: 'active',
    content_sha256: 'a'.repeat(64),
    scope: {},
  }))
  const withdraw = vi
    .spyOn(memoryAPI.revision, 'withdraw')
    .mockImplementation(async () => {
      revision = 3
      throw new APIError(409, 'conflict', 'Untrusted detail', {
        error_code: 'expected_source_revision_mismatch',
      })
    })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemorySourcePanel memoryId="bank" sourceId="10" />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(button('memory.revisions.withdraw')).toBeDefined(),
  )
  await fill('input', 'Source revoked')
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await click('memory.revisions.withdraw')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.revisions.conflict'),
  )
  expect(
    host.querySelector('[role="checkbox"]')?.getAttribute('aria-checked'),
  ).toBe('false')
  expect(button('memory.revisions.withdraw').disabled).toBe(true)
  expect(withdraw).toHaveBeenCalledOnce()
  expect(host.textContent).not.toContain('Untrusted detail')
})

it('keeps a busy reconciliation on the original operation without unlocking or resubmitting the edit', async () => {
  vi.spyOn(memoryAPI.revision, 'findEntry').mockResolvedValue(entry)
  const revise = vi
    .spyOn(memoryAPI.revision, 'revise')
    .mockImplementation(async (_bank, _entry, command) =>
      command.dry_run
        ? {
            dry_run: true,
            entry_id: entry.entry_id,
            expected_revision: 1,
            current_revision: 1,
            content: command.content!,
            content_sha256: 'b'.repeat(64),
            estimated_tokens: 1,
            source_checks: [],
            diff: { old_text: 'Original memory', new_text: command.content! },
          }
        : operation(command.operation_id),
    )
  const reconcile = vi.spyOn(memoryAPI.revision, 'reconcile').mockRejectedValue(
    new APIError(409, 'conflict', 'Unsafe detail', {
      error_code: 'publication_attempt_still_inflight',
    }),
  )
  await render()
  await vi.waitFor(() =>
    expect(host.querySelector('#revision-reason')).not.toBeNull(),
  )
  await fill('#revision-reason', 'Controlled correction')
  await click('memory.revisions.preview')
  await vi.waitFor(() =>
    expect(button('memory.revisions.submit').disabled).toBe(false),
  )
  await click('memory.revisions.submit')
  await vi.waitFor(() =>
    expect(button('memory.revisions.reconcile')).toBeDefined(),
  )
  await click('memory.revisions.reconcile')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.revisions.inflight'),
  )
  const original = revise.mock.calls.find((call) => !call[2].dry_run)![2]
    .operation_id
  expect(reconcile.mock.calls[0][1]).toBe(original)
  expect(host.textContent).toContain(original)
  expect(button('memory.revisions.preview').disabled).toBe(true)
  expect(revise.mock.calls.filter((call) => !call[2].dry_run)).toHaveLength(1)
})

it('redacts cached content and the stale edit draft after source withdrawal while keeping operation controls visible', async () => {
  const { MemoryMessageInspector } = await import('../memory-message-inspector')
  let withdrawn = false
  const current = () => ({
    ...entry,
    state: withdrawn ? 'withdrawn' : 'active',
    current: {
      ...entry.current,
      content: withdrawn ? null : 'Original memory',
      redacted: withdrawn,
      sources: [
        {
          source_id: '10',
          source_revision: 1,
          generation: 1,
          content_sha256: 'a'.repeat(64),
          relation: 'conversation',
          locator: {},
        },
      ],
    },
  })
  vi.spyOn(memoryAPI.revision, 'findEntry').mockImplementation(async () =>
    current(),
  )
  vi.spyOn(memoryAPI.revision, 'history').mockImplementation(async () => ({
    revisions: [current().current],
    next_cursor: null,
  }))
  vi.spyOn(memoryAPI.message, 'getContent').mockImplementation(async () => {
    if (withdrawn) throw new APIError(404, 'missing', 'Not supplied')
    return { content: 'Original memory' }
  })
  vi.spyOn(memoryAPI.revision, 'source').mockImplementation(async () => ({
    managed: true,
    memory_id: 'bank',
    source_id: '10',
    source_revision: 1,
    generation: 1,
    state: withdrawn ? 'forgotten' : 'active',
    content_sha256: 'a'.repeat(64),
    scope: {},
  }))
  vi.spyOn(memoryAPI.revision, 'withdraw').mockImplementation(
    async (_bank, _source, id) => {
      withdrawn = true
      return operation(id)
    },
  )
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryMessageInspector
          memoryId="bank"
          message={
            {
              message_id: 11,
              message_type: 'semantic',
              session_id: 's',
              content: 'Original memory',
            } as MemoryMessage
          }
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(document.querySelector('#revision-content')).not.toBeNull(),
  )
  await act(async () => {
    const input =
      document.querySelector<HTMLTextAreaElement>('#revision-content')!
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!.call(input, 'Sensitive unsent draft')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const region = document.querySelector<HTMLElement>(
    'section[aria-label="memory.revisions.source 10"]',
  )!
  await act(async () => {
    const input = region.querySelector('input')!
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, 'Controlled withdrawal')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    region.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click()
  })
  const withdrawButton = Array.from(region.querySelectorAll('button')).find(
    (b) => b.textContent === 'memory.revisions.withdraw',
  )!
  await act(async () => withdrawButton.click())
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.revisions.withdrawn'),
  )
  await vi.waitFor(() =>
    expect(document.querySelector('#revision-content')).toBeNull(),
  )
  expect(document.body.textContent).not.toContain('Original memory')
  expect(document.body.textContent).not.toContain('Sensitive unsent draft')
  expect(document.body.textContent).toContain('memory.revisions.refreshStatus')
})

it('bounds correction reasons to the current backend contract before previewing', async () => {
  vi.spyOn(memoryAPI.revision, 'findEntry').mockResolvedValue(entry)
  const revise = vi.spyOn(memoryAPI.revision, 'revise')
  await render()
  await vi.waitFor(() =>
    expect(host.querySelector('#revision-reason')).not.toBeNull(),
  )
  expect(
    host.querySelector<HTMLInputElement>('#revision-reason')!.maxLength,
  ).toBe(1024)
  await fill('#revision-reason', 'x'.repeat(1025))
  expect(button('memory.revisions.preview').disabled).toBe(true)
  expect(revise).not.toHaveBeenCalled()
})
