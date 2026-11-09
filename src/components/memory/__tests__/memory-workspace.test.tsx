import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryMessageFeed } from '../memory-message-feed'
import { getMemoryEntries, getMemoryLifecycle } from '../memory-lifecycle'
import { getMemorySettingsValues } from '../memory-settings-form'
import type { Memory, MemoryMessage } from '@/types/memory'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
const source = {
  message_id: 10,
  memory_id: 'a',
  session_id: 'session-a',
  message_type: 'raw',
  valid_at: '2026-11-09',
  forget_at: '2026-11-09 10:00:00',
  status: true,
} as MemoryMessage
const extract = {
  ...source,
  message_id: 11,
  source_id: 10,
  message_type: 'semantic',
  forget_at: 'None',
  content: 'A remembered fact',
} as MemoryMessage
let root: Root, host: HTMLDivElement
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
})

it('keeps an enabled extract independently actionable when its source is forgotten', async () => {
  const sources = [{ ...source, extract: [extract] }]
  expect(getMemoryEntries(sources)[0].source).toBe(sources[0])
  expect(getMemoryLifecycle(source)).toBe('forgotten')
  expect(getMemoryLifecycle(extract)).toBe('enabled')
  expect(getMemoryLifecycle({ ...extract, status: false })).toBe('disabled')
  const inspect = vi.fn(),
    status = vi.fn(),
    forget = vi.fn().mockResolvedValue(undefined)
  const props = {
    sources,
    state: 'all' as const,
    busy: false,
    onInspect: inspect,
    onStatusChange: status,
    onForget: forget,
  }
  await act(async () =>
    root.render(<MemoryMessageFeed {...props} view="sources" />),
  )
  expect(
    host.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled,
  ).toBe(true)
  expect(
    Array.from(host.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'memory.messages.forget',
    )?.disabled,
  ).toBe(true)
  await act(async () =>
    root.render(<MemoryMessageFeed {...props} view="memories" />),
  )
  const toggle = host.querySelector<HTMLButtonElement>('[role="switch"]')!
  expect(toggle.disabled).toBe(false)
  await act(async () => toggle.click())
  expect(status).toHaveBeenCalledWith(11, false)
  const sourceButton = Array.from(host.querySelectorAll('button')).find(
    (button) => button.textContent === 'memory.workspace.source',
  )!
  await act(async () => sourceButton.click())
  expect(inspect).toHaveBeenCalledWith(sources[0])
  expect(forget).not.toHaveBeenCalled()
})

it('preserves a configured zero temperature when hydrating settings', () => {
  expect(
    getMemorySettingsValues({ temperature: 0 } as Memory).temperature,
  ).toBe(0)
})

it('finds a next source using the next offset without trusting a window-sized total', async () => {
  const { QueryClient, QueryClientProvider } =
    await import('@tanstack/react-query')
  const { memoryAPI } = await import('@/api/memory')
  const { MemorySourcePagination } = await import('../memory-source-pagination')
  const get = vi.spyOn(memoryAPI.memory, 'getDetail').mockResolvedValue({
    messages: { message_list: [source], total_count: 1 },
    storage_type: 'table',
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const change = vi.fn()
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <MemorySourcePagination
            memoryId="a"
            page={1}
            pageSize={10}
            count={10}
            keywords="session-a"
            agentId={['agent-a']}
            loading={false}
            onPageChange={change}
            onPageSizeChange={vi.fn()}
          />
        </QueryClientProvider>,
      ),
    )
    await vi.waitFor(() =>
      expect(get).toHaveBeenCalledWith('a', {
        page: 11,
        page_size: 1,
        keywords: 'session-a',
        agent_id: ['agent-a'],
      }),
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    const next = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'common.nextPage',
    )!
    expect(next.disabled).toBe(false)
    await act(async () => next.click())
    expect(change).toHaveBeenCalledWith(2)
  } finally {
    get.mockRestore()
    client.clear()
  }
})
