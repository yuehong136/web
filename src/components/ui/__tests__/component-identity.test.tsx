import { act, cloneElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Loading } from '@/components/ui/loading'
import { TaskExecutorChart } from '@/components/ui/task-executor-chart'
import type { TaskExecutorHeartbeat } from '@/api/system'

// Recharts still renders its real chart and dots; jsdom has no layout engine.
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>()
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children, { width: 640, height: 300 } as object),
  }
})
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('keeps the loading animation node when its parent updates', async () => {
  await act(async () =>
    root.render(<Loading variant="dots" size="md" text="first" />),
  )
  const dot = container.querySelector('.animate-pulse')
  expect(dot).not.toBeNull()
  await act(async () =>
    root.render(<Loading variant="dots" size="md" text="next" />),
  )
  expect(container.querySelector('.animate-pulse')).toBe(dot)
  expect(container.textContent).toBe('next')
})

it('keeps the pinned chart close button and focus across heartbeat updates', async () => {
  const heartbeat: TaskExecutorHeartbeat = {
    name: 'executor',
    now: '2026-10-02T08:00:00Z',
    boot_at: '2026-10-02T07:00:00Z',
    done: 5,
    failed: 1,
    pending: 2,
    lag: 1,
    current: { task: 'fixture' },
  }
  const render = (heartbeats: TaskExecutorHeartbeat[]) =>
    root.render(
      <TaskExecutorChart executorId="executor" heartbeats={heartbeats} />,
    )
  await act(async () => render([heartbeat]))
  const dot = container.querySelector<SVGGElement>('g[style*="pointer"]')
  expect(dot).not.toBeNull()
  await act(async () =>
    dot?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  )
  const close =
    container.querySelector<HTMLButtonElement>('button[title="关闭"]')
  expect(close).not.toBeNull()
  close?.focus()
  await act(async () =>
    render([heartbeat, { ...heartbeat, now: '2026-10-02T08:00:10Z', done: 6 }]),
  )
  expect(container.querySelector('button[title="关闭"]')).toBe(close)
  expect(document.activeElement).toBe(close)
  expect(container.textContent).toContain('fixture')
  await act(async () => close?.click())
  expect(container.querySelector('button[title="关闭"]')).toBeNull()
})
