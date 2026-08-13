// @vitest-environment jsdom

import React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DesktopWorkbench } from '../desktop-workbench'
import {
  DesktopActivity,
  normalizeDesktopPreferences,
  useUIStore,
} from '@/stores/ui'

class TestResizeObserver implements ResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

vi.mock('../activity-rail', () => ({
  ActivityRail: () => <aside data-testid="activity-rail" />,
}))
vi.mock('../context-panel', () => ({
  DesktopContextPanel: () => <aside data-testid="context-panel" />,
}))
vi.mock('../desktop-toolbar', () => ({
  DesktopToolbar: () => <header data-testid="desktop-toolbar" />,
}))

describe('DesktopWorkbench', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true
    globalThis.ResizeObserver = TestResizeObserver
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      window.setTimeout(() => callback(0), 0)
      return 1
    }
    window.cancelAnimationFrame = vi.fn()
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 960,
    })
    window.localStorage.clear()
    useUIStore.setState({
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      desktopSidebarWidth: 22,
    })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    window.localStorage.clear()
  })

  it('keeps the desktop rail, context panel, and workspace at 960px', async () => {
    await act(async () => {
      root.render(
        <DesktopWorkbench>
          <div data-testid="workspace">workspace</div>
        </DesktopWorkbench>,
      )
    })

    expect(
      container.querySelector('[data-client-runtime="desktop"]'),
    ).not.toBeNull()
    expect(
      container.querySelector('[data-testid="activity-rail"]'),
    ).not.toBeNull()
    expect(
      container.querySelector('[data-testid="context-panel"]'),
    ).not.toBeNull()
    expect(container.querySelector('[data-testid="workspace"]')).not.toBeNull()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('normalizes restored desktop preferences without retaining product data', () => {
    expect(
      normalizeDesktopPreferences({
        desktopActivity: DesktopActivity.BUILD,
        desktopSidebarCollapsed: true,
        desktopSidebarWidth: 27,
        conversation: 'must-not-be-copied',
      }),
    ).toEqual({
      desktopActivity: DesktopActivity.BUILD,
      desktopSidebarCollapsed: true,
      desktopSidebarWidth: 27,
    })
    expect(
      normalizeDesktopPreferences({
        desktopActivity: 'invalid',
        desktopSidebarCollapsed: 'yes',
        desktopSidebarWidth: Number.NaN,
      }),
    ).toEqual({
      desktopActivity: DesktopActivity.WORK,
      desktopSidebarCollapsed: false,
      desktopSidebarWidth: 22,
    })
    expect(
      normalizeDesktopPreferences({ desktopSidebarWidth: 100 }),
    ).toMatchObject({ desktopSidebarWidth: 30 })
    expect(
      normalizeDesktopPreferences({ desktopSidebarWidth: 1 }),
    ).toMatchObject({ desktopSidebarWidth: 16 })
  })

  it('rehydrates collapsed state and restores the persisted panel width', async () => {
    const mounts = vi.fn()
    const WorkspaceProbe = () => {
      React.useEffect(() => {
        mounts()
      }, [])
      return <div data-testid="workspace">workspace</div>
    }

    window.localStorage.setItem(
      'ui-storage',
      JSON.stringify({
        version: 1,
        state: {
          desktopActivity: DesktopActivity.BUILD,
          desktopSidebarCollapsed: true,
          desktopSidebarWidth: 27,
          conversation: 'must-not-be-restored',
        },
      }),
    )

    await act(async () => {
      await useUIStore.persist.rehydrate()
      root.render(
        <DesktopWorkbench>
          <WorkspaceProbe />
        </DesktopWorkbench>,
      )
    })

    expect(useUIStore.getState()).toMatchObject({
      desktopActivity: DesktopActivity.BUILD,
      desktopSidebarCollapsed: true,
      desktopSidebarWidth: 27,
    })
    expect('conversation' in useUIStore.getState()).toBe(false)
    expect(
      container
        .querySelector('[data-panel-id="desktop-context-panel"]')
        ?.getAttribute('data-panel-size'),
    ).toBe('0.0')
    expect(
      container
        .querySelector('[data-panel-resize-handle-id]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true')
    expect(mounts).toHaveBeenCalledOnce()

    await act(async () => {
      useUIStore.getState().setDesktopSidebarCollapsed(false)
    })

    expect(
      container
        .querySelector('[data-panel-id="desktop-context-panel"]')
        ?.getAttribute('data-panel-size'),
    ).toBe('27.0')
    expect(
      container
        .querySelector('[data-panel-resize-handle-id]')
        ?.getAttribute('aria-hidden'),
    ).toBe('false')
    expect(mounts).toHaveBeenCalledOnce()
  })
})
