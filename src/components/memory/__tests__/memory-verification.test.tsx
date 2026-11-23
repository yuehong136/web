import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { useAuthStore } from '@/stores/auth'
import { APIError } from '@/api/client'
import { MemoryVerificationPanel } from '../memory-verification-panel'
import { memoryVerificationKeys } from '@/hooks/memory-verification-keys'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import type {
  MemoryVerificationHistory,
  MemoryVerificationOperation,
} from '@/types/memory-verification'
import {
  verificationCapability,
  verificationSnapshot,
  verificationRecord,
  verificationEntry,
  verificationSource,
} from './memory-verification-fixture'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
let host: HTMLDivElement,
  root: Root,
  cache: QueryClient,
  history: MemoryVerificationHistory
function Location() {
  return <output data-location>{useLocation().search}</output>
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  history = {
    records: [],
    next_cursor: null,
    has_more: false,
    snapshot_only: true,
  }
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    verification: verificationCapability,
  })
  vi.spyOn(memoryAPI.verification, 'history').mockImplementation(async () =>
    structuredClone(history),
  )
  vi.spyOn(memoryAPI.verification, 'snapshot').mockResolvedValue(
    verificationSnapshot(),
  )
  vi.spyOn(memoryAPI.verification, 'operation').mockRejectedValue(
    new APIError(404, 'not_found', 'private'),
  )
  vi.spyOn(memoryAPI.verification, 'record').mockImplementation(
    async (_id, _eid, body) => {
      const record = {
        ...verificationRecord(),
        result: body.result,
        effective_status: body.result,
        review_required: body.result !== 'human_confirmed',
        notes: body.notes,
        applicability: body.applicability,
        evidence: body.evidence,
      }
      const operation: MemoryVerificationOperation = {
        operation_id: body.operation_id,
        kind: 'verification_record',
        status: 'ready',
        verification_id: record.verification_id,
        head_version: '1',
        record,
      }
      history = { ...history, records: [record] }
      vi.mocked(memoryAPI.verification.operation).mockResolvedValue(operation)
      return operation
    },
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function render(
  path = '/memory/bank/verification',
  bank = 'bank',
  key = 'initial',
) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryRouter key={key} initialEntries={[path]}>
          <Location />
          <MemoryVerificationPanel
            key={bank}
            memoryId={bank}
            entryId={verificationEntry}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}
const button = (label: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent === label,
  )!
const url = () => host.querySelector('output')!.textContent!
async function fillLabel(label: string, value: string) {
  await act(async () => {
    const target = [...host.querySelectorAll<HTMLLabelElement>('label')].find(
        (item) => item.textContent === label,
      )!,
      element = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[id="${target.htmlFor}"]`,
      )!,
      prototype =
        element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
      element,
      value,
    )
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}
async function prepare() {
  await act(async () => button('memory.verification.prepare').click())
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Complete current text'),
  )
}
async function draft() {
  await fillLabel(
    'memory.verification.applicability',
    'Only this exact controlled snapshot',
  )
  await fillLabel('memory.verification.evidence', 'Human-reviewed notes')
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
}
it('loads a snapshot only on explicit action and sends a version-bound human assessment after confirmation', async () => {
  await render()
  await vi.waitFor(() =>
    expect(button('memory.verification.prepare')).toBeDefined(),
  )
  expect(memoryAPI.verification.snapshot).not.toHaveBeenCalled()
  expect(memoryAPI.verification.record).not.toHaveBeenCalled()
  await prepare()
  expect(host.querySelector('script')).toBeNull()
  expect(button('memory.verification.record').disabled).toBe(true)
  expect(
    host
      .querySelector<HTMLAnchorElement>('a[target="_blank"]')!
      .getAttribute('href'),
  ).toBe('/memory/bank')
  await draft()
  await act(async () => button('memory.verification.record').click())
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.verification.recordingReady'),
  )
  expect(memoryAPI.verification.record).toHaveBeenCalledWith(
    'bank',
    verificationEntry,
    expect.objectContaining({
      expected_head_version: '0',
      expected_binding_sha256: 'f'.repeat(64),
      result: 'needs_review',
      method: 'source_comparison',
    }),
  )
  expect(
    vi.mocked(memoryAPI.verification.record).mock.calls[0][2],
  ).not.toHaveProperty('actor_id')
  expect(host.textContent).not.toContain(
    'memory.verification.statuses.human_confirmed',
  )
  expect(url()).toContain('verification_operation=')
})
it('retains the original unknown operation and body, performs no automatic retry, and reloads by GET only', async () => {
  vi.mocked(memoryAPI.verification.record).mockRejectedValue(
    new APIError(503, 'unknown', 'private provider detail'),
  )
  await render()
  await vi.waitFor(() =>
    expect(button('memory.verification.prepare')).toBeDefined(),
  )
  await prepare()
  await draft()
  await act(async () => button('memory.verification.record').click())
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.verification.unknown'),
  )
  const original = structuredClone(
      vi.mocked(memoryAPI.verification.record).mock.calls[0][2],
    ),
    path = '/memory/bank/verification' + url()
  expect(host.textContent).not.toContain('private provider detail')
  await act(async () => button('memory.verification.read').click())
  expect(memoryAPI.verification.record).toHaveBeenCalledOnce()
  await act(async () => button('memory.verification.retry').click())
  expect(vi.mocked(memoryAPI.verification.record).mock.calls[1][2]).toEqual(
    original,
  )
  await render(path, 'bank', 'reloaded')
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'memory.verification.operationUnconfirmed',
    ),
  )
  expect(memoryAPI.verification.record).toHaveBeenCalledTimes(2)
  expect(button('memory.verification.retry')).toBeUndefined()
  expect(host.textContent).not.toContain('memory.verification.recordingReady')
})
it('requires a new explicit snapshot after a head or binding conflict without silently rereading or recording', async () => {
  vi.mocked(memoryAPI.verification.record).mockRejectedValue(
    new APIError(409, 'binding_changed', 'private'),
  )
  await render()
  await vi.waitFor(() =>
    expect(button('memory.verification.prepare')).toBeDefined(),
  )
  await prepare()
  await draft()
  await act(async () => button('memory.verification.record').click())
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.verification.stale'),
  )
  expect(url()).not.toContain('verification_operation=')
  expect(memoryAPI.verification.snapshot).toHaveBeenCalledOnce()
  expect(button('memory.verification.record')).toBeUndefined()
})
it('a known source change immediately disables the old snapshot and permanently withdrawn bodies cannot remain in the form', async () => {
  await render()
  await vi.waitFor(() =>
    expect(button('memory.verification.prepare')).toBeDefined(),
  )
  await prepare()
  await draft()
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.source('bank', verificationSource), {
      memory_id: 'bank',
      source_id: verificationSource,
      state: 'forgotten',
      generation: 3,
      source_revision: 1,
      content_sha256: 'c'.repeat(64),
      managed: true,
    }),
  )
  expect(
    cache.getQueryData<{ entry_content: string | null }>(
      memoryVerificationKeys.snapshot('bank', verificationEntry),
    )!.entry_content,
  ).toBeNull()
  await vi.waitFor(() =>
    expect(host.textContent).not.toContain('Complete current text'),
  )
  expect(button('memory.verification.record')).toBeUndefined()
  expect(memoryAPI.verification.record).not.toHaveBeenCalled()
})
it('does not render a late snapshot after changing banks', async () => {
  let resolve!: (value: ReturnType<typeof verificationSnapshot>) => void
  vi.mocked(memoryAPI.verification.snapshot).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  await render()
  await vi.waitFor(() =>
    expect(button('memory.verification.prepare')).toBeDefined(),
  )
  await act(async () => button('memory.verification.prepare').click())
  await render('/memory/other/verification', 'other', 'other')
  await act(async () => resolve(verificationSnapshot()))
  expect(host.textContent).not.toContain('Complete current text')
  expect(url()).not.toContain('verification_operation')
})

it('drops an old actor unknown command body before another actor can retry it', async () => {
  const token = useAuthStore.getState().token
  try {
    vi.mocked(memoryAPI.verification.record).mockRejectedValue(
      new APIError(503, 'unknown', 'private'),
    )
    await render()
    await vi.waitFor(() =>
      expect(button('memory.verification.prepare')).toBeDefined(),
    )
    await prepare()
    await draft()
    await act(async () => button('memory.verification.record').click())
    await vi.waitFor(() =>
      expect(button('memory.verification.retry')).toBeDefined(),
    )
    await act(async () =>
      useAuthStore.setState({ token: 'controlled-new-actor' }),
    )
    await vi.waitFor(() =>
      expect(button('memory.verification.retry')).toBeUndefined(),
    )
    expect(host.textContent).not.toContain('Human-reviewed notes')
    expect(memoryAPI.verification.record).toHaveBeenCalledOnce()
  } finally {
    await act(async () => useAuthStore.setState({ token }))
  }
})
