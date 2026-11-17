import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { MemoryMessage } from '@/types/memory'
import { MemoryEntryList } from '../detail/memory-entry-list'

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

it('keeps an enabled extract actionable while its forgotten source is locked', async () => {
  const sources = [{ ...source, extract: [extract] }]
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
    root.render(<MemoryEntryList {...props} view="sources" />),
  )
  expect(
    host.querySelector<HTMLButtonElement>('[role="switch"]')?.disabled,
  ).toBe(true)
  expect(
    Array.from(host.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') === 'memory.detail.forgetMessage',
    )?.disabled,
  ).toBe(true)
  await act(async () =>
    root.render(<MemoryEntryList {...props} view="memories" />),
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
