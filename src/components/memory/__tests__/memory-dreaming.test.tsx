import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { MemoryDreamingWorkspace } from '../memory-dreaming-workspace'
import { parseMaintenanceSourceIds } from '../memory-dreaming-form'
import { memoryOperationReady } from '@/lib/memory-operation'
import type {
  MemoryMaintenanceJob,
  MemoryMaintenanceCandidate,
} from '@/types/memory-dreaming'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
const sourceId = '9007199254740993'
const entryId = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const newJob = (): MemoryMaintenanceJob => ({
  job_id: 'job-a',
  operation_id: 'create-a',
  state: 'pending',
  generation: 1,
  policy: 'general',
  input_budget_tokens: 16384,
  output_budget_tokens: 4096,
  estimated_input_tokens: 30,
  coverage: { selected: 1, included: 1, analyzed: 0, deferred: 0 },
  inputs: [
    {
      input_id: 'input-a',
      source_id: sourceId,
      source_revision: 1,
      source_generation: 1,
      content_sha256: 'a'.repeat(64),
      scope: {},
      coverage: 'included',
      defer_reason: null,
    },
  ],
  analysis_operation_id: null,
  error_code: null,
  model_reference: null,
  usage: {},
  created_at: '',
  updated_at: '',
})
const newCandidate = (): MemoryMaintenanceCandidate => ({
  candidate_id: 'candidate-a',
  revision: 1,
  state: 'pending',
  action: 'patch',
  target_entry_id: entryId,
  expected_revision: 1,
  message_type: 'semantic',
  content: 'Updated preference',
  base_content: 'Original preference',
  patch: { old_text: 'Original', new_text: 'Updated' },
  diff: { old_text: 'Original preference', new_text: 'Updated preference' },
  reason: 'Controlled hypothesis',
  sources: [
    {
      input_id: 'input-a',
      source_id: sourceId,
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
})
let host: HTMLDivElement,
  root: Root,
  cache: QueryClient,
  job: MemoryMaintenanceJob,
  candidates: MemoryMaintenanceCandidate[]
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  job = newJob()
  candidates = []
  vi.spyOn(memoryAPI.dreaming, 'list').mockImplementation(async () => ({
    jobs: [{ ...job }],
  }))
  vi.spyOn(memoryAPI.dreaming, 'job').mockImplementation(async () =>
    structuredClone(job),
  )
  vi.spyOn(memoryAPI.dreaming, 'candidates').mockImplementation(async () => ({
    candidates: structuredClone(candidates),
  }))
  vi.spyOn(memoryAPI.dreaming, 'create').mockImplementation(
    async (_bank, command) => {
      job.operation_id = command.operation_id
      return structuredClone(job)
    },
  )
  vi.spyOn(memoryAPI.dreaming, 'run').mockImplementation(
    async (_bank, _job, operationId) => {
      job = { ...job, state: 'ready', analysis_operation_id: operationId }
      candidates = [newCandidate()]
      return structuredClone(job)
    },
  )
  vi.spyOn(memoryAPI.dreaming, 'review').mockImplementation(
    async (_bank, _job, _candidate, command) => {
      candidates[0] = {
        ...candidates[0],
        state: command.decision === 'approve' ? 'approved' : 'rejected',
        revision: 2,
      }
      return structuredClone(candidates[0])
    },
  )
  vi.spyOn(memoryAPI.revision, 'operation').mockImplementation(
    async (_bank, id) => ({
      operation_id: id,
      kind: 'dream_publish',
      status: 'published',
      index_sync_status: 'pending',
      retryable: true,
    }),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
const button = (key: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('button')].find(
    (value) => value.textContent === key,
  )!
async function click(key: string) {
  await act(async () => button(key).click())
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
async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryDreamingWorkspace
          memoryId="bank"
          capabilities={{
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
            },
          }}
        />
      </QueryClientProvider>,
    ),
  )
}
async function createJob() {
  await fill('textarea[name="sourceIds"]', sourceId)
  await fill('input[name="entryIds"]', entryId)
  await click('memory.dreaming.create')
  await vi.waitFor(() => expect(button('memory.dreaming.run')).toBeDefined())
}

it('validates exact source identities without rounding or expanding an empty scope', () => {
  expect(parseMaintenanceSourceIds(sourceId)).toEqual([sourceId])
  for (const value of [
    '',
    '9.007199254740993e15',
    '01',
    '-1',
    '9223372036854775808',
    `${sourceId},${sourceId}`,
  ])
    expect(() => parseMaintenanceSourceIds(value)).toThrow()
})

it('requires both ready publication and ready index for a Dreaming batch', () => {
  expect(
    memoryOperationReady({
      operation_id: 'publish',
      kind: 'dream_publish',
      status: 'published',
      index_sync_status: 'ready',
      retryable: true,
    }),
  ).toBe(false)
  expect(
    memoryOperationReady({
      operation_id: 'publish',
      kind: 'dream_publish',
      status: 'ready',
      index_sync_status: 'ready',
      retryable: false,
    }),
  ).toBe(true)
})

it('creates only a snapshot, runs explicitly, approves with CAS, and publishes only the approved latest revision', async () => {
  const publish = vi
    .spyOn(memoryAPI.dreaming, 'publish')
    .mockImplementation(async (_bank, _job, command) => ({
      operation_id: command.operation_id,
      kind: 'dream_publish',
      status: 'published',
      index_sync_status: 'pending',
      retryable: true,
      job_id: job.job_id,
      candidate_ids: ['candidate-a'],
      entries: [],
    }))
  await render()
  await createJob()
  expect(memoryAPI.dreaming.create).toHaveBeenCalledWith(
    'bank',
    expect.objectContaining({ source_ids: [sourceId], entry_ids: [entryId] }),
  )
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  await click('memory.dreaming.run')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Updated preference'),
  )
  expect(button('memory.dreaming.publishSelected').disabled).toBe(true)
  expect(host.textContent).toContain('hypothesis / unverified')
  await click('memory.dreaming.approve')
  await vi.waitFor(() =>
    expect(host.querySelector('[role="checkbox"]')).not.toBeNull(),
  )
  expect(memoryAPI.dreaming.review).toHaveBeenCalledWith(
    'bank',
    'job-a',
    'candidate-a',
    expect.objectContaining({ expected_revision: 1, decision: 'approve' }),
  )
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await click('memory.dreaming.publishSelected')
  await vi.waitFor(() => expect(publish).toHaveBeenCalledOnce())
  expect(publish.mock.calls[0][2].candidates).toEqual([
    { candidate_id: 'candidate-a', expected_revision: 2 },
  ])
  expect(host.textContent).not.toContain('memory.revisions.ready')
  expect(memoryAPI.revision.operation).toHaveBeenCalled()
})

it('retains the original unknown create request and does not silently run or re-create on GET', async () => {
  vi.mocked(memoryAPI.dreaming.create).mockRejectedValueOnce(
    new APIError(503, 'unknown', 'Untrusted detail'),
  )
  await render()
  await fill('textarea[name="sourceIds"]', sourceId)
  await click('memory.dreaming.create')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.dreaming.createUnknown'),
  )
  const original = vi.mocked(memoryAPI.dreaming.create).mock.calls[0][1]
  expect(button('memory.dreaming.create').closest('fieldset')!.disabled).toBe(
    true,
  )
  await click('memory.dreaming.findCreatedJob')
  expect(memoryAPI.dreaming.create).toHaveBeenCalledOnce()
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  await click('memory.dreaming.retryCreate')
  expect(vi.mocked(memoryAPI.dreaming.create).mock.calls[1][1]).toEqual(
    original,
  )
})

it('an unknown review keeps the exact original operation and expected revision for explicit recovery', async () => {
  await render()
  await createJob()
  await click('memory.dreaming.run')
  await vi.waitFor(() =>
    expect(button('memory.dreaming.approve')).toBeDefined(),
  )
  vi.mocked(memoryAPI.dreaming.review).mockRejectedValueOnce(
    new APIError(503, 'unknown', 'Untrusted detail'),
  )
  await click('memory.dreaming.approve')
  await vi.waitFor(() =>
    expect(button('memory.dreaming.retryReview')).toBeDefined(),
  )
  const original = vi.mocked(memoryAPI.dreaming.review).mock.calls[0][3]
  await click('memory.dreaming.retryReview')
  expect(vi.mocked(memoryAPI.dreaming.review).mock.calls[1][3]).toEqual(
    original,
  )
})

it('keeps an interrupted analysis identity for an explicit rerun and never reruns on refresh', async () => {
  vi.mocked(memoryAPI.dreaming.run).mockRejectedValueOnce(
    new APIError(503, 'unknown', 'Untrusted detail'),
  )
  await render()
  await createJob()
  await click('memory.dreaming.run')
  await vi.waitFor(() => expect(memoryAPI.dreaming.run).toHaveBeenCalledOnce())
  const original = vi.mocked(memoryAPI.dreaming.run).mock.calls[0][2]
  await click('memory.revisions.refreshStatus')
  expect(memoryAPI.dreaming.run).toHaveBeenCalledOnce()
  await click('memory.dreaming.run')
  expect(vi.mocked(memoryAPI.dreaming.run).mock.calls[1][2]).toBe(original)
})

it('hides old candidate bodies when a confirmed canceled job is read', async () => {
  job.state = 'canceled'
  candidates = [newCandidate()]
  await render()
  await fill('#maintenance-resume-job', 'job-a')
  await click('memory.dreaming.open')
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.dreaming.redacted'),
  )
  expect(host.textContent).not.toContain('Updated preference')
  expect(host.textContent).not.toContain('Original preference')
  expect(host.textContent).not.toContain('Controlled hypothesis')
})

it('refreshes a rejected selection only after a read confirms no publication operation exists', async () => {
  vi.spyOn(memoryAPI.dreaming, 'publish').mockRejectedValue(
    new APIError(409, 'conflict', 'Untrusted detail'),
  )
  vi.mocked(memoryAPI.revision.operation).mockRejectedValue(
    new APIError(404, 'missing', 'Untrusted detail'),
  )
  await render()
  await createJob()
  await click('memory.dreaming.run')
  await vi.waitFor(() =>
    expect(button('memory.dreaming.approve')).toBeDefined(),
  )
  await click('memory.dreaming.approve')
  await vi.waitFor(() =>
    expect(host.querySelector('[role="checkbox"]')).not.toBeNull(),
  )
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await click('memory.dreaming.publishSelected')
  await vi.waitFor(() =>
    expect(button('memory.dreaming.refreshRejected')).toBeDefined(),
  )
  expect(button('memory.dreaming.publishSelected').disabled).toBe(true)
  await click('memory.dreaming.refreshRejected')
  await vi.waitFor(() =>
    expect(button('memory.dreaming.refreshRejected')).toBeUndefined(),
  )
  expect(button('memory.dreaming.publishSelected').disabled).toBe(true)
  expect(memoryAPI.dreaming.publish).toHaveBeenCalledOnce()
})
