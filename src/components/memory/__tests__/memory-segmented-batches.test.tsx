import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { IncrementalHarness } from './memory-incremental-fixture'
import { prepareSegmented, segmentedCaps } from './memory-segmented-fixture'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en-US' },
  }),
}))
let h: IncrementalHarness
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
  h = new IncrementalHarness()
})
afterEach(async () => {
  await h.dispose()
  vi.unstubAllGlobals()
})
async function ready() {
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.preview')).toBeDefined(),
  )
}
async function toggle() {
  await act(async () =>
    h.host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
}
it('keeps whole-source requests unchanged until explicit capability-gated opt-in', async () => {
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue(segmentedCaps())
  await ready()
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalledOnce(),
  )
  expect(
    vi.mocked(memoryAPI.incremental.preview).mock.calls[0][1],
  ).not.toHaveProperty('segmentation')
  await toggle()
  expect(h.button('memory.incremental.createPlan')).toBeUndefined()
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalledTimes(2),
  )
  expect(
    vi.mocked(memoryAPI.incremental.preview).mock.calls[1][1].segmentation,
  ).toEqual({
    mode: 'segmented',
    fragment_token_limit: 2048,
    max_parts_per_source: 32,
  })
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
})
it('does not offer segmentation on older capabilities', async () => {
  await ready()
  expect(h.host.querySelector('[role="checkbox"]')).toBeNull()
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalledOnce(),
  )
  expect(
    vi.mocked(memoryAPI.incremental.preview).mock.calls[0][1],
  ).not.toHaveProperty('segmentation')
})
it('distinguishes fragment count, source coverage and child progress, with concrete blocked-source reasons', async () => {
  prepareSegmented(h)
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue(segmentedCaps())
  h.preview.blocked_sources = [
    {
      ...h.preview.batches[0].primary_sources[0],
      error_code: 'segment_parts_limit',
    },
  ]
  await ready()
  await toggle()
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.createPlan')).toBeDefined(),
  )
  expect(h.host.textContent).toContain('memory.segments.previewBoundary')
  expect(h.host.textContent).not.toContain('memory.incremental.tokenFit')
  expect(h.host.textContent).toContain('memory.segments.selectedFragments')
  expect(h.host.textContent).toContain(
    'memory.segments.reasons.segment_parts_limit',
  )
  expect(h.host.textContent).toContain('9007199254740993')
  expect(h.host.textContent).toContain('memory.segments.fragment')
  expect(memoryAPI.incremental.create).not.toHaveBeenCalled()
})
it('reads live partial-source coverage without changing frozen plan counts or claiming full analysis', async () => {
  prepareSegmented(h)
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue(segmentedCaps())
  h.discovery.source_coverage = {
    ...h.discovery.source_coverage!,
    partial: 1,
    analyzed_parts: 1,
  }
  h.discovery.progress.analyzed = 1
  h.discovery.progress.pending = 2
  h.plans = [h.discovery]
  await ready()
  await vi.waitFor(() =>
    expect(h.host.textContent).toContain('memory.segments.liveCoverageHint'),
  )
  const section = h.host.querySelector<HTMLElement>(
    'section[aria-label="memory.segments.sourceCoverage"]',
  )!
  const count = (key: string) =>
    [...section.querySelectorAll('dt')].find(
      (element) => element.textContent === `memory.segments.${key}`,
    )!.nextElementSibling!.textContent
  expect(count('sourcesCovered')).toBe('0')
  expect(count('sourcesPartial')).toBe('1')
  expect(count('analyzedParts')).toBe('1')
  expect(count('totalParts')).toBe('3')
  expect(h.host.textContent).toContain('memory.incremental.snapshotCounts')
  expect(h.host.textContent).toContain('memory.segments.partialHint')
  expect(memoryAPI.dreaming.publish).not.toHaveBeenCalled()
})
it('restores the saved segmentation settings without sending the server splitter identity as a client override', async () => {
  prepareSegmented(h)
  vi.mocked(memoryAPI.revision.capabilities).mockResolvedValue(segmentedCaps())
  h.plans = [h.discovery]
  await ready()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.previewSavedProfile')).toBeDefined(),
  )
  await h.click('memory.incremental.previewSavedProfile')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalledOnce(),
  )
  expect(
    vi.mocked(memoryAPI.incremental.preview).mock.calls[0][1].segmentation,
  ).toEqual({
    mode: 'segmented',
    fragment_token_limit: 256,
    max_parts_per_source: 32,
  })
})
it('does not silently preview whole sources when a saved fragmented plan is reopened on a capability-disabled backend', async () => {
  prepareSegmented(h)
  h.plans = [h.discovery]
  await ready()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.previewSavedProfile')).toBeDefined(),
  )
  await h.click('memory.incremental.previewSavedProfile')
  expect(h.host.textContent).toContain('memory.segments.unavailable')
  expect(h.button('memory.incremental.preview')!.disabled).toBe(true)
  expect(memoryAPI.incremental.preview).not.toHaveBeenCalled()
})
