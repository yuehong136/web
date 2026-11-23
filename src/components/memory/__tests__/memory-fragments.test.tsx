import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { MemoryFragmentProvenance } from '../memory-fragment-provenance'
import { MemoryDreamingCandidate } from '../memory-dreaming-candidate'
import { MemoryDreamingJob } from '../memory-dreaming-job'
import { MemorySegmentationControl } from '../memory-segmentation-control'
import { validMemorySegmentation } from '@/lib/memory-segments'
import type {
  MemorySourceFragment,
  MemorySourceSegmentation,
} from '@/types/memory-segments'
import type {
  MemoryMaintenanceCandidate,
  MemoryMaintenanceJob,
} from '@/types/memory-dreaming'

const fragment: MemorySourceFragment = {
  fragment_id: 'f'.repeat(64),
  part_index: 1,
  part_count: 3,
  offset_unit: 'unicode_codepoint',
  core_start: 100,
  core_end: 200,
  read_start: 36,
  read_end: 264,
  core_sha256: 'c'.repeat(64),
  read_sha256: 'd'.repeat(64),
  splitter_version: 'unicode-boundary-v1',
}
const source = {
  input_id: `fragment-${fragment.fragment_id}`,
  source_id: '9007199254740993',
  source_revision: 2,
  source_generation: 3,
  content_sha256: 'a'.repeat(64),
  fragment,
}
let host: HTMLDivElement, root: Root
beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  await setProductLanguage('zh-CN')
  vi.restoreAllMocks()
})

it.each([
  ['en-US', 'Fragment 2 of 3', 'Primary character range'],
  ['zh-CN', '片段 2／3', '主正文字符范围'],
] as const)(
  'renders exact immutable fragment ranges and distinct hashes in %s',
  async (locale, ordinal, core) => {
    await setProductLanguage(locale)
    await act(async () =>
      root.render(<MemoryFragmentProvenance fragment={fragment} />),
    )
    expect(host.textContent).toContain(ordinal)
    expect(host.textContent).toContain(core)
    expect(host.textContent).toContain('[100, 200)')
    expect(host.textContent).toContain('[36, 264)')
    expect(host.textContent).toContain(fragment.fragment_id)
    expect(host.textContent).toContain(fragment.core_sha256)
    expect(host.textContent).toContain(fragment.read_sha256)
    expect(host.textContent).toContain('Unicode')
    expect(host.textContent).not.toContain('memory.segments.')
  },
)

it('keeps a fragment candidate unverified and separate from publication while showing its whole-source identity', async () => {
  const candidate: MemoryMaintenanceCandidate = {
    candidate_id: 'candidate',
    revision: 1,
    state: 'pending',
    action: 'add',
    target_entry_id: null,
    expected_revision: null,
    message_type: 'semantic',
    content: 'Controlled attributed hypothesis',
    base_content: null,
    patch: null,
    diff: { old_text: '', new_text: 'Controlled attributed hypothesis' },
    reason: 'For manual review',
    sources: [source],
    assessment: { kind: 'hypothesis', verification_status: 'unverified' },
    review_actor_id: null,
    reviewed_at: null,
    publication_operation_id: null,
    redacted: false,
  }
  const review = vi.fn()
  await act(async () =>
    root.render(
      <MemoryRouter>
        <MemoryDreamingCandidate
          candidate={candidate}
          selected={false}
          selectionDisabled={false}
          busy={false}
          onSelect={vi.fn()}
          onReview={review}
        />
      </MemoryRouter>,
    ),
  )
  expect(host.textContent).toContain('9007199254740993')
  expect(host.textContent).toContain('Whole source hash')
  expect(host.textContent).toContain(source.content_sha256)
  expect(host.textContent).toContain('Fragment 2 of 3')
  expect(host.textContent).toContain('hypothesis / unverified')
  expect(host.querySelector('[role="checkbox"]')).toBeNull()
  expect(review).not.toHaveBeenCalled()
})

it('shows a safe concrete deferral reason without counting the fragment as analyzed', async () => {
  const job: MemoryMaintenanceJob = {
    job_id: 'job',
    operation_id: 'create',
    state: 'pending',
    generation: 1,
    policy: 'general',
    input_budget_tokens: 1024,
    output_budget_tokens: 256,
    estimated_input_tokens: 1500,
    coverage: { selected: 1, included: 0, analyzed: 0, deferred: 1 },
    inputs: [
      {
        ...source,
        scope: {},
        coverage: 'deferred',
        defer_reason: 'input_budget',
      },
    ],
    analysis_operation_id: null,
    error_code: null,
    model_reference: null,
    usage: {},
    created_at: '',
    updated_at: '',
  }
  await act(async () => root.render(<MemoryDreamingJob job={job} />))
  expect(host.textContent).toContain(
    'The complete input exceeds the child token budget.',
  )
  expect(host.textContent).toContain('Fragment 2 of 3')
  expect(host.textContent).not.toContain('Input was analyzed')
})

it('requires explicit segmentation opt-in and leaves unsupported whole-source clients unchanged', async () => {
  const limits = { minTokens: 256, maxTokens: 8192, maxParts: 64 }
  await act(async () =>
    root.render(
      <MemorySegmentationControl
        supported={false}
        limits={limits}
        disabled={false}
        onChange={vi.fn()}
      />,
    ),
  )
  expect(host.childElementCount).toBe(0)
  const changes: (MemorySourceSegmentation | undefined)[] = []
  function Control() {
    const [value, setValue] = useState<MemorySourceSegmentation>()
    return (
      <MemorySegmentationControl
        value={value}
        supported
        limits={limits}
        disabled={false}
        onChange={(next) => {
          changes.push(next)
          setValue(next)
        }}
      />
    )
  }
  await act(async () => root.render(<Control />))
  expect(host.querySelector('input[type="number"]')).toBeNull()
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  expect(changes).toEqual([
    { mode: 'segmented', fragment_token_limit: 2048, max_parts_per_source: 32 },
  ])
  expect(host.querySelectorAll('input[type="number"]')).toHaveLength(2)
  expect(validMemorySegmentation(changes[0], limits)).toBe(true)
  expect(
    validMemorySegmentation(
      {
        mode: 'segmented',
        fragment_token_limit: 255,
        max_parts_per_source: 32,
      },
      limits,
    ),
  ).toBe(false)
  expect(
    validMemorySegmentation(
      {
        mode: 'segmented',
        fragment_token_limit: 2048,
        max_parts_per_source: 65,
      },
      limits,
    ),
  ).toBe(false)
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  expect(changes.at(-1)).toBeUndefined()
  expect(host.querySelector('input[type="number"]')).toBeNull()
})
