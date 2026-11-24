import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { MemoryDreamingWorkspace } from '../memory-dreaming-workspace'
import { memoryMaintenanceKeys } from '@/hooks/use-memory-dreaming'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import type {
  MemoryCapabilities,
  MemoryOperation,
  MemoryBackgroundExecution,
} from '@/types/memory-revisions'
import type {
  MemoryMaintenanceJob,
  MemoryMaintenanceCandidate,
} from '@/types/memory-dreaming'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
const execution = (
  state: MemoryBackgroundExecution['state'],
): MemoryBackgroundExecution => ({
  state,
  attempt: 1,
  queued_at: '2026-11-15T10:00:00Z',
  heartbeat_at: null,
  finished_at: null,
  error_code: null,
  needs_operator_reconciliation: state === 'needs_reconciliation',
})
const capabilities: MemoryCapabilities = {
  revisions: {
    supported: true,
    managed: true,
    activation_scope: 'memory_bank',
    ordinary_writes_after_activation: true,
    managed_delete_supported: true,
    max_content_bytes: 65535,
    max_content_tokens: 8192,
  },
  maintenance: {
    supported: true,
    modes: ['dream'],
    candidate_review_required: true,
    actions: ['add', 'patch', 'noop'],
    requires_registered_sources: true,
    automatic_publication: false,
    max_sources: 32,
    max_candidates: 32,
    max_publication_candidates: 16,
    execution: 'persistent_background',
  },
}
const candidate: MemoryMaintenanceCandidate = {
  candidate_id: 'candidate',
  revision: 1,
  state: 'pending',
  action: 'add',
  target_entry_id: null,
  expected_revision: null,
  message_type: 'semantic',
  content: 'Controlled unverified candidate',
  base_content: null,
  patch: null,
  diff: { old_text: '', new_text: 'Controlled unverified candidate' },
  reason: 'Controlled reason',
  sources: [
    {
      input_id: 'source-9007199254740993',
      source_id: '9007199254740993',
      source_revision: 1,
      source_generation: 1,
      content_sha256: 'a'.repeat(64),
    },
  ],
  assessment: { kind: 'hypothesis', verification_status: 'unverified' },
  review_actor_id: null,
  reviewed_at: null,
  publication_operation_id: null,
  redacted: false,
}
let host: HTMLDivElement,
  root: Root,
  cache: QueryClient,
  job: MemoryMaintenanceJob,
  operation: MemoryOperation,
  serverCandidates: MemoryMaintenanceCandidate[]
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  job = {
    job_id: 'job-a',
    operation_id: 'create-original',
    state: 'pending',
    generation: 1,
    policy: 'general',
    input_budget_tokens: 16384,
    output_budget_tokens: 4096,
    estimated_input_tokens: 30,
    coverage: { selected: 1, included: 1, analyzed: 0, deferred: 0 },
    inputs: [],
    analysis_operation_id: 'analysis-original',
    execution: execution('queued'),
    error_code: null,
    model_reference: null,
    usage: {},
    created_at: '2026-11-15T10:00:00Z',
    updated_at: '2026-11-15T10:00:00Z',
  }
  operation = {
    operation_id: 'analysis-original',
    kind: 'dream_analyze',
    status: 'accepted',
    index_sync_status: 'pending',
    retryable: true,
    job_id: 'job-a',
    execution: execution('queued'),
    can_reconcile: false,
  }
  serverCandidates = []
  vi.spyOn(memoryAPI.dreaming, 'list').mockImplementation(async () => ({
    jobs: [structuredClone(job)],
  }))
  vi.spyOn(memoryAPI.dreaming, 'job').mockImplementation(async () =>
    structuredClone(job),
  )
  vi.spyOn(memoryAPI.dreaming, 'candidates').mockImplementation(async () => ({
    candidates: structuredClone(serverCandidates),
  }))
  vi.spyOn(memoryAPI.revision, 'operation').mockImplementation(async () =>
    structuredClone(operation),
  )
  vi.spyOn(memoryAPI.revision, 'operations').mockImplementation(async () => ({
    operations: [
      {
        ...structuredClone(operation),
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
    ],
    next_cursor: null,
    limit: 20,
    view: 'pending',
    memory_state: 'active',
  }))
  vi.spyOn(memoryAPI.dreaming, 'run').mockImplementation(
    async (_mid, _job, id) => {
      job.analysis_operation_id = id
      job.execution = execution('queued')
      operation = { ...operation, operation_id: id }
      return structuredClone(job)
    },
  )
  vi.spyOn(memoryAPI.dreaming, 'review').mockRejectedValue(
    new Error('No automatic review'),
  )
  vi.spyOn(memoryAPI.dreaming, 'publish').mockRejectedValue(
    new Error('No automatic publication'),
  )
  vi.spyOn(memoryAPI.revision, 'reconcile').mockRejectedValue(
    new Error('No automatic reconciliation'),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  vi.useRealTimers()
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
async function render(
  url = '/memory/bank/maintenance?job=job-a&operation=analysis-original',
) {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <QueryClientProvider client={cache}>
          <MemoryDreamingWorkspace
            memoryId="bank"
            capabilities={capabilities}
          />
          <LocationProbe />
        </QueryClientProvider>
      </MemoryRouter>,
    ),
  )
}
const button = (key: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('button')].find(
    (value) => value.textContent === key,
  )!

it('restores queued analysis from a job URL without submitting or publishing again', async () => {
  await render()
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'memory.recovery.executionStates.queued',
    ),
  )
  expect(button('memory.recovery.submitAnalysis').disabled).toBe(true)
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.review).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
  expect(memoryAPI.revision.reconcile).not.toHaveBeenCalled()
})

it('discovers a recent server job and its original analysis handle when the page URL has no selection', async () => {
  await render('/memory/bank/maintenance')
  await vi.waitFor(() =>
    expect(host.querySelector('[data-location]')!.textContent).toContain(
      'job=job-a',
    ),
  )
  await vi.waitFor(() =>
    expect(host.querySelector('[data-location]')!.textContent).toContain(
      'operation=analysis-original',
    ),
  )
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
})

it('submits once, reads worker progress, and leaves completed candidates unapproved and unpublished', async () => {
  job.analysis_operation_id = null
  job.execution = null
  vi.mocked(memoryAPI.revision.operations).mockResolvedValue({
    operations: [],
    next_cursor: null,
    limit: 20,
    view: 'pending',
    memory_state: 'active',
  })
  await render('/memory/bank/maintenance?job=job-a')
  await vi.waitFor(() =>
    expect(button('memory.recovery.submitAnalysis').disabled).toBe(false),
  )
  await act(async () => button('memory.recovery.submitAnalysis').click())
  await vi.waitFor(() =>
    expect(button('memory.recovery.submitAnalysis').disabled).toBe(true),
  )
  const originalId = job.analysis_operation_id!
  expect(memoryAPI.dreaming.run).toHaveBeenCalledOnce()
  await act(async () => {
    await cache.invalidateQueries({
      queryKey: memoryMaintenanceKeys.bank('bank'),
    })
  })
  expect(memoryAPI.dreaming.run).toHaveBeenCalledOnce()
  // External worker progress is changed by the fixture owner, never by a GET handler.
  job = { ...job, state: 'ready', execution: execution('succeeded') }
  operation = {
    ...operation,
    operation_id: originalId,
    status: 'ready',
    index_sync_status: 'ready',
    execution: execution('succeeded'),
    can_reconcile: false,
  }
  serverCandidates = [structuredClone(candidate)]
  await act(async () => {
    await cache.invalidateQueries({
      queryKey: memoryMaintenanceKeys.bank('bank'),
    })
    await cache.invalidateQueries({
      queryKey: memoryRevisionKeys.operation('bank', originalId),
    })
  })
  await vi.waitFor(() => expect(host.textContent).toContain(candidate.content))
  expect(host.textContent).toContain('hypothesis / unverified')
  expect(button('memory.dreaming.approve').disabled).toBe(false)
  expect(memoryAPI.dreaming.review).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.run).toHaveBeenCalledOnce()
})

it('retains the URL handle across a fresh component and Query client after reload', async () => {
  await render()
  await vi.waitFor(() =>
    expect(host.textContent).toContain('analysis-original'),
  )
  const url = host.querySelector('[data-location]')!.textContent!
  await act(async () => root.unmount())
  cache.clear()
  root = createRoot(host)
  await render(url)
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'memory.recovery.executionStates.queued',
    ),
  )
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
})

it('blocks model resubmission and generic reconciliation while the original execution needs operator settlement', async () => {
  job.state = 'failed'
  job.execution = execution('needs_reconciliation')
  operation = {
    ...operation,
    status: 'persistence_unknown',
    index_sync_status: 'unknown',
    needs_operator_reconciliation: true,
    execution: execution('needs_reconciliation'),
  }
  await render()
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.recovery.operatorRequired'),
  )
  expect(button('memory.recovery.submitAnalysis').disabled).toBe(true)
  expect(button('memory.revisions.reconcile')).toBeUndefined()
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
})

it('restores a pending publication from server discovery before falling back to the analysis operation', async () => {
  job.state = 'ready'
  job.execution = execution('succeeded')
  operation = {
    operation_id: 'publication-original',
    kind: 'dream_publish',
    status: 'published',
    index_sync_status: 'pending',
    retryable: true,
    can_reconcile: false,
    job_id: 'job-a',
    writer_busy: true,
  }
  serverCandidates = [
    {
      ...candidate,
      state: 'publishing',
      publication_operation_id: operation.operation_id,
    },
  ]
  let resolve!: () => void
  const ready = new Promise<void>((done) => {
    resolve = done
  })
  vi.mocked(memoryAPI.revision.operations).mockImplementation(async () => {
    await ready
    return {
      operations: [
        {
          ...operation,
          created_at: job.created_at,
          updated_at: job.updated_at,
        },
      ],
      next_cursor: null,
      limit: 20,
      view: 'pending',
      memory_state: 'active',
    }
  })
  await render('/memory/bank/maintenance?job=job-a')
  expect(host.querySelector('[data-location]')!.textContent).not.toContain(
    'analysis-original',
  )
  await act(async () => resolve())
  await vi.waitFor(() =>
    expect(host.querySelector('[data-location]')!.textContent).toContain(
      'operation=publication-original',
    ),
  )
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
  expect(memoryAPI.revision.reconcile).not.toHaveBeenCalled()
})

function ChangingBankWorkspace() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/memory/bank-b/maintenance?job=job-b')}>
        other bank
      </button>
      <MemoryDreamingWorkspace
        key={id}
        memoryId={id}
        capabilities={capabilities}
      />
      <LocationProbe />
    </>
  )
}

it("does not let a previous bank's delayed create result replace the current URL", async () => {
  vi.mocked(memoryAPI.dreaming.list).mockResolvedValue({ jobs: [] })
  vi.mocked(memoryAPI.dreaming.job).mockImplementation(async (_mid, jobId) => ({
    ...structuredClone(job),
    job_id: jobId,
    analysis_operation_id: null,
    execution: null,
  }))
  vi.mocked(memoryAPI.revision.operations).mockResolvedValue({
    operations: [],
    next_cursor: null,
    limit: 20,
    view: 'pending',
    memory_state: 'active',
  })
  let release!: (value: MemoryMaintenanceJob) => void
  vi.spyOn(memoryAPI.dreaming, 'create').mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve
      }),
  )
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/memory/bank-a/maintenance']}>
        <QueryClientProvider client={cache}>
          <Routes>
            <Route
              path="/memory/:id/maintenance"
              element={<ChangingBankWorkspace />}
            />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>,
    ),
  )
  const field = host.querySelector<HTMLTextAreaElement>(
    'textarea[name="sourceIds"]',
  )!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!.call(field, '9007199254740993')
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await act(async () => button('memory.dreaming.create').click())
  await vi.waitFor(() =>
    expect(memoryAPI.dreaming.create).toHaveBeenCalledOnce(),
  )
  await act(async () => button('other bank').click())
  await act(async () => release({ ...job, job_id: 'late-job-a' }))
  expect(host.querySelector('[data-location]')!.textContent).toBe(
    '/memory/bank-b/maintenance?job=job-b',
  )
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
})

it('keeps reading a ready job while its execution bookkeeping is still unsettled', async () => {
  vi.useFakeTimers()
  job.state = 'ready'
  job.execution = execution('running')
  operation = {
    ...operation,
    status: 'ready',
    index_sync_status: 'ready',
    execution: execution('succeeded'),
  }
  await render()
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'memory.recovery.executionStates.running',
    ),
  )
  const reads = vi.mocked(memoryAPI.dreaming.job).mock.calls.length
  job.execution = execution('succeeded')
  await act(async () => vi.advanceTimersByTimeAsync(5000))
  expect(vi.mocked(memoryAPI.dreaming.job).mock.calls.length).toBeGreaterThan(
    reads,
  )
  expect(host.textContent).not.toContain(
    'memory.recovery.executionStates.running',
  )
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
})

it('keeps the newly selected operation when an older rejected-operation read returns late', async () => {
  job.state = 'ready'
  job.execution = execution('succeeded')
  job.analysis_operation_id = null
  serverCandidates = [{ ...candidate, state: 'approved' }]
  vi.mocked(memoryAPI.revision.operations).mockResolvedValue({
    operations: [],
    next_cursor: null,
    limit: 20,
    view: 'pending',
    memory_state: 'active',
  })
  vi.mocked(memoryAPI.dreaming.publish).mockRejectedValue(
    new APIError(409, 'conflict', 'controlled'),
  )
  vi.mocked(memoryAPI.revision.operation).mockRejectedValue(
    new APIError(404, 'missing', 'controlled'),
  )
  await render('/memory/bank/maintenance?job=job-a')
  await vi.waitFor(() =>
    expect(host.querySelector('[role="checkbox"]')).not.toBeNull(),
  )
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await act(async () => button('memory.dreaming.publishSelected').click())
  await vi.waitFor(() =>
    expect(button('memory.dreaming.refreshRejected')).toBeDefined(),
  )
  let reject!: (reason: unknown) => void
  const delayed = new Promise<MemoryOperation>((_resolve, fail) => {
    reject = fail
  })
  vi.mocked(memoryAPI.revision.operation).mockImplementationOnce(() => delayed)
  await act(async () => button('memory.dreaming.refreshRejected').click())
  const field = host.querySelector<HTMLInputElement>(
    '#maintenance-resume-publication',
  )!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(field, 'operation-two')
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  vi.mocked(memoryAPI.revision.operation).mockResolvedValue({
    operation_id: 'operation-two',
    kind: 'dream_publish',
    job_id: job.job_id,
    status: 'published',
    index_sync_status: 'pending',
    retryable: true,
    can_reconcile: false,
  })
  await act(async () =>
    [...host.querySelectorAll<HTMLButtonElement>('button')]
      .filter((item) => item.textContent === 'memory.dreaming.open')
      .at(-1)!
      .click(),
  )
  await vi.waitFor(() =>
    expect(host.querySelector('[data-location]')!.textContent).toContain(
      'operation=operation-two',
    ),
  )
  await act(async () => reject(new APIError(404, 'missing', 'controlled')))
  expect(host.querySelector('[data-location]')!.textContent).toContain(
    'operation=operation-two',
  )
  expect(memoryAPI.dreaming.publish).toHaveBeenCalledOnce()
})
