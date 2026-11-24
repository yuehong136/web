import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { MemoryTargetRecommendations } from '../memory-target-recommendations'
import { MemoryDreamingForm } from '../memory-dreaming-form'
import { MemoryIncrementalForm } from '../memory-incremental-form'
import { caps } from './memory-incremental-fixture'
import { selectedMemoryTargets } from '@/lib/memory-targets'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import type { MemoryTargetRecommendations as Result } from '@/types/memory-targets'
import {
  targetCapability,
  targetEntryId,
  targetInputId,
  targetDependencyId,
  targetResult,
} from './memory-target-fixture'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
let host: HTMLDivElement, root: Root, cache: QueryClient, token: string | null
const selected = vi.fn(),
  dirty = vi.fn()
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
  token = useAuthStore.getState().token
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(memoryAPI.dreaming, 'recommendTargets').mockResolvedValue(
    targetResult(),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  useAuthStore.setState({ token })
  selected.mockReset()
  dirty.mockReset()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const button = (key: string) =>
  [...host.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent === key,
  )!
const fill = async (selector: string, value: string) =>
  act(async () => {
    const element = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      selector,
    )!
    const prototype =
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
const fillLabel = (label: string, value: string) => {
  const element = [...host.querySelectorAll<HTMLLabelElement>('label')].find(
    (item) => item.textContent === label,
  )!
  return fill(`[id="${element.htmlFor}"]`, value)
}
async function render(key = 'source-a') {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryTargetRecommendations
          memoryId="bank"
          capability={targetCapability}
          sourceIds={[targetInputId]}
          scope={{ user_id: ' alpha ', agent_id: '' }}
          inputKey={key}
          disabled={false}
          onDirty={dirty}
          onSelection={selected}
        />
      </QueryClientProvider>,
    ),
  )
}
async function suggest() {
  await act(async () => button('memory.targets.request').click())
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Original scoped preference'),
  )
}
it('requests only explicitly and leaves every suggested target unchecked until applied', async () => {
  await render()
  expect(memoryAPI.dreaming.recommendTargets).not.toHaveBeenCalled()
  await suggest()
  expect(memoryAPI.dreaming.recommendTargets).toHaveBeenCalledWith(
    'bank',
    expect.objectContaining({
      user_id: ' alpha ',
      agent_id: '',
      source_ids: [targetInputId],
    }),
  )
  expect(
    [...host.querySelectorAll('[role="checkbox"]')].every(
      (checkbox) => checkbox.getAttribute('aria-checked') === 'false',
    ),
  ).toBe(true)
  expect(button('memory.targets.apply').disabled).toBe(true)
  expect(host.textContent).toContain('memory.targets.inventoryTruncated')
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    active: true,
    blocked: true,
    entryIds: [],
  })
  await act(async () => button('memory.targets.apply').click())
  const state = selected.mock.calls.at(-1)![0]
  expect(state.entryIds).toEqual([targetEntryId])
  expect(
    state.confirmation.targets.map(
      (target: { entry_id: string }) => target.entry_id,
    ),
  ).toEqual([targetEntryId])
  expect(state.confirmation.targets[0]).not.toHaveProperty('content')
  expect(state.closureIds).toEqual([targetInputId, targetDependencyId])
  expect(state.blocked).toBe(false)
})
it('ignores a delayed recommendation after the source selection changes', async () => {
  let resolve!: (value: Result) => void
  vi.mocked(memoryAPI.dreaming.recommendTargets).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  await render('a')
  await act(async () => button('memory.targets.request').click())
  await render('b')
  await act(async () => resolve(targetResult()))
  expect(host.textContent).not.toContain('Original scoped preference')
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    blocked: true,
    entryIds: [],
  })
  expect(memoryAPI.dreaming.recommendTargets).toHaveBeenCalledOnce()
})
it('keeps a changed target snapshot stale rather than silently loading a new body', async () => {
  await render()
  await suggest()
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.entry('bank', '9007199254741003'), {
      entry_id: targetEntryId,
      current_revision: 3,
      current_message_id: '9007199254741009',
      state: 'active',
      current: {
        content: 'New server body',
        content_sha256: '0'.repeat(64),
        redacted: false,
      },
    }),
  )
  expect(host.textContent).toContain('memory.targets.stale')
  expect(host.textContent).toContain('Original scoped preference')
  expect(host.textContent).not.toContain('New server body')
  expect(
    [...host.querySelectorAll<HTMLButtonElement>('[role="checkbox"]')].every(
      (element) => element.disabled,
    ),
  ).toBe(true)
  expect(memoryAPI.dreaming.recommendTargets).toHaveBeenCalledOnce()
})
it('removes known-withdrawn source bodies from recommendations even when no refresh succeeds', async () => {
  await render()
  await suggest()
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.source('bank', targetDependencyId), {
      memory_id: 'bank',
      source_id: targetDependencyId,
      managed: true,
      source_revision: 1,
      generation: 2,
      content_sha256: 'a'.repeat(64),
      state: 'forgotten',
      scope: {},
    }),
  )
  expect(host.textContent).not.toContain('Original scoped preference')
  expect(host.textContent).not.toContain('Another related entry')
  expect(host.textContent).toContain('memory.targets.stale')
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    blocked: true,
    entryIds: [],
  })
  await render()
  expect(host.textContent).not.toContain('Original scoped preference')
})
it('allows explicit return to manual IDs after an unknown result without retrying the model', async () => {
  vi.mocked(memoryAPI.dreaming.recommendTargets).mockRejectedValue(
    new APIError(503, 'unknown', 'private provider detail'),
  )
  await render()
  await act(async () => button('memory.targets.request').click())
  await vi.waitFor(() =>
    expect(host.textContent).toContain('memory.targets.unknown'),
  )
  expect(host.textContent).not.toContain('private provider detail')
  await act(async () => button('memory.targets.clear').click())
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    active: false,
    blocked: false,
    entryIds: [],
  })
  expect(memoryAPI.dreaming.recommendTargets).toHaveBeenCalledOnce()
})
it('fences a previous actor pending result', async () => {
  let resolve!: (value: Result) => void
  vi.mocked(memoryAPI.dreaming.recommendTargets).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  await render()
  await act(async () => button('memory.targets.request').click())
  await act(async () =>
    useAuthStore.setState({ token: 'controlled-next-actor' }),
  )
  await act(async () => resolve(targetResult()))
  expect(host.textContent).not.toContain('Original scoped preference')
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    active: false,
    entryIds: [],
  })
})
it('manual snapshot creation includes only the selected target and its visible required source closure', async () => {
  const create = vi.fn()
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryDreamingForm
          memoryId="bank"
          targetCapability={targetCapability}
          disabled={false}
          managed
          maxSources={32}
          onCreate={create}
          onInspectSources={vi.fn()}
        />
      </QueryClientProvider>,
    ),
  )
  await fill('textarea[name="sourceIds"]', targetInputId)
  await fillLabel('memory.targets.user', ' alpha ')
  await suggest()
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  await act(async () => button('memory.targets.apply').click())
  await act(async () => button('memory.dreaming.create').click())
  await vi.waitFor(() => expect(create).toHaveBeenCalledOnce())
  const command = create.mock.calls[0][0]
  expect(command.source_ids).toEqual([targetInputId, targetDependencyId])
  expect(command.entry_ids).toEqual([targetEntryId])
  expect(command.target_preconditions.targets).toHaveLength(1)
  expect(command.target_preconditions.targets[0].revision).toBe('2')
})

it('continues redacting a withdrawn dependency after an earlier version change made the snapshot stale', async () => {
  await render()
  await suggest()
  await render('changed-source-range')
  expect(host.textContent).toContain('Original scoped preference')
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.source('bank', targetDependencyId), {
      memory_id: 'bank',
      source_id: targetDependencyId,
      state: 'forgotten',
    }),
  )
  expect(host.textContent).not.toContain('Original scoped preference')
})
it('restores only previously accepted metadata conditions and keeps them on explicit previews without a new model call', async () => {
  const confirmation = selectedMemoryTargets(targetResult(), [targetEntryId]),
    preview = vi.fn()
  const initial = {
    scope: { user_id: ' alpha ', agent_id: '', session_id: null },
    policy: 'general' as const,
    entry_ids: [targetEntryId],
    batch_size: 32,
    max_sources: 128,
    input_budget_tokens: 16384,
    output_budget_tokens: 4096,
    target_preconditions: confirmation,
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryIncrementalForm
          memoryId="bank"
          targetCapability={targetCapability}
          capabilities={caps.maintenance!.discoveries!}
          pending={false}
          locked={false}
          onDirty={dirty}
          onPreview={preview}
          initialSelection={initial}
        />
      </QueryClientProvider>,
    ),
  )
  expect(host.textContent).toContain('memory.targets.restored')
  expect(host.textContent).not.toContain('Original scoped preference')
  expect(memoryAPI.dreaming.recommendTargets).not.toHaveBeenCalled()
  await act(async () => button('memory.incremental.preview').click())
  await vi.waitFor(() => expect(preview).toHaveBeenCalledOnce())
  expect(preview.mock.calls[0][0]).toEqual(initial)
  await fill('#incremental-inputBudget', '12000')
  expect(button('memory.incremental.preview').disabled).toBe(true)
  expect(host.textContent).toContain('memory.targets.stale')
})
it('requires exact subject scope and never silently takes the first eight previewed sources', async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryTargetRecommendations
          memoryId="bank"
          capability={targetCapability}
          sourceOptions={Array.from({ length: 9 }, (_, i) => String(i + 1))}
          scope={{ user_id: null, agent_id: '' }}
          inputKey="any"
          disabled={false}
          onDirty={dirty}
          onSelection={selected}
        />
      </QueryClientProvider>,
    ),
  )
  expect(button('memory.targets.usePreviewSources').disabled).toBe(true)
  expect(button('memory.targets.request').disabled).toBe(true)
  expect(host.textContent).toContain('memory.targets.exactRequired')
  expect(memoryAPI.dreaming.recommendTargets).not.toHaveBeenCalled()
})
it('keeps restored conditions blocked when the backend no longer advertises recommendations', async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryTargetRecommendations
          memoryId="bank"
          initialConfirmation={selectedMemoryTargets(targetResult(), [
            targetEntryId,
          ])}
          scope={{ user_id: ' alpha ', agent_id: '' }}
          inputKey="saved"
          disabled={false}
          onDirty={dirty}
          onSelection={selected}
        />
      </QueryClientProvider>,
    ),
  )
  expect(host.textContent).toContain('memory.targets.unsupported')
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    active: true,
    blocked: true,
  })
  expect(memoryAPI.dreaming.recommendTargets).not.toHaveBeenCalled()
  await act(async () => button('memory.targets.clear').click())
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    active: false,
    blocked: false,
  })
})

it('does not invalidate a restored accepted plan during StrictMode mount replay', async () => {
  await act(async () =>
    root.render(
      <StrictMode>
        <QueryClientProvider client={cache}>
          <MemoryTargetRecommendations
            memoryId="bank"
            capability={targetCapability}
            initialConfirmation={selectedMemoryTargets(targetResult(), [
              targetEntryId,
            ])}
            scope={{ user_id: ' alpha ', agent_id: '' }}
            inputKey="saved"
            disabled={false}
            onDirty={dirty}
            onSelection={selected}
          />
        </QueryClientProvider>
      </StrictMode>,
    ),
  )
  expect(dirty).not.toHaveBeenCalled()
  expect(selected.mock.calls.at(-1)![0]).toMatchObject({
    active: true,
    blocked: false,
    entryIds: [targetEntryId],
  })
})
