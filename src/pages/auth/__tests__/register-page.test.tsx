// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PlatformKind, PlatformProvider } from '@/platform'
import type { ApplicationComposition } from '@/platform'
import { setProductLanguage } from '@/locales/i18n'
import { RegisterPage } from '../RegisterPage'

const register = vi.fn()
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ register, isLoading: false }),
}))

const composition: ApplicationComposition = Object.freeze({
  platform: Object.freeze({
    kind: PlatformKind.WEB,
    capabilities: () =>
      Object.freeze({
        desktop: false,
        nativeMenu: false,
        updater: false,
        notifications: false,
        localAgent: false,
        pty: false,
        localMcp: false,
      }),
  }),
  commandSource: Object.freeze({ subscribe: () => () => {} }),
})

let root: Root
let container: HTMLDivElement

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
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await setProductLanguage('en-US')
  register.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <PlatformProvider composition={composition}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </PlatformProvider>,
    ),
  )
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  await setProductLanguage('zh-CN')
})

const click = (text: string) =>
  act(async () =>
    Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === text)!
      .click(),
  )

it('shows a failed sign-up in the card instead of failing silently', async () => {
  register.mockRejectedValue(new Error('Registration is disabled'))
  await click('Next')
  await click('Next')
  expect(container.querySelector('[role="alert"]')).toBeNull()
  await click('Create account')

  expect(register).toHaveBeenCalledOnce()
  const alert = container.querySelector('[data-auth-alert="error"]')!
  expect(alert.getAttribute('role')).toBe('alert')
  expect(alert.textContent).toBe(
    'Could not create the account. Check your details and try again.',
  )
  // The backend's message is never shown.
  expect(container.textContent).not.toContain('Registration is disabled')
})
