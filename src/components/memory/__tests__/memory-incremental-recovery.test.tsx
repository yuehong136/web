import { act } from 'react'
import { useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { memoryDiscoveryKeys } from '@/hooks/use-memory-incremental'
import type {
  MemoryDiscovery,
  MemoryDiscoveryPreview,
} from '@/types/memory-incremental'
import { IncrementalHarness } from './memory-incremental-fixture'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en-US' },
  }),
}))
let h: IncrementalHarness
let scrollDescriptor: PropertyDescriptor | undefined
beforeEach(() => {
  scrollDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollIntoView',
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
  h = new IncrementalHarness()
})
afterEach(async () => {
  await h.dispose()
  if (scrollDescriptor)
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      scrollDescriptor,
    )
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
})

async function savePlan() {
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.preview')).toBeDefined(),
  )
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.createPlan')).toBeDefined(),
  )
  await h.click('memory.incremental.createPlan')
}
async function exact(dimension: 'user' | 'agent') {
  const trigger = h.host.querySelector<HTMLButtonElement>(
    `#incremental-scope-${dimension}-match`,
  )!
  await act(async () =>
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    ),
  )
  const option = [
    ...document.querySelectorAll<HTMLElement>('[role="option"]'),
  ].find((item) => item.textContent === 'memory.incremental.exactValue')!
  await act(async () => option.click())
}

it('preserves empty exact user and whitespace exact agent instead of expanding the scope', async () => {
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.preview')).toBeDefined(),
  )
  await exact('user')
  await exact('agent')
  await h.fill('#incremental-scope-agent', ' agent ')
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalled(),
  )
  expect(memoryAPI.incremental.preview).toHaveBeenCalledWith(
    'bank',
    expect.objectContaining({
      scope: { user_id: '', agent_id: ' agent ', session_id: null },
    }),
  )
})

it('ignores a late preview when the user has changed selection inputs', async () => {
  let resolve!: (value: MemoryDiscoveryPreview) => void
  vi.mocked(memoryAPI.incremental.preview).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.preview')).toBeDefined(),
  )
  await h.click('memory.incremental.preview')
  await vi.waitFor(() =>
    expect(memoryAPI.incremental.preview).toHaveBeenCalledOnce(),
  )
  await h.fill('#incremental-maxSources', '1')
  await act(async () => resolve(h.preview))
  expect(h.button('memory.incremental.createPlan')).toBeUndefined()
  expect(memoryAPI.incremental.create).not.toHaveBeenCalled()
})

it('requires a fresh preview after a confirmed selection conflict and does not retry creation automatically', async () => {
  vi.mocked(memoryAPI.incremental.create).mockRejectedValue(
    new APIError(409, 'conflict', 'untrusted body'),
  )
  await h.render()
  await savePlan()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.repreview')).toBeDefined(),
  )
  expect(h.url()).toContain('request=')
  expect(h.host.textContent).not.toContain('untrusted body')
  expect(memoryAPI.incremental.create).toHaveBeenCalledOnce()
  await h.click('memory.incremental.repreview')
  expect(h.button('memory.incremental.createPlan')).toBeUndefined()
  expect(memoryAPI.incremental.create).toHaveBeenCalledOnce()
})

it('finds an unknown creation on the server after reload without repeating the command', async () => {
  vi.mocked(memoryAPI.incremental.create).mockImplementation(
    async (_mid, command) => {
      h.discovery.operation_id = command.operation_id
      throw new APIError(503, 'unknown', 'untrusted SQL detail')
    },
  )
  await h.render()
  await savePlan()
  await vi.waitFor(() => expect(h.url()).toContain('request='))
  expect(h.host.textContent).toContain('memory.incremental.creationUnknown')
  h.plans = [h.discovery]
  await h.reload()
  await vi.waitFor(() =>
    expect(h.url()).toContain(`batch=${h.discovery.discovery_id}`),
  )
  expect(memoryAPI.incremental.create).toHaveBeenCalledOnce()
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
})

it('replays the original unknown command after reload and acknowledges its own subset despite another unknown child', async () => {
  h.plans = [h.discovery]
  vi.mocked(memoryAPI.incremental.run).mockImplementation(async () => {
    h.discovery.batches[0].state = 'unknown'
    throw new APIError(503, 'unknown', 'untrusted detail')
  })
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.submitChildren')).toBeDefined(),
  )
  await h.fill('#incremental-run-limit', '2')
  await h.click('memory.incremental.submitChildren')
  await vi.waitFor(() =>
    expect(h.host.textContent).toContain('memory.incremental.unknown'),
  )
  const command = vi.mocked(memoryAPI.incremental.run).mock.calls[0][2]
  expect(h.url()).toContain(`run=${command.operation_id}`)
  expect(h.url()).toContain('run_limit=2')
  await h.reload()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.retryOriginalRun')).toBeDefined(),
  )
  expect(
    h.host.querySelector<HTMLInputElement>('#incremental-run-limit')!.disabled,
  ).toBe(true)
  expect(memoryAPI.incremental.run).toHaveBeenCalledOnce()
  h.discovery.batches[0].state = 'submitted'
  h.discovery.batches[1].state = 'unknown'
  vi.mocked(memoryAPI.incremental.run).mockResolvedValue(
    structuredClone(h.discovery),
  )
  await h.click('memory.incremental.retryOriginalRun')
  expect(vi.mocked(memoryAPI.incremental.run).mock.calls[1][2]).toEqual(command)
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.retryOriginalRun')).toBeUndefined(),
  )
  expect(h.button('memory.incremental.submitChildren')!.disabled).toBe(false)
  expect(
    h.host.querySelector<HTMLInputElement>('#incremental-run-limit')!.disabled,
  ).toBe(false)
  expect(h.host.textContent).toContain('memory.incremental.runAccepted')
  expect(h.host.textContent).toContain('memory.incremental.batchStates.unknown')
  expect(memoryAPI.incremental.run).toHaveBeenCalledTimes(2)
})

it('reopens server plans without inventing a lost parent run request', async () => {
  h.discovery.state = 'running'
  h.plans = [h.discovery]
  await h.render()
  await vi.waitFor(() =>
    expect(h.url()).toContain(`batch=${h.discovery.discovery_id}`),
  )
  expect(h.url()).not.toContain('run=')
  expect(h.host.textContent).not.toContain('memory.incremental.runRecovery')
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
})

it('replays the same cancellation after the parent was already canceled before an unknown child acknowledgment', async () => {
  h.plans = [h.discovery]
  vi.mocked(memoryAPI.incremental.cancel).mockImplementation(async () => {
    h.discovery.state = 'canceled'
    throw new APIError(503, 'unknown', 'untrusted detail')
  })
  await h.render()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.cancelPlan')).toBeDefined(),
  )
  await h.click('memory.incremental.cancelPlan')
  const original = vi.mocked(memoryAPI.incremental.cancel).mock.calls[0][2]
  await h.reload()
  await vi.waitFor(() =>
    expect(h.button('memory.incremental.retryCancel')).toBeDefined(),
  )
  expect(h.host.textContent).toContain('memory.incremental.cancelBoundary')
  expect(memoryAPI.incremental.cancel).toHaveBeenCalledOnce()
  expect(h.button('memory.incremental.retryCancel')!.disabled).toBe(false)
  vi.mocked(memoryAPI.incremental.cancel).mockResolvedValue(
    structuredClone(h.discovery),
  )
  await h.click('memory.incremental.retryCancel')
  expect(vi.mocked(memoryAPI.incremental.cancel).mock.calls[1][2]).toBe(
    original,
  )
  expect(h.button('memory.incremental.retryCancel')!.disabled).toBe(true)
  expect(memoryAPI.incremental.cancel).toHaveBeenCalledTimes(2)
  expect(h.host.textContent).toContain('memory.incremental.cancelBoundary')
  expect(memoryAPI.incremental.run).not.toHaveBeenCalled()
})

function OtherBank() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/memory/other/maintenance/batches')}>
      other bank
    </button>
  )
}
it("does not let an old bank's late creation navigate or populate the new bank", async () => {
  let resolve!: (value: MemoryDiscovery) => void
  vi.mocked(memoryAPI.incremental.create).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  await h.render('/memory/bank/maintenance/batches', <OtherBank />)
  await savePlan()
  await h.click('other bank')
  await act(async () => resolve(h.discovery))
  expect(h.url()).toBe('/memory/other/maintenance/batches')
  expect(
    h.cache.getQueryData(
      memoryDiscoveryKeys.detail('other', h.discovery.discovery_id),
    ),
  ).toBeUndefined()
})
