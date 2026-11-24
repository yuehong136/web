import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { MemoryEntryList } from '@/pages/memory/detail/memory-entry-list'
import { getMemoryEntries, getMemoryLifecycle } from '../memory-lifecycle'
import { getMemorySettingsValues } from '../memory-settings-form'
import { MemorySourcePagination } from '../memory-source-pagination'
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

it('keeps an enabled extract independently actionable when its source is forgotten', () => {
  // The record list that renders these lives with the memory detail pages
  // (src/pages/memory/__tests__/memory-entry-list.test.tsx).
  const sources = [{ ...source, extract: [extract] }]
  expect(getMemoryEntries(sources)[0].source).toBe(sources[0])
  expect(getMemoryLifecycle(source)).toBe('forgotten')
  expect(getMemoryLifecycle(extract)).toBe('enabled')
  expect(getMemoryLifecycle({ ...extract, status: false })).toBe('disabled')
})

it('preserves a configured zero temperature when hydrating settings', () => {
  expect(
    getMemorySettingsValues({ temperature: 0 } as Memory).temperature,
  ).toBe(0)
})

it('finds a next source using the next offset without trusting a window-sized total', async () => {
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
    const next = host.querySelector<HTMLButtonElement>(
      'button[aria-label="common.nextPage"]',
    )!
    expect(next.disabled).toBe(false)
    await act(async () => next.click())
    expect(change).toHaveBeenCalledWith(2)
  } finally {
    get.mockRestore()
    client.clear()
  }
})

it('keeps temporary managed source inactivity reversible and permanent source tombstones disabled', async () => {
  const inactive = {
    ...source,
    forget_at: 'None',
    managed_source_state: 'inactive' as const,
  }
  const withdrawn = {
    ...inactive,
    message_id: 12,
    managed_source_state: 'forgotten' as const,
  }
  expect(getMemoryLifecycle(inactive)).toBe('disabled')
  expect(getMemoryLifecycle(withdrawn)).toBe('forgotten')
  expect(
    getMemoryLifecycle({ ...withdrawn, managed_source_state: 'deleted' }),
  ).toBe('forgotten')
  await act(async () =>
    root.render(
      <MemoryEntryList
        sources={[inactive, withdrawn]}
        view="sources"
        state="all"
        busy={false}
        onInspect={vi.fn()}
        onStatusChange={vi.fn()}
        onForget={vi.fn()}
      />,
    ),
  )
  const toggles = host.querySelectorAll<HTMLButtonElement>('[role="switch"]')
  expect(toggles[0].disabled).toBe(false)
  expect(toggles[1].disabled).toBe(true)
})
