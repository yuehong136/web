// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatThreadHeader } from '@/components/chat/chat-thread-header'
import { DetailTemplate } from '@/components/page-templates'
import { ProductCommandId } from '@/lib/commands'
import { setProductLanguage } from '@/locales/i18n'
import { useAuthStore } from '@/stores'
import { DesktopActivity, useUIStore } from '@/stores/ui'
import { ActivityRail } from '../activity-rail'
import { DesktopWorkbench } from '../desktop-workbench'

const execute = vi.fn()
vi.mock('@/lib/commands', async (original) => ({
  ...(await original<typeof import('@/lib/commands')>()),
  useApplicationCommands: () => ({ execute }),
}))
vi.mock('../context-panel', () => ({
  DesktopContextPanel: () => <aside data-testid="context-panel" />,
}))

describe('Desktop shell', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    await setProductLanguage('en-US')
    useUIStore.setState({
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      desktopSidebarWidth: 22,
    })
    execute.mockReset()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    useAuthStore.setState({ user: null })
    await setProductLanguage('zh-CN')
  })

  const render = (children: React.ReactNode) =>
    act(async () =>
      root.render(
        <MemoryRouter>
          <DesktopWorkbench>{children}</DesktopWorkbench>
        </MemoryRouter>,
      ),
    )

  it('puts a conversation title and its actions in the one toolbar row', async () => {
    await render(
      <ChatThreadHeader
        title="Quarterly plan"
        actions={<button type="button">Share</button>}
      />,
    )

    const toolbar = container.querySelector('[data-desktop-toolbar]')!
    expect(
      toolbar.querySelector('[data-workbench-title] h1')?.textContent,
    ).toBe('Quarterly plan')
    expect(toolbar.querySelector('[data-workbench-actions]')?.textContent).toBe(
      'Share',
    )
    // Only the toolbar is a header row; the thread header does not stack.
    expect(container.querySelectorAll('header')).toHaveLength(1)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    // With a title in the row the palette steps aside to a compact button.
    const palette = toolbar.querySelector<HTMLButtonElement>(
      '[data-desktop-palette]',
    )!
    expect(palette.dataset.desktopPalette).toBe('compact')
    await act(async () => palette.click())
    expect(execute).toHaveBeenCalledWith(ProductCommandId.OPEN_PALETTE)
  })

  it('hands page template titles to the toolbar too', async () => {
    await render(
      <DetailTemplate title="Data sources">
        <p>body</p>
      </DetailTemplate>,
    )
    const toolbar = container.querySelector('[data-desktop-toolbar]')!
    expect(toolbar.querySelector('h1')?.textContent).toBe('Data sources')
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('keeps the palette centred when no page claims the title', async () => {
    await render(<p>workspace</p>)
    const toolbar = container.querySelector('[data-desktop-toolbar]')!
    expect(
      toolbar
        .querySelector('[data-workbench-title]')
        ?.classList.contains('hidden'),
    ).toBe(true)
    expect(
      toolbar
        .querySelector('[data-desktop-palette]')
        ?.getAttribute('data-desktop-palette'),
    ).toBe('centred')
  })

  it("shows the signed-in user's avatar as the profile button", async () => {
    useAuthStore.setState({
      user: { id: 'user-1', nickname: 'Ada', email: 'ada@example.com' },
    } as never)
    await act(async () => root.render(<ActivityRail />))
    const profile = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Profile"]',
    )!
    const avatar = profile.querySelector('[data-slot="entity-avatar"]')!
    expect(avatar.className).toContain('rounded-full')
    expect(avatar.textContent).toBe('A')
    await act(async () => profile.click())
    expect(execute).toHaveBeenCalledWith(ProductCommandId.NAVIGATE_SETTINGS)
  })
})
