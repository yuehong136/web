import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/app-shell'
import { WorkbenchNavigationProvider } from '@/components/layout/workbench-navigation'
import { useHomeStore } from '@/stores/home'
import { useUIStore } from '@/stores/ui'
import type { DialogApp } from '@/types/api'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'

vi.mock('../sidebar-utilities', () => ({
  SidebarUtilities: () => <button>Account</button>,
}))
vi.mock('../SidebarConversations', () => ({
  SidebarConversations: () => <div>Real app conversations</div>,
}))
let host: HTMLDivElement
let root: Root
beforeEach(() => {
  stubChatDOM()
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }))
  useHomeStore.getState().reset()
  useUIStore.getState().setSidebarCollapsed(false)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('yields empty Home navigation space and restores app conversations without changing the saved preference', async () => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/home']}>
        <WorkbenchNavigationProvider>
          <AppShell>
            <input aria-label="Draft" defaultValue="Keep this draft" />
          </AppShell>
        </WorkbenchNavigationProvider>
      </MemoryRouter>,
    ),
  )
  const draft = host.querySelector('input')
  expect(
    host
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('true')
  const app = { id: 'app', name: 'Research', llm_id: 'model' } as DialogApp
  await act(async () => useHomeStore.getState().selectApp(app))
  expect(
    host
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('false')
  expect(host.textContent).toContain('Real app conversations')
  expect(host.querySelector('input')).toBe(draft)
  await act(async () => useHomeStore.getState().removeApp())
  expect(
    host
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('true')
  expect(useUIStore.getState().sidebarCollapsed).toBe(false)
})
