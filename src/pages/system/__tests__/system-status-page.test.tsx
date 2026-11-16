// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { SystemStatusResponse } from '@/api/system'
import { SystemPage } from '../system-status-page'
import { componentRows, executorRows, parseVersion } from '../system-status'

const status: SystemStatusResponse = {
  database: { status: 'green', elapsed: '3.2', database: 'mysql' },
  doc_engine: {
    status: 'yellow',
    elapsed: '41',
    type: 'elasticsearch',
    version: '8.11.3',
  },
  redis: { status: 'red', elapsed: 'n/a', error: 'Connection refused' },
  storage: { status: 'green', elapsed: '12.5', storage: 'minio' },
  task_executor_heartbeats: {
    'executor-1': [
      {
        name: 'worker-a',
        now: '2026-11-16T10:00:30Z',
        boot_at: '2026-11-16T09:00:00Z',
        pending: 4,
        lag: 7,
        done: 20,
        failed: 0,
        current: { task_id: 'doc-42' },
      },
      {
        name: 'worker-a',
        now: '2026-11-16T10:00:00Z',
        boot_at: '2026-11-16T09:00:00Z',
        pending: 9,
        lag: 2,
        done: 10,
        failed: 0,
        current: {},
      },
    ],
  },
}

const mocks = vi.hoisted(() => ({
  status: {} as {
    data?: SystemStatusResponse
    isPending: boolean
    isError: boolean
  },
  refresh: vi.fn(),
}))
vi.mock('@/hooks/use-system-status', () => ({
  useSystemStatus: () => ({
    ...mocks.status,
    isRefetching: false,
    dataUpdatedAt: 1_763_287_200_000,
  }),
  useSystemVersion: () => ({ data: 'v0.9.9-1655-gb3b027ce full' }),
  useRefreshSystemStatus: () => mocks.refresh,
}))

let root: Root
let container: HTMLDivElement
const render = async () => {
  await act(async () => root.render(<SystemPage />))
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  mocks.status = { data: status, isPending: false, isError: false }
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.clearAllMocks()
})

it('orders components by health and parses latency, engine and version', () => {
  expect(
    componentRows(status).map((row) => [row.id, row.status, row.latency]),
  ).toEqual([
    ['redis', 'red', null],
    ['doc_engine', 'yellow', 41],
    ['storage', 'green', 12.5],
    ['database', 'green', 3.2],
  ])
  expect(parseVersion('v0.9.9-1655-gb3b027ce full')).toEqual({
    version: 'v0.9.9',
    commits: '1655',
    commit: 'b3b027ce',
    build: 'full',
  })
  const [executor] = executorRows(status.task_executor_heartbeats)
  expect(executor.status).toBe('yellow')
  expect(executor.pendingTrend).toEqual([9, 4])
  expect(executor.current).toEqual({ task_id: 'doc-42' })
})

it('shows one row per component with a dot, name, version, latency and status text', async () => {
  await render()
  const sections = container.querySelectorAll('section')
  const components = sections[0]
  const rows = components.querySelectorAll('[data-slot="setting-row"]')
  expect(Array.from(rows).map((row) => row.textContent)).toEqual([
    expect.stringContaining('Cache (Redis)'),
    expect.stringContaining('Vector engine (Elasticsearch)'),
    expect.stringContaining('Object storage (MINIO)'),
    expect.stringContaining('Database (MYSQL)'),
  ])
  expect(rows[0].textContent).toContain('Connection refused')
  expect(rows[0].textContent).toContain('Down')
  expect(rows[1].textContent).toContain('8.11.3')
  expect(rows[1].textContent).toContain('41 ms')
  expect(components.textContent).toContain('Healthy2')
  // No panels, cards or coloured top borders: rows only.
  expect(container.querySelector('[class*="border-t-2"]')).toBeNull()
  expect(container.querySelector('[class*="rounded-2xl"]')).toBeNull()
})

it('keeps task executors in their own section with their current task', async () => {
  await render()
  const executors = container.querySelectorAll('section')[1]
  expect(executors.querySelector('h3')?.textContent).toBe('Task executors')
  expect(executors.textContent).toContain('worker-a')
  expect(executors.textContent).toContain('4 pending')
  expect(executors.textContent).toContain('Lag 7 s')
  expect(executors.querySelector('svg[role="img"]')).toBeTruthy()
  expect(executors.textContent).toContain('doc-42')
  expect(container.textContent).toContain('b3b027ce')
})

it('shows a fixed message when the status cannot be loaded', async () => {
  mocks.status = { isPending: false, isError: true }
  await render()
  expect(container.textContent).toContain('System status could not be loaded')
  const retry = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === 'Retry',
  )!
  await act(async () => retry.click())
  expect(mocks.refresh).toHaveBeenCalled()
})
