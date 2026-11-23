import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { MemorySourceReader } from '../memory-source-reader'
import { MemoryJobSourceSubmissions } from '../memory-job-source-submissions'
import type { MemoryMaintenanceJob } from '@/types/memory-dreaming'
import { MemorySourceSubmission } from '../memory-source-submission'
import {
  sourceBinding,
  sourceProvenance,
  sourceCapability,
} from './memory-source-fixture'
import type { MemorySourceProvenance } from '@/types/memory-sources'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
let host: HTMLDivElement, root: Root, cache: QueryClient
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.sources, 'provenance').mockResolvedValue(
    sourceProvenance(),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
async function render(bank = 'bank', supported = true) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemorySourceSubmission
          memoryId={bank}
          sourceId={sourceBinding.source_id}
          binding={sourceBinding}
          supported={supported}
        />
      </QueryClientProvider>,
    ),
  )
}
async function read() {
  await act(async () =>
    [...host.querySelectorAll('button')]
      .find((b) => b.textContent === 'memory.sources.inspect')!
      .click(),
  )
}
function deferred() {
  let resolve!: (v: MemorySourceProvenance) => void
  const promise = new Promise<MemorySourceProvenance>((yes) => {
    resolve = yes
  })
  return { promise, resolve }
}
it('reads lean metadata only on explicit action and never stores provenance in Query/mutation data', async () => {
  await render()
  await cache.invalidateQueries()
  await render()
  expect(memoryAPI.sources.provenance).not.toHaveBeenCalled()
  await read()
  expect(memoryAPI.sources.provenance).toHaveBeenCalledOnce()
  expect(
    vi.mocked(memoryAPI.sources.provenance).mock.calls[0][2],
  ).toMatchObject({ includeSegments: false, binding: sourceBinding })
  expect(host.textContent).toContain('authenticated-only')
  await read()
  expect(
    vi.mocked(memoryAPI.sources.provenance).mock.calls[1][2]?.binding
      ?.provenance_sha256,
  ).toBe('b'.repeat(64))
  expect(cache.getQueryCache().getAll()).toHaveLength(0)
  expect(
    cache
      .getMutationCache()
      .getAll()
      .every((m) => m.state.data === undefined),
  ).toBe(true)
})
it.each(['withdrawn', 'generation', 'delete'] as const)(
  'clears visible metadata and rejects delayed old GET after %s',
  async (kind) => {
    await render()
    await read()
    const pending = deferred()
    vi.mocked(memoryAPI.sources.provenance).mockReturnValue(pending.promise)
    await read()
    await act(async () => {
      if (kind === 'delete')
        cache.setQueryData(memoryRevisionKeys.operation('bank', 'delete'), {
          kind: 'delete_memory',
          lifecycle: 'deleting',
        })
      else
        cache.setQueryData(
          memoryRevisionKeys.source('bank', sourceBinding.source_id),
          {
            memory_id: 'bank',
            state: kind === 'withdrawn' ? 'forgotten' : 'active',
            source_revision: 1,
            generation: 2,
            content_sha256: sourceBinding.content_sha256,
            scope: sourceBinding.scope,
          },
        )
    })
    await act(async () => pending.resolve(sourceProvenance()))
    expect(host.textContent).not.toContain('authenticated-only')
    expect(host.textContent).toContain('memory.sources.changed')
    expect(memoryAPI.sources.provenance).toHaveBeenCalledTimes(2)
  },
)
it('clears already visible metadata immediately on a known source change', async () => {
  await render()
  await read()
  expect(host.textContent).toContain('authenticated-only')
  await act(async () =>
    cache.setQueryData(
      memoryRevisionKeys.source('bank', sourceBinding.source_id),
      { memory_id: 'bank', state: 'inactive' },
    ),
  )
  expect(host.textContent).not.toContain('authenticated-only')
})
it.each(['actor', 'bank'] as const)(
  'fences late GET when the %s owner changes',
  async (kind) => {
    const pending = deferred()
    vi.mocked(memoryAPI.sources.provenance).mockReturnValue(pending.promise)
    await render()
    await read()
    if (kind === 'actor')
      await act(async () => useAuthStore.setState({ token: 'other-actor' }))
    else await render('other-bank')
    await act(async () => pending.resolve(sourceProvenance()))
    expect(host.textContent).not.toContain('authenticated-only')
  },
)
it('keeps 409 unavailable and generic failure distinct and never retries GET on refresh', async () => {
  vi.mocked(memoryAPI.sources.provenance).mockRejectedValue(
    new APIError(409, 'conflict', 'private'),
  )
  await render()
  await read()
  expect(host.textContent).toContain('memory.sources.changed')
  await cache.invalidateQueries()
  expect(memoryAPI.sources.provenance).toHaveBeenCalledOnce()
  vi.mocked(memoryAPI.sources.provenance).mockRejectedValue(
    new Error('private server exception'),
  )
  await read()
  expect(host.textContent).toContain('memory.sources.failed')
  expect(host.textContent).not.toContain('private server exception')
})
it('does not accept metadata from another source binding or an unsolicited full segment body', async () => {
  await render()
  vi.mocked(memoryAPI.sources.provenance).mockResolvedValue({
    ...sourceProvenance(),
    source_generation: '2',
  })
  await read()
  expect(host.textContent).not.toContain('authenticated-only')
  vi.mocked(memoryAPI.sources.provenance).mockResolvedValue({
    ...sourceProvenance(),
    segments_included: true,
    segments: [{ role: 'user', content: 'unexpected full secret body' }],
  })
  await read()
  expect(host.textContent).not.toContain('authenticated-only')
  expect(host.textContent).not.toContain('unexpected full secret body')
})
it('preserves a legacy backend without a provenance control or request', async () => {
  await render('bank', false)
  expect(host.textContent).toBe('')
  expect(memoryAPI.sources.provenance).not.toHaveBeenCalled()
})
it('carries the pinned submission digest and refuses a different receipt without showing its metadata', async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemorySourceSubmission
          memoryId="bank"
          sourceId={sourceBinding.source_id}
          binding={{ ...sourceBinding, provenance_sha256: 'b'.repeat(64) }}
          supported
        />
      </QueryClientProvider>,
    ),
  )
  await read()
  expect(
    vi.mocked(memoryAPI.sources.provenance).mock.calls[0][2]?.binding
      ?.provenance_sha256,
  ).toBe('b'.repeat(64))
  vi.mocked(memoryAPI.sources.provenance).mockResolvedValue({
    ...sourceProvenance(),
    provenance_sha256: 'c'.repeat(64),
    provenance: {
      ...sourceProvenance().provenance,
      submitted_by: 'replacement-not-this-job',
    },
  })
  await read()
  expect(host.textContent).not.toContain('replacement-not-this-job')
  expect(host.textContent).not.toContain('authenticated-only')
  expect(host.textContent).toContain('memory.sources.changed')
})
it('job input receipt pins are sent to the provenance request instead of silently reading a different current receipt', async () => {
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    structured_sources: sourceCapability,
  })
  const job: MemoryMaintenanceJob = {
    job_id: 'j'.repeat(32),
    operation_id: 'create',
    state: 'ready',
    generation: 1,
    policy: 'general',
    input_budget_tokens: 8192,
    output_budget_tokens: 4096,
    estimated_input_tokens: 10,
    coverage: { selected: 1, included: 1, analyzed: 1, deferred: 0 },
    inputs: [
      {
        input_id: 'source-1',
        source_id: sourceBinding.source_id,
        source_revision: 1,
        source_generation: 1,
        content_sha256: sourceBinding.content_sha256,
        scope: sourceBinding.scope,
        source_provenance_sha256: 'c'.repeat(64),
        coverage: 'analyzed',
        defer_reason: null,
      },
    ],
    analysis_operation_id: 'analysis',
    error_code: null,
    model_reference: 'controlled',
    usage: {},
    created_at: '',
    updated_at: '',
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryJobSourceSubmissions memoryId="bank" job={job} />
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() => expect(host.querySelector('button')).not.toBeNull())
  await read()
  expect(
    vi.mocked(memoryAPI.sources.provenance).mock.calls[0][2]?.binding
      ?.provenance_sha256,
  ).toBe('c'.repeat(64))
  expect(host.textContent).not.toContain('authenticated-only')
  expect(host.textContent).toContain('memory.sources.changed')
})
it('a startup receipt pin mismatch clears an already-read source excerpt and fences a late fragment', async () => {
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    structured_sources: sourceCapability,
  })
  const source = {
    ...sourceBinding,
    provenance_sha256: 'b'.repeat(64),
    projection_sha256: 'd'.repeat(64),
    locator: {
      kind: 'memory_message' as const,
      memory_id: 'bank',
      message_id: sourceBinding.source_id,
    },
  }
  const excerpt = {
    ...sourceBinding,
    state: 'available' as const,
    verification: 'provenance_only' as const,
    snapshot_only: true as const,
    continuation_requires_authorization: true as const,
    offset_unit: 'unicode_codepoint' as const,
    excerpt: 'old excerpt body',
    offset: 0,
    total_chars: 16,
    next_offset: null,
    truncated: false,
    locator: source.locator,
  }
  const page = vi.spyOn(memoryAPI.startup, 'source').mockResolvedValue(excerpt)
  const invalid = vi.fn()
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemorySourceReader
          memoryId="bank"
          source={source}
          onInvalid={invalid}
        />
      </QueryClientProvider>,
    ),
  )
  async function fragment() {
    await act(async () =>
      [...host.querySelectorAll('button')]
        .find((b) => b.textContent === 'memory.startup.first')!
        .click(),
    )
  }
  await fragment()
  expect(host.textContent).toContain('old excerpt body')
  vi.mocked(memoryAPI.sources.provenance).mockResolvedValue({
    ...sourceProvenance(),
    provenance_sha256: 'c'.repeat(64),
  })
  await read()
  expect(
    vi.mocked(memoryAPI.sources.provenance).mock.calls[0][2]?.binding
      ?.provenance_sha256,
  ).toBe('b'.repeat(64))
  expect(host.textContent).not.toContain('old excerpt body')
  expect(invalid).toHaveBeenCalledOnce()
  let resolve!: (v: typeof excerpt) => void
  page.mockReturnValue(
    new Promise((yes) => {
      resolve = yes
    }),
  )
  await fragment()
  await read()
  await act(async () => resolve(excerpt))
  expect(host.textContent).not.toContain('old excerpt body')
  expect(invalid).toHaveBeenCalledTimes(2)
})

it.each(['visible', 'pending'] as const)(
  'the actual nested withdrawal receipt clears %s metadata while source-state cache remains active',
  async (phase) => {
    cache.setQueryData(
      memoryRevisionKeys.source('bank', sourceBinding.source_id),
      {
        memory_id: 'bank',
        state: 'active',
        source_revision: 1,
        generation: 1,
        content_sha256: sourceBinding.content_sha256,
        scope: sourceBinding.scope,
      },
    )
    await render()
    await read()
    expect(host.textContent).toContain('authenticated-only')
    const pending = deferred()
    if (phase === 'pending') {
      vi.mocked(memoryAPI.sources.provenance).mockReturnValue(pending.promise)
      await read()
    }
    await act(async () =>
      cache.setQueryData(
        memoryRevisionKeys.operation('bank', 'actual-withdrawal'),
        {
          operation_id: 'actual-withdrawal',
          kind: 'withdraw_source',
          status: 'ready',
          index_sync_status: 'ready',
          stop_supply: 'withdrawn',
          source: {
            source_id: sourceBinding.source_id,
            state: 'forgotten',
            source_revision: 2,
            generation: 2,
          },
        },
      ),
    )
    if (phase === 'pending')
      await act(async () => pending.resolve(sourceProvenance()))
    expect(
      cache.getQueryData(
        memoryRevisionKeys.source('bank', sourceBinding.source_id),
      ),
    ).toMatchObject({ state: 'active', generation: 1 })
    expect(host.textContent).not.toContain('authenticated-only')
    expect(host.textContent).toContain('memory.sources.changed')
    const calls = vi.mocked(memoryAPI.sources.provenance).mock.calls.length
    await read()
    expect(memoryAPI.sources.provenance).toHaveBeenCalledTimes(calls)
  },
)
