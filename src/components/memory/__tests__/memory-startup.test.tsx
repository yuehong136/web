import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useMemoryStartup } from '@/hooks/use-memory-startup'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { memoryVerificationKeys } from '@/hooks/memory-verification-keys'
import {
  memoryStartupChanged,
  memoryStartupObservation,
} from '@/hooks/memory-startup-fences'
import { boundSourceRange } from '@/lib/memory-source-excerpt'
import { MemoryStartupWorkspace } from '../memory-startup-workspace'
import { MemoryStartupForm } from '../memory-startup-form'
import { MemorySourceReader } from '../memory-source-reader'
import {
  startupPackage,
  startupCapability,
  sourceExcerpt,
} from './memory-startup-fixture'
import type {
  MemoryStartupRequest,
  MemoryStartupPackage,
} from '@/types/memory-startup'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
let root: Root, host: HTMLDivElement, cache: QueryClient
const request: MemoryStartupRequest = {
  user_id: ' alpha ',
  agent_id: '',
  session_id: null,
  entry_ids: null,
  budget_tokens: 4096,
  max_items: 8,
  inventory_limit: 64,
}
function Controller() {
  const state = useMemoryStartup('bank')
  return (
    <>
      <button onClick={() => state.preview(request)}>preview</button>
      <button onClick={() => state.clear(true)}>dirty</button>
      <output>{state.value?.startup_text ?? ''}</output>
      <p>{state.error}</p>
    </>
  )
}
async function render(node = <Controller />) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}
async function click(text: string) {
  const node = [...host.querySelectorAll('button')].find(
    (node) => node.textContent === text,
  )
  expect(node).toBeDefined()
  await act(async () => node!.click())
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((yes) => {
    resolve = yes
  })
  return { promise, resolve }
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.startup, 'preview').mockResolvedValue(startupPackage())
  vi.spyOn(memoryAPI.startup, 'source').mockImplementation(
    async (_id, _source, offset) => sourceExcerpt(offset),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
it('mount/re-render/cache refresh do not generate; preview body is absent from Query and Mutation cache', async () => {
  await render()
  await render()
  await cache.invalidateQueries()
  expect(memoryAPI.startup.preview).not.toHaveBeenCalled()
  await click('preview')
  expect(host.textContent).toContain(startupPackage().startup_text)
  expect(cache.getQueryCache().getAll()).toHaveLength(0)
  expect(
    cache
      .getMutationCache()
      .getAll()
      .every((row) => row.state.data === undefined),
  ).toBe(true)
  await click('dirty')
  expect(host.textContent).not.toContain(startupPackage().startup_text)
})
it('input dirtiness clears synchronously and rejects delayed success even when transport ignores abort', async () => {
  const pending = deferred<MemoryStartupPackage>()
  vi.mocked(memoryAPI.startup.preview).mockReturnValue(pending.promise)
  await render()
  await click('preview')
  await click('dirty')
  await act(async () => pending.resolve(startupPackage()))
  expect(host.textContent).not.toContain(startupPackage().startup_text)
  expect(host.textContent).toContain('memory.startup.stale')
})
it('unmount and actor switch fence a late preview', async () => {
  const pending = deferred<MemoryStartupPackage>()
  vi.mocked(memoryAPI.startup.preview).mockReturnValue(pending.promise)
  await render(
    <MemoryStartupWorkspace memoryId="bank" capability={startupCapability} />,
  )
  const form = host.querySelector('form')!
  await act(async () =>
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ),
  )
  expect(memoryAPI.startup.preview).toHaveBeenCalledOnce()
  await act(async () => useAuthStore.setState({ token: 'changed-owner' }))
  await act(async () => pending.resolve(startupPackage()))
  expect(host.textContent).not.toContain(startupPackage().startup_text)
  expect(host.querySelector('pre')).toBeNull()
})
it.each(['source', 'entry', 'head', 'record'] as const)(
  'known %s change clears displayed package without another POST',
  async (kind) => {
    await render()
    await click('preview')
    const value = startupPackage(),
      item = value.items[0],
      source = item.sources[0]
    await act(async () => {
      if (kind === 'source')
        cache.setQueryData(
          memoryRevisionKeys.source('bank', source.source_id),
          { memory_id: 'bank', state: 'forgotten' },
        )
      if (kind === 'entry')
        cache.setQueryData(memoryRevisionKeys.entry('bank', item.message_id), {
          memory_id: 'bank',
          entry_id: item.entry_id,
          current_revision: item.revision,
          generation: 2,
        })
      if (kind === 'head')
        cache.setQueryData(
          memoryVerificationKeys.snapshot('bank', item.entry_id),
          { entry_id: item.entry_id, head_version: '2' },
        )
      if (kind === 'record')
        cache.setQueryData(memoryVerificationKeys.operation('bank', 'new'), {
          record: {
            entry_id: item.entry_id,
            verification_id: item.verification.verification_id,
            effective_status: 'revoked',
            valid_for_current: false,
          },
        })
    })
    expect(host.textContent).not.toContain(value.startup_text)
    expect(host.textContent).toContain('memory.startup.stale')
    expect(memoryAPI.startup.preview).toHaveBeenCalledOnce()
  },
)
it('a dependency changed during pending read fences the late response', async () => {
  const pending = deferred<MemoryStartupPackage>()
  vi.mocked(memoryAPI.startup.preview).mockReturnValue(pending.promise)
  await render()
  await click('preview')
  cache.setQueryData(memoryVerificationKeys.snapshot('bank', 'e'.repeat(32)), {
    entry_id: 'e'.repeat(32),
    head_version: '2',
  })
  await act(async () => pending.resolve(startupPackage()))
  expect(host.textContent).not.toContain(startupPackage().startup_text)
})
it('older cached dependency and unrelated source do not override a freshly validated package', () => {
  const value = startupPackage(),
    source = value.items[0].sources[0]
  cache.setQueryData(memoryRevisionKeys.source('bank', source.source_id), {
    memory_id: 'bank',
    state: 'inactive',
    generation: '0',
    source_revision: '1',
  })
  cache.setQueryData(memoryRevisionKeys.source('bank', 'unrelated'), {
    memory_id: 'bank',
    state: 'forgotten',
  })
  const observed = memoryStartupObservation(cache, 'bank')
  expect(memoryStartupChanged(cache, value, observed)).toBe(false)
})
it('an old negative cached record may be superseded by a fresh package, but a newly read negative cannot', () => {
  const value = startupPackage(),
    item = value.items[0],
    key = memoryVerificationKeys.operation('bank', 'old')
  cache.setQueryData(key, {
    record: {
      entry_id: item.entry_id,
      verification_id: item.verification.verification_id,
      effective_status: 'stale',
    },
  })
  const observed = memoryStartupObservation(cache, 'bank')
  expect(memoryStartupChanged(cache, value, observed)).toBe(false)
  cache.setQueryData(key, {
    record: {
      entry_id: item.entry_id,
      verification_id: item.verification.verification_id,
      effective_status: 'stale',
    },
  })
  expect(memoryStartupChanged(cache, value, observed)).toBe(true)
})
it('same-binding known redaction blocks fresh-looking body regardless of query timing', () => {
  const value = startupPackage(),
    item = value.items[0]
  cache.setQueryData(memoryVerificationKeys.operation('bank', 'old'), {
    record: {
      entry_id: item.entry_id,
      binding_sha256: item.verification.binding_sha256,
      state: 'redacted',
    },
  })
  expect(
    memoryStartupChanged(cache, value, memoryStartupObservation(cache, 'bank')),
  ).toBe(true)
})
it('409 and network errors clear successful body without automatic retries', async () => {
  await render()
  await click('preview')
  vi.mocked(memoryAPI.startup.preview).mockRejectedValue(
    new APIError(409, 'stale', 'private'),
  )
  await click('preview')
  expect(host.textContent).not.toContain(startupPackage().startup_text)
  expect(host.textContent).toContain('memory.startup.stale')
  expect(memoryAPI.startup.preview).toHaveBeenCalledTimes(2)
})
it('source reader performs explicit one-fragment reads, Unicode continuation, previous reread, and no mutation body cache', async () => {
  await render(
    <MemorySourceReader
      memoryId="bank"
      source={startupPackage().items[0].sources[0]}
      onInvalid={vi.fn()}
    />,
  )
  expect(memoryAPI.startup.source).not.toHaveBeenCalled()
  await click('memory.startup.first')
  expect(host.querySelector('pre')?.textContent).toBe(sourceExcerpt().excerpt)
  await click('memory.startup.next')
  expect(vi.mocked(memoryAPI.startup.source).mock.calls[1][2]).toBe(512)
  expect(host.querySelector('pre')?.textContent).toBe(
    sourceExcerpt(512).excerpt,
  )
  await click('memory.startup.previous')
  expect(vi.mocked(memoryAPI.startup.source).mock.calls[2][2]).toBe(0)
  expect(
    cache
      .getMutationCache()
      .getAll()
      .every((row) => row.state.data === undefined),
  ).toBe(true)
})
it('failed source continuation clears old fragment and invalidates package; delayed fragment after unmount is ignored', async () => {
  const invalid = vi.fn()
  await render(
    <MemorySourceReader
      memoryId="bank"
      source={startupPackage().items[0].sources[0]}
      onInvalid={invalid}
    />,
  )
  await click('memory.startup.first')
  vi.mocked(memoryAPI.startup.source).mockRejectedValue(
    new APIError(409, 'stale', 'private'),
  )
  await click('memory.startup.next')
  expect(host.querySelector('pre')).toBeNull()
  expect(invalid).toHaveBeenCalledOnce()
})
it('Unicode range rejects UTF16 positions, scope/version mismatches, and lying continuation metadata', () => {
  const source = startupPackage().items[0].sources[0],
    value = sourceExcerpt()
  expect(boundSourceRange(value, source, 'bank', 0, 512).end).toBe(512)
  for (const patch of [
    { source_revision: '2' },
    { scope: { ...source.scope, session_id: 'wrong' } },
    { offset: 1 },
    { next_offset: 513 },
    { total_chars: 1 },
    { offset_unit: 'utf16' },
  ])
    expect(() =>
      boundSourceRange(
        { ...value, ...patch } as typeof value,
        source,
        'bank',
        0,
        512,
      ),
    ).toThrow()
})
it('form preserves exact whitespace and empty identity and only submits explicitly', async () => {
  const preview = vi.fn(),
    dirty = vi.fn()
  await render(
    <MemoryStartupForm
      capability={startupCapability}
      pending={false}
      onDirty={dirty}
      onPreview={preview}
    />,
  )
  expect(preview).not.toHaveBeenCalled()
  const user = host.querySelector<HTMLInputElement>('#startup-user')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(user, ' alpha ')
    user.dispatchEvent(new Event('input', { bubbles: true }))
    user.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await act(async () =>
    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(preview).toHaveBeenCalledWith({ ...request, user_id: ' alpha ' })
  expect(dirty).toHaveBeenCalled()
})

it('confirmed bank deletion clears local package without source caches and fences a pending response', async () => {
  await render()
  await click('preview')
  expect(host.textContent).toContain(startupPackage().startup_text)
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.operation('bank', 'delete'), {
      kind: 'delete_memory',
      lifecycle: 'deleting',
      status: 'pending',
    }),
  )
  expect(host.textContent).not.toContain(startupPackage().startup_text)
  const pending = deferred<MemoryStartupPackage>()
  vi.mocked(memoryAPI.startup.preview).mockReturnValue(pending.promise)
  await click('preview')
  await act(async () => pending.resolve(startupPackage()))
  expect(host.textContent).not.toContain(startupPackage().startup_text)
})
it('ready publication invalidates known selected entry while unrelated publication does not', () => {
  const value = startupPackage(),
    item = value.items[0],
    observed = memoryStartupObservation(cache, 'bank')
  cache.setQueryData(memoryRevisionKeys.operation('bank', 'other'), {
    status: 'ready',
    entry_id: 'other',
    new_revision: 2,
  })
  expect(memoryStartupChanged(cache, value, observed)).toBe(false)
  cache.setQueryData(memoryRevisionKeys.operation('bank', 'batch'), {
    status: 'ready',
    entries: [{ entry_id: item.entry_id, new_revision: '9007199254740994' }],
  })
  expect(memoryStartupChanged(cache, value, observed)).toBe(true)
})
it('source result arriving after reader unmount cannot restore body or invalidate a new owner', async () => {
  const pending = deferred<ReturnType<typeof sourceExcerpt>>(),
    invalid = vi.fn()
  vi.mocked(memoryAPI.startup.source).mockReturnValue(pending.promise)
  await render(
    <MemorySourceReader
      memoryId="bank"
      source={startupPackage().items[0].sources[0]}
      onInvalid={invalid}
    />,
  )
  await click('memory.startup.first')
  await render(<div>new owner</div>)
  await act(async () => pending.resolve(sourceExcerpt()))
  expect(host.textContent).toBe('new owner')
  expect(invalid).not.toHaveBeenCalled()
})
