import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { useAuthStore } from '@/stores/auth'
import { setProductLanguage } from '@/locales/i18n'
import { MemoryCompactionWorkspace } from '../memory-compaction-workspace'
import {
  compactionCapability,
  compactionList,
  compactionResult,
} from './memory-compaction-fixtures'
import {
  previewHash,
  retentionCapability,
  retentionInventory,
  retentionPreview,
  retirementReceipt,
} from './memory-compaction-retention-fixtures'
import type { MemoryCompactionResult } from '@/types/memory-compaction'

const operationId = 'compaction-original'
const artifactId = 'artifact-' + operationId
const previewLabel = 'Preview artifact cleanup'
const confirmLabel = 'Confirm artifact cleanup'
const receiptLabel = 'Read original cleanup receipt'
const summary = 'Owned summary'
let host: HTMLDivElement, root: Root, query: QueryClient
const find = (label: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => button.textContent?.trim() === label,
  )
const click = async (label: string) => {
  await vi.waitFor(() => expect(find(label)?.disabled).toBe(false))
  await act(async () => find(label)?.click())
}
const tickConfirmation = async () => {
  const checkbox = host.querySelector<HTMLButtonElement>('[role=checkbox]')
  expect(checkbox?.disabled).toBe(false)
  await act(async () => checkbox?.click())
}

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  useAuthStore.setState({ token: 'original-actor-token' })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  query = new QueryClient()
  vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue({
    context_compactions: {
      ...compactionCapability,
      retention: retentionCapability,
    },
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
  vi.spyOn(memoryAPI.compaction, 'operation').mockResolvedValue(
    compactionResult(),
  )
  vi.spyOn(memoryAPI.compaction, 'list').mockResolvedValue(compactionList())
  vi.spyOn(memoryAPI.compaction, 'inventory').mockResolvedValue(
    retentionInventory('bank', false),
  )
  vi.spyOn(memoryAPI.compaction, 'retentionPreview').mockResolvedValue(
    retentionPreview(compactionResult()),
  )
  vi.spyOn(memoryAPI.compaction, 'retire')
  vi.spyOn(memoryAPI.compaction, 'create')
})

afterEach(async () => {
  await act(async () => root.unmount())
  query.clear()
  host.remove()
  vi.restoreAllMocks()
})

function Location() {
  return <output data-location>{useLocation().search}</output>
}

async function openOperation() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={query}>
        <MemoryRouter
          initialEntries={[
            `/memory/bank/compaction?compaction_operation=${operationId}`,
          ]}
        >
          <MemoryCompactionWorkspace memoryId="bank" />
          <Location />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await vi.waitFor(() => expect(host.textContent).toContain('Available slots'))
}

it('requires fresh preview and explicit acknowledgment; cleanup and re-open never regenerate', async () => {
  const retired = retirementReceipt(compactionResult())
  vi.mocked(memoryAPI.compaction.retire).mockImplementation(async () => {
    vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(retired)
    vi.mocked(memoryAPI.compaction.inventory).mockResolvedValue(
      retentionInventory('bank', true),
    )
    return retired
  })
  await openOperation()
  expect(memoryAPI.compaction.retentionPreview).not.toHaveBeenCalled()
  expect(memoryAPI.compaction.retire).not.toHaveBeenCalled()
  await click(previewLabel)
  await vi.waitFor(() => expect(find(confirmLabel)?.disabled).toBe(true))
  expect(host.textContent).toContain('9223372036854775807')
  await tickConfirmation()
  const confirm = find(confirmLabel)!
  await act(async () => {
    confirm.click()
    confirm.click()
  })
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Artifact content has been cleared'),
  )
  await vi.waitFor(() => expect(host.textContent).toContain('1000'))
  expect(memoryAPI.compaction.retire).toHaveBeenCalledExactlyOnceWith(
    'bank',
    artifactId,
    previewHash,
  )
  expect(host.textContent).not.toContain(summary)
  expect(find('Copy consumption reference')).toBeUndefined()
  expect(host.querySelector('[data-location]')?.textContent).toBe(
    `?compaction_operation=${operationId}`,
  )
  await act(async () => root.unmount())
  root = createRoot(host)
  await openOperation()
  await click(receiptLabel)
  expect(find(previewLabel)).toBeUndefined()
  expect(memoryAPI.compaction.retire).toHaveBeenCalledTimes(1)
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
})

it('blocks unproven drain and requires a freshly acknowledged CAS ticket after conflict', async () => {
  const preview = retentionPreview(compactionResult())
  const nextHash = 'e'.repeat(64)
  vi.mocked(memoryAPI.compaction.retentionPreview)
    .mockResolvedValueOnce({
      ...preview,
      eligible: false,
      writer_busy: true,
      blockers: ['writer_not_drained'],
    })
    .mockResolvedValueOnce(preview)
    .mockResolvedValue({ ...preview, preview_sha256: nextHash })
  vi.mocked(memoryAPI.compaction.retire).mockRejectedValueOnce(
    new APIError(409, '409', 'unsafe details'),
  )
  await openOperation()
  await click(previewLabel)
  await vi.waitFor(() =>
    expect(host.textContent).toContain(
      'actual provider attempt has not drained',
    ),
  )
  expect(find(confirmLabel)?.disabled).toBe(true)
  expect(memoryAPI.compaction.retire).not.toHaveBeenCalled()
  await click(previewLabel)
  await vi.waitFor(() =>
    expect(
      host.querySelector<HTMLButtonElement>('[role=checkbox]')?.disabled,
    ).toBe(false),
  )
  await tickConfirmation()
  await click(confirmLabel)
  await vi.waitFor(() =>
    expect(host.textContent).toContain('preview is no longer current'),
  )
  expect(host.textContent).not.toContain('unsafe details')
  await click(previewLabel)
  await vi.waitFor(() =>
    expect(
      host.querySelector<HTMLButtonElement>('[role=checkbox]')?.disabled,
    ).toBe(false),
  )
  expect(find(confirmLabel)?.disabled).toBe(true)
  expect(
    host.querySelector('[role=checkbox]')?.getAttribute('aria-checked'),
  ).toBe('false')
  expect(memoryAPI.compaction.retire).toHaveBeenCalledTimes(1)
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
})

it('suspends the old body during an unknown cleanup and binds recovery to the same artifact', async () => {
  let reject!: (error: Error) => void
  vi.mocked(memoryAPI.compaction.retire).mockImplementation(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail
      }),
  )
  await openOperation()
  await vi.waitFor(() => expect(host.textContent).toContain(summary))
  await click(previewLabel)
  await vi.waitFor(() =>
    expect(
      host.querySelector<HTMLButtonElement>('[role=checkbox]')?.disabled,
    ).toBe(false),
  )
  await tickConfirmation()
  await click(confirmLabel)
  await click('Read current status')
  expect(host.textContent).not.toContain(summary)
  await act(async () => reject(new APIError(503, '503', 'unknown')))
  await vi.waitFor(() =>
    expect(host.textContent).toContain('result is not yet confirmed'),
  )
  expect(find('Prepare a new explicit request')).toBeUndefined()
  const retired = retirementReceipt(compactionResult())
  const wrong: MemoryCompactionResult = structuredClone(retired)
  wrong.operation.artifact_id = wrong.artifact.artifact_id =
    'different-artifact'
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValueOnce(wrong)
  await click(receiptLabel)
  await vi.waitFor(() =>
    expect(host.textContent).toContain('original operation could not be read'),
  )
  vi.mocked(memoryAPI.compaction.operation).mockResolvedValue(retired)
  await click(receiptLabel)
  await vi.waitFor(() =>
    expect(host.textContent).toContain('Artifact content has been cleared'),
  )
  expect(host.textContent).not.toContain(summary)
  expect(memoryAPI.compaction.retire).toHaveBeenCalledTimes(1)
  expect(memoryAPI.compaction.create).not.toHaveBeenCalled()
})
