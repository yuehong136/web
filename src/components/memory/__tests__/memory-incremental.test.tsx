import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { memoryDiscoveryNeedsPolling } from '@/hooks/use-memory-incremental'
import {
  IncrementalHarness,
  newDiscovery,
  caps,
} from './memory-incremental-fixture'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en-US' },
  }),
}))
let h: IncrementalHarness
beforeEach(() => {
  h = new IncrementalHarness()
})
afterEach(async () => h.dispose())

it('previews only on request, creates metadata, and never reads a merely reserved child job', async () => {
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.preview')).toBeDefined(),
  )
  expect(memoryAPI.incremental.preview).not.toHaveBeenCalled()
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.createPlan')).toBeDefined(),
  )
  expect(h.host.textContent).toContain('memory.incremental.tokenFit')
  expect(h.host.textContent).toContain('9007199254740993')
  expect(h.host.textContent).toContain('9007199254740995')
  expect(h.host.textContent).not.toContain('9007199254740992')
  await h.click('memory.incremental.createPlan')
  await vi.waitFor(() =>
    expect(h.url()).toContain(`batch=${h.discovery.discovery_id}`),
  )
  expect(memoryAPI.incremental.create).toHaveBeenCalledWith(
    'bank',
    expect.objectContaining({
      expected_preview_sha256: 'd'.repeat(64),
      scope: { user_id: null, agent_id: null, session_id: null },
    }),
  )
  expect(h.host.querySelectorAll('a[href*="?job="]')).toHaveLength(0)
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
})

it('queues a bounded part only on click and links created children to the existing review route', async () => {
  h.plans = [h.discovery]
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.submitChildren')).toBeDefined(),
  )
  vi.mocked(memoryAPI.incremental.run).mockImplementation(async () => {
    h.discovery = {
      ...h.discovery,
      state: 'partial',
      batches: h.discovery.batches.map((batch, index) =>
        index
          ? batch
          : {
              ...batch,
              state: 'submitted',
              job_state: 'pending',
              execution: {
                state: 'queued',
                attempt: 0,
                queued_at: '',
                heartbeat_at: null,
                finished_at: null,
                error_code: null,
                needs_operator_reconciliation: false,
              },
            },
      ),
    }
    return structuredClone(h.discovery)
  })
  await h.click('memory.incremental.submitChildren')
  await vi.waitFor(() =>
    expect(h.host.querySelectorAll('a[href*="?job="]')).toHaveLength(1),
  )
  expect(memoryAPI.incremental.run).toHaveBeenCalledWith(
    'bank',
    h.discovery.discovery_id,
    expect.objectContaining({ limit: 1 }),
  )
  const link = h.host.querySelector<HTMLAnchorElement>('a[href*="?job="]')!
  expect(link.getAttribute('href')).toContain(
    `/memory/bank/maintenance?job=${h.discovery.batches[0].job_id}`,
  )
  expect(link.getAttribute('href')).toContain('operation=analyze-child-0')
  expect(memoryAPI.dreaming.run).not.toHaveBeenCalled()
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
})

it('distinguishes current coverage from frozen plan counts and never equates analysis with publication', async () => {
  h.discovery = {
    ...h.discovery,
    state: 'settled',
    progress: { ...h.discovery.progress, analyzed: 2, pending: 0 },
  }
  h.plans = [h.discovery]
  h.preview = {
    ...h.preview,
    counts: {
      ...h.preview.counts,
      covered: 2,
      eligible: 0,
      selected_primary: 0,
    },
    batches: [],
  }
  await h.render()
  await vi.waitFor(() =>
    expect(h.host.textContent).toContain('memory.incremental.snapshotCounts'),
  )
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(h.host.textContent).toContain('memory.incremental.currentCounts'),
  )
  expect(h.host.textContent).toContain('memory.incremental.noEligible')
  expect(h.host.textContent).toContain('memory.incremental.progressBoundary')
  expect(h.button('memory.incremental.createPlan').disabled).toBe(true)
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
})

it('shows failed and whole-source blocked children without claiming covered or completed publication', async () => {
  h.discovery = {
    ...h.discovery,
    state: 'settled',
    batches: h.discovery.batches.map((batch, index) => ({
      ...batch,
      state: index ? 'blocked' : 'failed',
      error_code: index ? 'maintenance_input_budget_exceeded' : 'model_failed',
      job_state: index ? null : 'failed',
    })),
    progress: { ...h.discovery.progress, failed: 1, blocked: 1, pending: 0 },
  }
  h.plans = [h.discovery]
  await h.render()
  await vi.waitFor(() =>
    expect(h.host.textContent).toContain(
      'memory.incremental.batchStates.blocked',
    ),
  )
  expect(h.host.textContent).toContain('memory.incremental.batchStates.failed')
  expect(h.host.textContent).toContain('memory.incremental.childNotCovered')
  expect(h.host.textContent).not.toContain(
    'memory.incremental.batchStates.analyzed',
  )
})

it('continues only GET polling while real queued or unsettled execution remains', async () => {
  vi.useFakeTimers()
  h.discovery.batches[0] = {
    ...h.discovery.batches[0],
    state: 'submitted',
    job_state: 'pending',
    execution: {
      state: 'queued',
      attempt: 0,
      queued_at: '',
      heartbeat_at: null,
      finished_at: null,
      error_code: null,
      needs_operator_reconciliation: false,
    },
  }
  h.plans = [h.discovery]
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.submitChildren')).toBeDefined(),
  )
  const before = vi.mocked(memoryAPI.incremental.discovery).mock.calls.length
  await act(async () => vi.advanceTimersByTimeAsync(5000))
  expect(
    vi.mocked(memoryAPI.incremental.discovery).mock.calls.length,
  ).toBeGreaterThan(before)
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
  expect(memoryAPI.incremental.cancel).not.toHaveBeenCalled()
  expect(memoryAPI.incremental.preview).not.toHaveBeenCalled()
  const settled = { ...newDiscovery(), state: 'settled' as const }
  expect(memoryDiscoveryNeedsPolling(settled)).toBe(false)
  expect(
    memoryDiscoveryNeedsPolling({
      ...settled,
      batches: settled.batches.map((batch) => ({ ...batch, state: 'unknown' })),
    }),
  ).toBe(false)
  expect(
    memoryDiscoveryNeedsPolling({
      ...settled,
      batches: [{ ...h.discovery.batches[0], state: 'unknown' }],
    }),
  ).toBe(true)
})

it.each(['missing', 'unmanaged'])(
  'keeps %s capability fail closed without discovering sources',
  async (mode) => {
    const value = structuredClone(caps)
    if (mode === 'missing') delete value.maintenance!.discoveries
    else value.revisions!.managed = false
    vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue(value)
    await h.render()
    await vi.waitFor(() =>
      expect(h.host.textContent).toContain(
        mode === 'missing'
          ? 'memory.incremental.unsupported'
          : 'memory.incremental.managedRequired',
      ),
    )
    expect(memoryAPI.incremental.list).not.toHaveBeenCalled()
    expect(memoryAPI.incremental.preview).not.toHaveBeenCalled()
  },
)

it('does not keep polling an idle plan or lists containing only deferred and terminal children', async () => {
  vi.useFakeTimers()
  h.plans = [h.discovery]
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.submitChildren')).toBeDefined(),
  )
  const details = vi.mocked(memoryAPI.incremental.discovery).mock.calls.length
  const lists = vi.mocked(memoryAPI.incremental.list).mock.calls.length
  await act(async () => vi.advanceTimersByTimeAsync(10000))
  expect(vi.mocked(memoryAPI.incremental.discovery).mock.calls.length).toBe(
    details,
  )
  expect(vi.mocked(memoryAPI.incremental.list).mock.calls.length).toBe(lists)
  for (const state of [
    'planned',
    'created',
    'unknown',
    'blocked',
    'failed',
    'canceled',
    'stale',
    'analyzed',
  ] as const)
    expect(
      memoryDiscoveryNeedsPolling({
        ...newDiscovery(),
        batches: newDiscovery().batches.map((batch) => ({ ...batch, state })),
      }),
    ).toBe(false)
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
})

it('reads current coverage with saved exact scope and budgets only after the explicit action', async () => {
  h.discovery.profile.scope = {
    user_id: '',
    agent_id: ' agent ',
    session_id: null,
  }
  h.discovery.profile.input_budget_tokens = 8192
  h.plans = [h.discovery]
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.previewSavedProfile')).toBeDefined(),
  )
  expect(memoryAPI.incremental.preview).not.toHaveBeenCalled()
  await h.click('memory.incremental.previewSavedProfile')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalledWith(
      'bank',
      expect.objectContaining({
        scope: { user_id: '', agent_id: ' agent ', session_id: null },
        input_budget_tokens: 8192,
      }),
    ),
  )
  expect(
    h.host.querySelector<HTMLInputElement>('#incremental-scope-agent')!.value,
  ).toBe(' agent ')
})
