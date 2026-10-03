// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProfilePage } from '@/pages/settings/profile'
import { useAuthStore } from '@/stores/auth'
import i18n from '@/locales/i18n'
import type { UserProfile } from '@/types/api'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/api/auth', () => ({
  authAPI: { getUserProfile: mocks.get, updateUserSettings: mocks.update },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))
let root: Root
let container: HTMLDivElement
let client: QueryClient
let profile: UserProfile
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30))
  })
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent === text,
  )!
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
  await settle()
}
const change = async (input: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  )
  profile = {
    id: 'fixture',
    nickname: 'Admin',
    email: 'admin@example.com',
    avatar: '',
    timezone: 'UTC+8\tAsia/Shanghai',
  } as UserProfile
  mocks.get.mockImplementation(async () => profile)
  mocks.update.mockResolvedValue({ retcode: 0, data: true })
  useAuthStore.setState({
    user: {
      id: 'fixture',
      nickname: 'Admin',
      email: 'admin@example.com',
    } as never,
    isAuthenticated: true,
  })
  await i18n.changeLanguage('en-US')
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
const render = async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await settle()
}
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.unstubAllGlobals()
})

it('shows account details once in their intended order and translates the full view', async () => {
  await render()
  expect(
    Array.from(container.querySelectorAll('dt')).map(
      (element) => element.textContent,
    ),
  ).toEqual([
    'Avatar',
    'Display name',
    'Sign-in email',
    'Time zone',
    'Password',
  ])
  expect(container.textContent?.split('admin@example.com')).toHaveLength(2)
  expect(container.querySelectorAll('h1')).toHaveLength(0)
  expect(
    container
      .querySelector('h2')
      ?.parentElement?.contains(button('Edit profile')),
  ).toBe(true)
  expect(
    Array.from(container.querySelectorAll('h2')).map(
      (element) => element.textContent,
    ),
  ).toEqual(['Account details', 'Account security'])
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(container.querySelector('h2')?.textContent).toBe('账户资料')
  expect(
    Array.from(container.querySelectorAll('dt')).map(
      (element) => element.textContent,
    ),
  ).toEqual(['头像', '显示名称', '登录邮箱', '时区', '密码'])
})

it('validates edits without submitting and restores the saved data and trigger focus on cancel', async () => {
  await render()
  await click(button('Edit profile'))
  const name = container.querySelector<HTMLInputElement>(
    'input[aria-label="Display name"]',
  )!
  await change(name, '')
  await click(button('Save changes'))
  expect(mocks.update).not.toHaveBeenCalled()
  expect(container.textContent).toContain('Enter a display name.')
  await change(name, 'Unsaved draft')
  await click(button('Cancel'))
  expect(container.textContent).not.toContain('Unsaved draft')
  expect(document.activeElement).toBe(button('Edit profile'))
  await click(button('Edit profile'))
  expect(
    container.querySelector<HTMLInputElement>(
      'input[aria-label="Display name"]',
    )?.value,
  ).toBe('Admin')
})

it('retains a draft after business failure, then saves the correct payload and reads the updated profile', async () => {
  await render()
  await click(button('Edit profile'))
  await change(
    container.querySelector<HTMLInputElement>(
      'input[aria-label="Display name"]',
    )!,
    'New name',
  )
  mocks.update.mockResolvedValueOnce({ retcode: 100, data: false })
  await click(button('Save changes'))
  expect(
    container.querySelector<HTMLInputElement>(
      'input[aria-label="Display name"]',
    )?.value,
  ).toBe('New name')
  expect(mocks.error).toHaveBeenCalledWith(
    'Could not save your profile. Please try again.',
  )
  mocks.update.mockImplementationOnce(async () => {
    profile = { ...profile, nickname: 'New name' }
    return { retcode: 0, data: true }
  })
  await click(button('Save changes'))
  expect(mocks.update).toHaveBeenLastCalledWith({
    nickname: 'New name',
    timezone: 'UTC+8\tAsia/Shanghai',
    avatar: '',
  })
  expect(mocks.get).toHaveBeenCalledTimes(2)
  expect(container.textContent).toContain('New name')
  expect(useAuthStore.getState().user?.nickname).toBe('New name')
  expect(document.activeElement).toBe(button('Edit profile'))
})

it('validates the native password dialog and closes with Escape back to its trigger', async () => {
  await render()
  const trigger = button('Change password')
  trigger.focus()
  await click(trigger)
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
  expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
  expect(dialog.querySelectorAll('input[type="password"]')).toHaveLength(3)
  expect(
    dialog.querySelector('button[aria-label="Show Current password"]'),
  ).toBeTruthy()
  await click(button('Save password'))
  expect(mocks.update).not.toHaveBeenCalled()
  expect(dialog.textContent).toContain('Enter your current password.')
  await act(async () =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  await settle()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})

it('shows a retry state instead of an editable empty profile when loading fails', async () => {
  mocks.get.mockRejectedValueOnce(new Error('Fixture transport failure'))
  await render()
  expect(container.textContent).toContain('Could not load your profile')
  expect(button('Edit profile')).toBeUndefined()
  await click(button('Retry'))
  expect(button('Edit profile')).toBeTruthy()
  expect(container.textContent).toContain('admin@example.com')
})
