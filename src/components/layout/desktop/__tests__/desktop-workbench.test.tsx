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
  static instances = new Set<TestResizeObserver>()
  targets = new Set<Element>()
  constructor(private callback: ResizeObserverCallback) {
    TestResizeObserver.instances.add(this)
  }
  disconnect = () => {
    TestResizeObserver.instances.delete(this)
  }
  observe = (target: Element) => {
    this.targets.add(target)
  }
  unobserve = (target: Element) => {
    this.targets.delete(target)
  }
  static notify() {
    for (const observer of TestResizeObserver.instances) {
      observer.callback(
        [...observer.targets].map((target) => {
          const rect = target.getBoundingClientRect()
          const size = [{ inlineSize: rect.width, blockSize: rect.height }]
          return {
            target,
            contentRect: rect,
            borderBoxSize: size,
            contentBoxSize: size,
            devicePixelContentBoxSize: size,
          }
        }),
        observer,
      )
    }
  }
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
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        if (this.hasAttribute('data-separator')) return 1
        if (this.hasAttribute('data-panel')) {
          return (
            (959 *
              Number(this.style.flexGrow || parseFloat(this.style.flexBasis))) /
            100
          )
        }
        return 960
      },
    )
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
      function (this: HTMLElement) {
        if (
          this.hasAttribute('data-separator') ||
          this.id === 'desktop-main-workspace'
        ) {
          return (
            this.parentElement?.querySelector<HTMLElement>(
              '#desktop-context-panel',
            )?.offsetWidth ?? 0
          )
        }
        return 0
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const context = this.parentElement?.querySelector<HTMLElement>(
          '#desktop-context-panel',
        )
        const left =
          this.hasAttribute('data-separator') ||
          this.id === 'desktop-main-workspace'
            ? (context?.offsetWidth ?? 0)
            : 0
        return new DOMRect(left, 0, this.offsetWidth, 720)
      },
    )
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
    vi.restoreAllMocks()
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
      container.querySelector<HTMLElement>('#desktop-context-panel')?.style
        .flexGrow,
    ).toBe('0')
    expect(
      container.querySelector('[data-separator]')?.getAttribute('aria-hidden'),
    ).toBe('true')
    expect(mounts).toHaveBeenCalledOnce()

    await act(async () => {
      useUIStore.getState().setDesktopSidebarCollapsed(false)
    })

    expect(
      container.querySelector<HTMLElement>('#desktop-context-panel')?.style
        .flexGrow,
    ).toBe('27')
    expect(
      container.querySelector('[data-separator]')?.getAttribute('aria-hidden'),
    ).toBe('false')
    expect(mounts).toHaveBeenCalledOnce()

    const separator = container.querySelector<HTMLElement>('[data-separator]')!
    expect(separator.tabIndex).toBe(0)
    await act(async () => {
      separator.focus()
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      )
    })
    expect(document.activeElement).toBe(separator)
    await act(async () => TestResizeObserver.notify())
    expect(useUIStore.getState().desktopSidebarWidth).toBe(30)
    expect(
      JSON.parse(window.localStorage.getItem('ui-storage')!).state
        .desktopSidebarWidth,
    ).toBe(30)
    expect(mounts).toHaveBeenCalledOnce()
  })
})
