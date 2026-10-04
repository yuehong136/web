import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { skillsAPI } from '@/api/skills'
import { APIError } from '@/api/client'
import { skillKeys, isSkillOperationTerminal } from '@/hooks/use-skill-request'
import type { SkillOperation } from '@/api/skill-types'
import { SkillOperations, useSkillOperationRoute } from '../skill-shared'
import { changeLanguage } from '@/locales/i18n'

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
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
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
