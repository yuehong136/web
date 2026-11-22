import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { MemorySourceEntry } from '../memory-source-entry'
import { MemorySourcePanel } from '../memory-source-panel'
import { sourceCapability } from './memory-source-fixture'
import type {
  MemoryAppendOperation,
  MemoryOperation,
} from '@/types/memory-revisions'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
let host: HTMLDivElement, root: Root, cache: QueryClient
const operations = new Map<string, MemoryOperation>()
const receipt = (id: string): MemoryAppendOperation => ({
  operation_id: id,
  kind: 'append_raw',
  status: 'ready',
  index_sync_status: 'ready',
  retryable: false,
  writer_busy: false,
  raw_source_id: '9007199254740993',
  message_ids: ['9007199254740993'],
  extraction_task_id: null,
  queue_state: 'not_required',
  evicted_sources: [],
})
function Location() {
  const navigate = useNavigate()
  return (
    <>
      <output data-location>{useLocation().search}</output>
      <button
        onClick={() => navigate('/memory/bank?source_operation=source-other')}
      >
        switch-operation
      </button>
    </>
  )
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.setAttribute('open', '')
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.removeAttribute('open')
    },
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  operations.clear()
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    structured_sources: sourceCapability,
    source_withdrawals: { supported: true, permanent: true },
    revisions: {
      supported: true,
      managed: false,
      activation_scope: 'memory_bank',
      ordinary_writes_after_activation: true,
      managed_delete_supported: true,
      max_content_bytes: 65535,
      max_content_tokens: 8192,
    },
  })
  vi.spyOn(memoryAPI.revision, 'operation').mockImplementation(
    async (_bank, id) =>
      operations.get(id) ?? {
        operation_id: id,
        kind: 'append_raw',
        status: 'accepted',
        index_sync_status: 'pending',
        retryable: false,
        can_reconcile: false,
        queue_state: 'unknown',
      },
  )
  vi.spyOn(memoryAPI.revision, 'source').mockResolvedValue({
    managed: true,
    memory_id: 'bank',
    source_id: '9007199254740993',
    source_revision: 1,
    generation: 1,
    state: 'active',
    content_sha256: 'a'.repeat(64),
    scope: { user_id: 'actor', agent_id: '', session_id: '' },
  })
  vi.spyOn(memoryAPI.sources, 'create').mockImplementation(
    async (_bank, command) => {
      const result = receipt(command.operation_id)
      operations.set(command.operation_id, result)
      return result
    },
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
async function render(path = '/memory/bank', factory = () => 'source-stable') {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryRouter initialEntries={[path]}>
          <MemorySourceEntry memoryId="bank" operationIdFactory={factory} />
          <Location />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}
const button = (text: string) =>
  [...document.querySelectorAll('button')].find(
    (node) => node.textContent === text,
  )
async function click(text: string) {
  await vi.waitFor(() => expect(button(text)).toBeDefined())
  await act(async () => button(text)!.click())
}
async function fill(selector: string, value: string) {
  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    selector,
  )!
  expect(input).not.toBeNull()
  await act(async () => {
    const prototype =
      input.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function openAndFill() {
  await click('memory.sourceEntry.title')
  await fill('#source-entry-agent', ' agent ')
  await fill('#source-entry-session', '')
  await fill('dialog textarea', 'Owned private draft🧭')
}
async function submit() {
  await act(async () =>
    document
      .querySelector('dialog form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
}
it('submits once with an exact scope, unknown time and stable URL identity while draft text stays out of caches', async () => {
  const factory = vi.fn(() => 'source-stable')
  await render(undefined, factory)
  await openAndFill()
  await submit()
  await vi.waitFor(() =>
    expect(memoryAPI.sources.create).toHaveBeenCalledOnce(),
  )
  expect(vi.mocked(memoryAPI.sources.create).mock.calls[0]).toEqual([
    'bank',
    {
      operation_id: 'source-stable',
      user_id: '',
      agent_id: ' agent ',
      session_id: '',
      event_time: null,
      segments: [{ role: 'user', content: 'Owned private draft🧭' }],
    },
  ])
  expect(host.querySelector('[data-location]')!.textContent).toContain(
    'source_operation=source-stable',
  )
  expect(host.querySelector('[data-location]')!.textContent).not.toContain(
    'Owned',
  )
  expect(factory).toHaveBeenCalledOnce()
  expect(
    JSON.stringify(
      cache
        .getMutationCache()
        .getAll()
        .map((row) => row.state),
    ),
  ).not.toContain('Owned private draft')
  expect(document.querySelector('dialog textarea')).toBeNull()
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.sourceEntry.recorded'),
  )
})
it('a refresh-style URL recovery only reads the original operation without constructing or submitting a draft', async () => {
  operations.set('source-original', receipt('source-original'))
  await render('/memory/bank?source_operation=source-original')
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.sourceEntry.recorded'),
  )
  expect(memoryAPI.sources.create).not.toHaveBeenCalled()
  expect(document.querySelector('dialog textarea')).toBeNull()
  expect(memoryAPI.revision.operation).toHaveBeenCalledWith(
    'bank',
    'source-original',
    expect.anything(),
  )
})
it('unknown completion cannot change identity or send the body again after closing and reopening', async () => {
  vi.mocked(memoryAPI.sources.create).mockRejectedValue(
    new APIError(503, '503', 'private error'),
  )
  await render()
  await openAndFill()
  await submit()
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('memory.revisions.unknown'),
  )
  expect(button('memory.sourceEntry.new')).toBeUndefined()
  expect(document.querySelector('dialog textarea')).toBeNull()
  await click('common.close')
  await click('memory.sourceEntry.resume')
  expect(memoryAPI.sources.create).toHaveBeenCalledOnce()
  expect(host.textContent).toContain('source_operation=source-stable')
})
it('closing an unsubmitted form discards its private draft', async () => {
  await render()
  await openAndFill()
  await click('common.close')
  await click('memory.sourceEntry.title')
  expect(
    document.querySelector<HTMLTextAreaElement>('dialog textarea')!.value,
  ).toBe('')
  expect(memoryAPI.sources.create).not.toHaveBeenCalled()
})
it('an actor change discards draft and cannot publish a late request result into the new owner cache', async () => {
  let resolve!: (value: MemoryAppendOperation) => void
  vi.mocked(memoryAPI.sources.create).mockReturnValue(
    new Promise((yes) => {
      resolve = yes
    }),
  )
  await render()
  await openAndFill()
  await submit()
  await act(async () => useAuthStore.setState({ token: 'other-owner' }))
  await act(async () => resolve(receipt('source-stable')))
  expect(
    cache.getQueryData(memoryRevisionKeys.operation('bank', 'source-stable')),
  ).not.toMatchObject({ index_sync_status: 'ready' })
  expect(document.querySelector('dialog textarea')).toBeNull()
})
it('only an explicit new submission after a ready receipt returns to an empty form', async () => {
  await render()
  await openAndFill()
  await submit()
  await click('memory.sourceEntry.new')
  expect(
    document.querySelector<HTMLTextAreaElement>('dialog textarea')!.value,
  ).toBe('')
  expect(host.textContent).not.toContain('source_operation=source-stable')
  expect(memoryAPI.sources.create).toHaveBeenCalledOnce()
})
it.each([true, false])(
  'a domain422 releases identity only for a proven pre-admission code: %s',
  async (safe) => {
    vi.mocked(memoryAPI.sources.create).mockRejectedValue(
      new APIError(422, '422', 'private', {
        error_code: safe
          ? 'append_content_tokens_exceeded'
          : 'unknown_post_admission_problem',
      }),
    )
    await render()
    await openAndFill()
    await submit()
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('memory.revisions.failed'),
    )
    expect(!!button('memory.sourceEntry.new')).toBe(safe)
    expect(memoryAPI.sources.create).toHaveBeenCalledOnce()
  },
)
it('an already registered active source in an unmanaged bank still needs explicit activation acknowledgement', async () => {
  const adopt = vi.spyOn(memoryAPI.revision, 'adoptSource').mockResolvedValue({
    operation_id: 'adopt',
    kind: 'adopt_source',
    status: 'ready',
    index_sync_status: 'ready',
    retryable: false,
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemorySourcePanel memoryId="bank" sourceId="9007199254740993" />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(button('memory.revisions.adoptSource')).toBeDefined(),
  )
  expect(button('memory.revisions.adoptSource')!.disabled).toBe(true)
  expect(adopt).not.toHaveBeenCalled()
  await act(async () =>
    document.querySelector<HTMLButtonElement>('[role=checkbox]')!.click(),
  )
  await click('memory.revisions.adoptSource')
  expect(adopt).toHaveBeenCalledOnce()
})

it('keeps the existing explicit registration action for an unregistered inactive legacy RAW', async () => {
  vi.mocked(memoryAPI.revision.source).mockResolvedValue({
    managed: false,
    source_revision: 0,
    generation: 0,
    memory_id: 'bank',
    source_id: '9007199254740993',
    state: 'inactive',
    content_sha256: 'a'.repeat(64),
    scope: { user_id: 'actor', agent_id: '', session_id: '' },
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemorySourcePanel memoryId="bank" sourceId="9007199254740993" />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(button('memory.revisions.adoptSource')).toBeDefined(),
  )
  expect(button('memory.revisions.adoptSource')!.disabled).toBe(true)
})

it('a rejected late POST cannot release a different pending operation selected in the URL', async () => {
  let reject!: (error: Error) => void
  vi.mocked(memoryAPI.sources.create).mockReturnValue(
    new Promise((_yes, no) => {
      reject = no
    }),
  )
  await render()
  await openAndFill()
  await submit()
  await click('switch-operation')
  await act(async () =>
    reject(
      new APIError(422, '422', 'private', {
        error_code: 'append_content_tokens_exceeded',
      }),
    ),
  )
  expect(host.textContent).toContain('source_operation=source-other')
  expect(button('memory.sourceEntry.new')).toBeUndefined()
  expect(memoryAPI.sources.create).toHaveBeenCalledOnce()
})
