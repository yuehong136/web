// @vitest-environment jsdom

import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApplicationCommandProvider,
  ProductCommandId,
  useApplicationCommands,
} from '@/lib/commands'
import {
  PlatformKind,
  PlatformProvider,
  type ApplicationComposition,
  type CommandListener,
} from '@/platform'
import { useHomeStore } from '@/stores/home'
import { DesktopActivity, useUIStore } from '@/stores/ui'
import { setProductLanguage } from '@/locales/i18n'
import { ROUTES } from '@/constants'

const originalToggleDesktopSidebar = useUIStore.getState().toggleDesktopSidebar
const originalToggleSidebar = useUIStore.getState().toggleSidebar

class TestResizeObserver implements ResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

function createComposition(
  kind: PlatformKind = PlatformKind.DESKTOP,
  nativeMenu = kind === PlatformKind.DESKTOP,
) {
  const listeners = new Set<CommandListener>()
  const composition: ApplicationComposition = Object.freeze({
    platform: Object.freeze({
      kind,
      capabilities: () =>
        Object.freeze({
          desktop: kind === PlatformKind.DESKTOP,
          nativeMenu,
          updater: false,
          notifications: false,
          localAgent: false,
          pty: false,
          localMcp: false,
        }),
    }),
    commandSource: Object.freeze({
      subscribe(listener: CommandListener) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    }),
  })

  return {
    composition,
    emit(id: ProductCommandId) {
      listeners.forEach((listener) => listener(id))
    },
  }
}

const CommandProbe = () => {
  const { execute } = useApplicationCommands()
  const location = useLocation()
  return (
    <div>
      <button
        id="palette-trigger"
        type="button"
        onClick={() => void execute(ProductCommandId.OPEN_PALETTE)}
      >
        palette
      </button>
      <button
        id="toolbar-toggle"
        type="button"
        onClick={() => void execute(ProductCommandId.TOGGLE_SIDEBAR)}
      >
        toggle
      </button>
      <button
        id="new-conversation"
        type="button"
        onClick={() => void execute(ProductCommandId.NEW_CONVERSATION)}
      >
        new
      </button>
      <output data-testid="location">{location.pathname}</output>
    </div>
  )
}

describe('ApplicationCommandProvider', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true
    globalThis.ResizeObserver = TestResizeObserver
    HTMLElement.prototype.scrollIntoView = vi.fn()
    await setProductLanguage('en-US')
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      window.setTimeout(() => callback(0), 0)
      return 1
    }
    useUIStore.setState({
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      sidebarCollapsed: false,
      toggleDesktopSidebar: originalToggleDesktopSidebar,
      toggleSidebar: originalToggleSidebar,
    })
    useHomeStore.setState({ selectedConversationId: 'conversation-1' })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  async function renderCommands(source = createComposition()) {
    await act(async () => {
      root.render(
        <PlatformProvider composition={source.composition}>
          <MemoryRouter initialEntries={['/search']}>
            <ApplicationCommandProvider>
              <CommandProbe />
            </ApplicationCommandProvider>
          </MemoryRouter>
        </PlatformProvider>,
      )
    })
    return source
  }

  it('uses Renderer keyboard shortcuts on Web without touching Desktop state', async () => {
    const toggleWeb = vi.fn(originalToggleSidebar)
    const toggleDesktop = vi.fn(originalToggleDesktopSidebar)
    useUIStore.setState({
      toggleSidebar: toggleWeb,
      toggleDesktopSidebar: toggleDesktop,
    })
    await renderCommands(createComposition(PlatformKind.WEB, false))

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          ctrlKey: true,
          key: 'b',
        }),
      )
    })

    expect(toggleWeb).toHaveBeenCalledOnce()
    expect(toggleDesktop).not.toHaveBeenCalled()
  })

  it('routes toolbar, native accelerators, and palette through one handler once', async () => {
    const toggle = vi.fn(originalToggleDesktopSidebar)
    useUIStore.setState({ toggleDesktopSidebar: toggle })
    const source = await renderCommands()

    await act(async () => {
      container.querySelector<HTMLButtonElement>('#toolbar-toggle')?.click()
    })
    await act(async () => source.emit(ProductCommandId.TOGGLE_SIDEBAR))
    await act(async () => {
      container.querySelector<HTMLButtonElement>('#palette-trigger')?.click()
    })
    const paletteItem = Array.from(
      document.querySelectorAll<HTMLElement>('[cmdk-item]'),
    ).find((item) =>
      item.getAttribute('data-value')?.includes('view.sidebar.toggle'),
    )
    await act(async () => paletteItem?.click())

    expect(toggle).toHaveBeenCalledTimes(3)
  })

  it('lets the Desktop native menu own accelerators without a second Renderer execution', async () => {
    const toggle = vi.fn(originalToggleDesktopSidebar)
    useUIStore.setState({ toggleDesktopSidebar: toggle })
    const source = await renderCommands()

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          ctrlKey: true,
          key: 'b',
        }),
      )
    })
    expect(toggle).not.toHaveBeenCalled()

    await act(async () => source.emit(ProductCommandId.TOGGLE_SIDEBAR))
    expect(toggle).toHaveBeenCalledOnce()
  })

  it('supports palette search, keyboard execution, Escape, and focus restore', async () => {
    await renderCommands()
    const trigger =
      container.querySelector<HTMLButtonElement>('#palette-trigger')
    trigger?.focus()

    await act(async () => trigger?.click())
    const input = document.querySelector<HTMLInputElement>('[cmdk-input]')
    expect(document.activeElement).toBe(input)
    const selectedBefore = document
      .querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]')
      ?.getAttribute('data-value')

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }),
      )
    })
    const selectedAfter = document
      .querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]')
      ?.getAttribute('data-value')
    expect(selectedAfter).not.toBe(selectedBefore)

    await act(async () => {
      if (!input) return
      input.value = 'settings'
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const settingsItem = Array.from(
      document.querySelectorAll<HTMLElement>('[cmdk-item]'),
    ).find((item) =>
      item.getAttribute('data-value')?.includes('navigation.settings'),
    )
    settingsItem?.focus()
    await act(async () => {
      settingsItem?.click()
    })
    expect(
      container.querySelector('[data-testid="location"]')?.textContent,
    ).toBe('/settings')

    await act(async () => trigger?.click())
    const reopenedInput =
      document.querySelector<HTMLInputElement>('[cmdk-input]')
    await act(async () => {
      reopenedInput?.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      )
    })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('starts a real Conversation reset and navigates Home without creating a Run', async () => {
    await renderCommands()
    await act(async () => {
      container.querySelector<HTMLButtonElement>('#new-conversation')?.click()
    })

    expect(useHomeStore.getState().selectedConversationId).toBeNull()
    expect(
      container.querySelector('[data-testid="location"]')?.textContent,
    ).toBe(ROUTES.HOME)
    expect('runId' in useHomeStore.getState()).toBe(false)
  })
})
