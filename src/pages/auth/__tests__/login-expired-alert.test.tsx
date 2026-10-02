// @vitest-environment jsdom
import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LoginForm } from '../components/login-form'
vi.mock('@/stores/auth', () => ({
  useAuthStore: (select: (value: unknown) => unknown) =>
    select({ login: vi.fn(), isLoading: false }),
}))
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))
let root: Root
let container: HTMLDivElement
let path = ''
let navigate: ReturnType<typeof useNavigate>
function Probe() {
  const location = useLocation()
  const nextNavigate = useNavigate()
  useLayoutEffect(() => {
    navigate = nextNavigate
    path = location.search
  }, [nextNavigate, location.search])
  return <LoginForm />
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.useFakeTimers()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
const hasAlert = () => container.textContent?.includes('auth.login.expired')
it('consumes only the expired flag and keeps the alert visible for eight seconds', async () => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/login?expired=true&from=studio']}>
        <Probe />
      </MemoryRouter>,
    ),
  )
  expect(path).toBe('?from=studio')
  expect(hasAlert()).toBe(true)
  await act(async () => vi.advanceTimersByTime(7999))
  expect(hasAlert()).toBe(true)
  await act(async () => vi.advanceTimersByTime(1))
  expect(hasAlert()).toBe(false)
})
it('opens the alert for a later expiration after the first notice has closed', async () => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/login?expired=true']}>
        <Probe />
      </MemoryRouter>,
    ),
  )
  await act(async () => vi.advanceTimersByTime(8000))
  await act(async () => navigate('/login?expired=true&from=again'))
  expect(path).toBe('?from=again')
  expect(hasAlert()).toBe(true)
})
