import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import * as utils from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { setProductLanguage } from '@/locales/i18n'
import { memoryRevisionKeys } from '@/hooks/memory-revision-keys'
import { MemoryCompactionWorkspace } from '../memory-compaction-workspace'
import {
  compactionCapability,
  compactionList,
  compactionResult,
} from './memory-compaction-fixtures'
import type { MemoryCompactionResult } from '@/types/memory-compaction'

let host: HTMLDivElement, root: Root, cache: QueryClient
beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  useAuthStore.setState({ token: 'reference-actor' })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  cache = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.spyOn(utils, 'copyToClipboard').mockResolvedValue()
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    context_compactions: compactionCapability,
    revisions: {
      supported: true,
      managed: true,
      activation_scope: 'memory_bank',
      ordinary_writes_after_activation: true,
      managed_delete_supported: true,
      max_content_bytes: 65535,
      max_content_tokens: 8192,
    },
  })
  vi.spyOn(memoryAPI.compaction, 'operation').mockImplementation(
    async (_mid, op) => compactionResult(op),
  )
  vi.spyOn(memoryAPI.compaction, 'list').mockResolvedValue(compactionList())
  vi.spyOn(memoryAPI.compaction, 'create')
  vi.spyOn(memoryAPI.compaction, 'cancel')
})
afterEach(async () => {
  await act(async () => root.unmount())
  cache.clear()
  host.remove()
  vi.restoreAllMocks()
})
function Navigation() {
  const navigate = useNavigate()
  return (
    <button
      data-other
      onClick={() =>
        navigate('/memory/bank/compaction?compaction_operation=other-op')
      }
    >
      Open another test operation
    </button>
  )
}
async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={cache}>
        <MemoryRouter
          initialEntries={[
            '/memory/bank/compaction?compaction_operation=compaction-original',
          ]}
        >
          <MemoryCompactionWorkspace memoryId="bank" />
          <Navigation />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() =>
    expect(button('Copy consumption reference')?.disabled).toBe(false),
  )
}
function button(label: string) {
  return Array.from(host.querySelectorAll('button')).find(
    (b) => b.textContent === label,
  )
}
async function clickCopy() {
  await act(async () => button('Copy consumption reference')!.click())
}
const summary = 'Owned summary <script>window.__unsafe=1</script>'

it('explicit copy freshly reads the original operation and copies only four fields; repeated copy never generates', async () => {
  await render()
  expect(utils.copyToClipboard).not.toHaveBeenCalled()
  for (let count = 1; count <= 2; count++) {
    await clickCopy()
    await vi.waitFor(() =>
      expect(utils.copyToClipboard).toHaveBeenCalledTimes(count),
    )
    expect(vi.mocked(memoryAPI.compaction.operation).mock.calls).toHaveLength(
      count + 1,
    )
    const text = vi.mocked(utils.copyToClipboard).mock.calls.at(-1)![0]
    expect(JSON.parse(text)).toEqual({
      memory_id: 'bank',
      operation_id: 'compaction-original',
      artifact_id: 'artifact-compaction-original',
      input_manifest_sha256: 'b'.repeat(64),
    })
    expect(text).not.toContain('summary')
    expect(text).not.toContain('content')
    expect(text).not.toContain('scope')
  }
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
  expect(memoryAPI.compaction.cancel).not.toHaveBeenCalled()
  expect(host.textContent).toContain(
    'No summary or source body was copied or applied',
  )
})
it.each([403, 404, 409, 503])(
  'fresh GET %i refuses clipboard and clears old body without replacing operation',
  async (status) => {
    await render()
    vi.mocked(memoryAPI.compaction.operation).mockRejectedValue(
      new APIError(status, String(status), 'private failure'),
    )
    await clickCopy()
    await vi.waitFor(() => expect(host.textContent).not.toContain(summary))
    expect(utils.copyToClipboard).not.toHaveBeenCalled()
    expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
    expect(host.textContent).not.toContain('private failure')
  },
)
it.each(['canceled', 'persistence_unknown'] as const)(
  'fresh %s state cannot export the previous generated reference',
  async (status) => {
    await render()
    const invalid = compactionResult()
    invalid.operation.status = status
    invalid.artifact.state = status
    invalid.artifact.valid_for_current = false
    invalid.artifact.package = null
    vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(invalid)
    await clickCopy()
    await vi.waitFor(() =>
      expect(host.textContent).toContain(
        'A current valid reference could not be copied',
      ),
    )
    expect(utils.copyToClipboard).not.toHaveBeenCalled()
    expect(host.textContent).not.toContain(summary)
  },
)
it('known withdrawal during the fresh read blocks a late generated reference', async () => {
  await render()
  let resolve!: (v: MemoryCompactionResult) => void
  vi.mocked(memoryAPI.compaction.operation).mockImplementationOnce(
    () =>
      new Promise((ok) => {
        resolve = ok
      }),
  )
  await clickCopy()
  await act(async () =>
    cache.setQueryData(memoryRevisionKeys.operation('bank', 'withdraw'), {
      kind: 'withdraw_source',
      source: { source_id: '9223372036854775807' },
      stop_supply: 'withdrawn',
    }),
  )
  await act(async () => resolve(compactionResult()))
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'A current valid reference could not be copied',
    ),
  )
  expect(utils.copyToClipboard).not.toHaveBeenCalled()
  expect(host.textContent).not.toContain(summary)
})
it.each(['actor', 'operation'])(
  'a late fresh response after %s changes never reaches clipboard',
  async (change) => {
    await render()
    let resolve!: (v: MemoryCompactionResult) => void
    vi.mocked(memoryAPI.compaction.operation).mockImplementationOnce(
      () =>
        new Promise((ok) => {
          resolve = ok
        }),
    )
    await clickCopy()
    await act(async () => {
      if (change === 'actor') useAuthStore.setState({ token: 'other-actor' })
      else host.querySelector<HTMLButtonElement>('[data-other]')!.click()
    })
    await act(async () => resolve(compactionResult()))
    await vi.waitFor(() =>
      expect(button('Copy consumption reference')?.disabled).toBe(false),
    )
    expect(utils.copyToClipboard).not.toHaveBeenCalled()
    expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
  },
)
it('clipboard failure shows fixed feedback and leaves generation untouched', async () => {
  await render()
  vi.mocked(utils.copyToClipboard).mockRejectedValue(
    new Error('sensitive clipboard failure'),
  )
  await clickCopy()
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'A current valid reference could not be copied',
    ),
  )
  expect(host.textContent).not.toContain('sensitive clipboard failure')
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
})
