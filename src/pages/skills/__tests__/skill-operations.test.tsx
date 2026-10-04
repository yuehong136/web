import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation, Routes, Route } from 'react-router-dom'
import { skillsAPI } from '@/api/skills'
import { APIError } from '@/api/client'
import { skillKeys, isSkillOperationTerminal } from '@/hooks/use-skill-request'
import type { SkillOperation } from '@/api/skill-types'
import { SkillOperations, useSkillOperationRoute } from '../skill-shared'
import { changeLanguage } from '@/locales/i18n'
import { skillCoreAPI } from '@/api/skill-core'
import { skillCoreKeys } from '@/hooks/use-skill-core-request'
import { CoreConfigDialog } from '../core/core-config-dialog'
import { CoreSpacePage } from '../core/core-space-page'
import { CoreDeletion } from '../core/core-deletion'

const id = 'a'.repeat(32)
const item = 'b'.repeat(32)
let root: Root
let container: HTMLDivElement
let client: QueryClient
const operation: SkillOperation = {
  id,
  kind: 'delete_skills',
  state: 'partial',
  phase: 'cleaning',
  attempts: 1,
  resource_id: null,
  progress: { completed: 1, total: 2 },
  result: {
    items: [
      {
        id: item,
        state: 'failed',
        error_code: 'BACKEND_OWNER_MISMATCH',
        retryable: true,
      },
    ],
  },
  error: {
    error_code: 'BACKEND_OWNER_MISMATCH',
    message: 'private raw error must never render',
    retryable: true,
  },
  create_time: 1,
  update_time: 2,
}
function Harness() {
  const tracker = useSkillOperationRoute()
  const location = useLocation()
  return (
    <>
      <SkillOperations tracker={tracker} />
      <a href={tracker.href('/skills/example', { version: item })}>asset</a>
      <span data-testid="url">{location.search}</span>
    </>
  )
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await changeLanguage('en-US')
  client.setQueryData(skillKeys.capabilities(), {
    backend: 'python',
    writable: true,
    schema_version: 1,
    sources: ['local'],
    search_modes: ['keyword'],
    search_available: true,
    storage_available: true,
  })
  vi.spyOn(skillsAPI, 'capabilities').mockResolvedValue({
    backend: 'python',
    writable: true,
    schema_version: 1,
    sources: ['local'],
    search_modes: ['keyword'],
    search_available: true,
    storage_available: true,
  })
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('resumes an operation from the URL, preserves partial items and never renders raw server errors', async () => {
  const fetchOperation = vi
    .spyOn(skillsAPI, 'operation')
    .mockResolvedValue(operation)
  const retry = vi
    .spyOn(skillsAPI, 'retry')
    .mockRejectedValueOnce(
      new APIError(0, 'NETWORK_ERROR', 'private network error'),
    )
    .mockResolvedValue({
      operation_id: id,
      resource_id: null,
      state: 'pending',
    })
  client.setQueryData(skillKeys.operation(id), operation)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/skills?operation=${id}`]}>
          <Harness />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  expect(fetchOperation).toHaveBeenCalledWith(id, expect.any(AbortSignal))
  expect(container.textContent).toContain('Partially completed')
  expect(container.textContent).toContain(item)
  expect(container.textContent).not.toContain('private raw')
  expect(container.querySelector('a')?.getAttribute('href')).toBe(
    `/skills/example?version=${item}&operation=${id}`,
  )
  const retryButton = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Retry',
  )!
  const readsBeforeRetry = fetchOperation.mock.calls.length
  await act(async () => retryButton.click())
  expect(retry).toHaveBeenCalledWith(id, expect.any(String))
  const firstKey = retry.mock.calls[0][1]
  await act(async () => retryButton.click())
  expect(retry).toHaveBeenLastCalledWith(id, firstKey)
  expect(fetchOperation.mock.calls.length).toBeGreaterThan(readsBeforeRetry)
  expect(container.querySelector('[data-testid="url"]')?.textContent).toBe(
    `?operation=${id}`,
  )
})

it('terminal states stop polling while accepted and running states remain live', () => {
  expect(
    ['succeeded', 'partial', 'failed'].every(isSkillOperationTerminal),
  ).toBe(true)
  expect(['pending', 'running'].some(isSkillOperationTerminal)).toBe(false)
})

it('a read-only asset service keeps retry disabled even for its own resources', async () => {
  const capability = {
    backend: 'go' as const,
    writable: false,
    schema_version: 1 as const,
    sources: ['local' as const],
    search_modes: ['keyword' as const],
    search_available: true,
    storage_available: true,
  }
  vi.mocked(skillsAPI.capabilities).mockResolvedValue(capability)
  client.setQueryData(skillKeys.capabilities(), capability)
  vi.spyOn(skillsAPI, 'operation').mockResolvedValue(operation)
  client.setQueryData(skillKeys.operation(id), operation)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/skills?operation=${id}`]}>
          <Harness />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  expect(
    [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Retry',
    )?.disabled,
  ).toBe(true)
})

it('core deletion exposes real failed cleanup and retries DELETE without fabricating an operation', async () => {
  const space = {
    id,
    tenant_id: id,
    folder_id: item,
    name: 'Workspace',
    top_k: 10,
    status: 'deleting' as const,
    delete_error: { error_code: 'DELETE_FAILED', retryable: true },
  }
  vi.spyOn(skillCoreAPI, 'space').mockResolvedValue(space)
  const remove = vi
    .spyOn(skillCoreAPI, 'deleteSpace')
    .mockResolvedValue({ deleting: true, space_id: id })
  const assetOperation = vi.spyOn(skillsAPI, 'operation')
  client.setQueryData(skillCoreKeys.space(id), space)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <CoreDeletion id={id} dismiss={() => undefined} />
      </QueryClientProvider>,
    ),
  )
  expect(container.textContent).toContain('Deletion failed')
  const retry = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Retry',
  )!
  await act(async () => retry.click())
  expect(remove).toHaveBeenCalledWith(id)
  expect(assetOperation).not.toHaveBeenCalled()
  expect(container.textContent).not.toContain('Task details')
})

it('core cleanup only becomes complete on a real deleted state or explicit 404, never arbitrary read failure', async () => {
  const read = vi
    .spyOn(skillCoreAPI, 'space')
    .mockRejectedValue(
      new APIError(503, 'CORE_REQUEST_FAILED', 'private database error'),
    )
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <CoreDeletion id={id} dismiss={() => undefined} />
      </QueryClientProvider>,
    ),
  )
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  expect(container.textContent).not.toContain('Deleted')
  expect(container.textContent).not.toContain('private database')
  read.mockRejectedValue(new APIError(404, 'NOT_FOUND', 'private missing file'))
  await act(async () => {
    await client.invalidateQueries({ queryKey: skillCoreKeys.space(id) })
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  expect(container.textContent).toContain('Deleted')
  expect(container.textContent).not.toContain('private missing')
})

it('core browse reads unindexed Files directories without requesting indexed search', async () => {
  const space = {
    id,
    tenant_id: id,
    folder_id: item,
    name: 'Library',
    top_k: 10,
    status: 'active' as const,
  }
  vi.spyOn(skillCoreAPI, 'space').mockResolvedValue(space)
  vi.spyOn(skillCoreAPI, 'files').mockResolvedValue({
    files: [{ id: 'unindexed', name: 'Unindexed package', type: 'folder' }],
    total: 1,
    parent_folder: { id: item, name: 'Library', type: 'folder' },
  })
  const search = vi.spyOn(skillCoreAPI, 'search')
  client.setQueryData(skillCoreKeys.space(id), space)
  client.setQueryData(skillCoreKeys.children(item), [
    { id: 'unindexed', name: 'Unindexed package', type: 'folder' },
  ])
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/skills/${id}`]}>
          <Routes>
            <Route path="/skills/:spaceId" element={<CoreSpacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  expect(container.textContent).toContain('Unindexed package')
  expect(container.textContent).toContain('1 results')
  expect(search).not.toHaveBeenCalled()
})

it('an omitted upstream rerank preference does not dirty an untouched configuration', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  const config = {
    id,
    tenant_id: id,
    space_id: id,
    embd_id: '9007199254740993',
    vector_similarity_weight: 0,
    similarity_threshold: 0,
    top_k: 10,
    index_version: '1.0.0',
    status: '1',
    field_config: {
      name: { enabled: true, weight: 3 },
      tags: { enabled: true, weight: 2 },
      description: { enabled: true, weight: 1 },
      content: { enabled: false, weight: 0.5 },
    },
  }
  vi.spyOn(skillCoreAPI, 'config').mockResolvedValue(config)
  vi.spyOn(skillCoreAPI, 'models').mockResolvedValue({ models: [] })
  vi.spyOn(skillCoreAPI, 'protocols').mockResolvedValue({
    default_protocol: 'ragflow-skills-v1',
    backend: 'go',
    protocols: [],
  })
  client.setQueryData(skillCoreKeys.config(id), config)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <CoreConfigDialog space={id} onClose={() => undefined} />
      </QueryClientProvider>,
    ),
  )
  expect(
    [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Rebuild index',
    )?.disabled,
  ).toBe(false)
})
