import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { StudioPage } from '../StudioPage'
import { useStudioStore } from '@/stores/studio'
import { changeLanguage } from '@/locales/i18n'
import { DEFAULT_APPEARANCE, setAppearance } from '@/themes/appearance'
import type { DialogApp } from '@/types/api'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
const api = vi.hoisted(() => ({
  list: vi.fn(),
  bulkDeleteChats: vi.fn(),
  exportTemplates: vi.fn(),
  createChat: vi.fn(),
  updateChat: vi.fn(),
  importTemplates: vi.fn(),
}))
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock('@/api/dialog', () => ({ dialogAPI: api }))
vi.mock('@/lib/toast', () => ({ toast }))
const apps = [
  {
    id: 'one',
    name: 'Alpha',
    description: 'First app',
    status: '1',
    icon: '',
    kb_ids: ['kb'],
    update_time: 1000,
    update_date: '1970-01-01T00:00:01Z',
  },
  {
    id: 'two',
    name: 'Beta',
    description: 'Second app',
    status: '0',
    icon: '',
    kb_ids: [],
    update_time: 2000,
    update_date: '1970-01-01T00:00:02Z',
  },
] as DialogApp[]
let root: Root
let container: HTMLDivElement
let client: QueryClient
let nativeDialog: ReturnType<typeof stubNativeDialog>
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
const click = (element: HTMLElement) => act(async () => element.click())
const button = (text: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent === text,
  )!
const labelled = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
/** Radix menus open from the keyboard in jsdom (no pointer events). */
const openMenu = (trigger: HTMLElement) =>
  act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
const menuItem = (text: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ].find((element) => element.textContent?.trim() === text)!
const closeMenu = () =>
  act(async () =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
async function render() {
  const router = createMemoryRouter(
    [
      { path: '/studio', element: <StudioPage /> },
      { path: '/studio/create-app', element: <h1>App editor</h1> },
      { path: '/agents', element: <h1>Agents</h1> },
    ],
    { initialEntries: ['/studio'] },
  )
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )
  await settle()
  return router
}
function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  return act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
beforeEach(async () => {
  nativeDialog = stubNativeDialog()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: false }),
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.clearAllMocks()
  api.list.mockResolvedValue({ dialogs: apps, total: 20 })
  api.bulkDeleteChats.mockResolvedValue(true)
  api.createChat.mockResolvedValue({ ...apps[0], id: 'created' })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  useStudioStore.getState().reset()
  setAppearance({ ...DEFAULT_APPEARANCE, mode: 'light' })
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.unstubAllGlobals()
  nativeDialog.restore()
})

it('uses a real error state and retries without exposing backend content or pretending the list is empty', async () => {
  api.list.mockRejectedValueOnce(new Error('private-response-content'))
  await render()
  expect(container.textContent).toContain('Could not load apps')
  expect(container.textContent).not.toContain('No apps yet')
  expect(container.textContent).not.toContain('private-response-content')
  await click(button('Retry'))
  await settle()
  expect(container.textContent).toContain('Alpha')
  expect(container.textContent).toContain('Apps: 20')
  expect(container.textContent).not.toContain('Recently updated')
})
it('keeps selected IDs through status filters, view, appearance, and locale changes', async () => {
  await render()
  await click(
    container.querySelector<HTMLElement>(
      '[role="checkbox"][aria-label="Select Alpha"]',
    )!,
  )
  expect(container.textContent).toContain('1 selected')
  await openMenu(container.querySelector('[data-filter-key="status"]')!)
  await click(menuItem('Draft'))
  expect(useStudioStore.getState().filter.status).toEqual(['0'])
  expect(menuItem('Draft').getAttribute('aria-checked')).toBe('true')
  expect(container.textContent).not.toContain('Alpha')
  expect(useStudioStore.getState().selectedIds).toEqual(['one'])
  await closeMenu()
  expect(
    container.querySelector('[data-filter-key="status"]')?.textContent,
  ).toBe('StatusDraft')
  await click(labelled('Grid view'))
  expect(useStudioStore.getState().viewMode).toBe('grid')
  await click(labelled('List view'))
  await act(async () => setAppearance({ preset: 'ocean', textScale: 1.25 }))
  await act(async () => changeLanguage('zh-CN'))
  expect(useStudioStore.getState().viewMode).toBe('list')
  expect(useStudioStore.getState().selectedIds).toEqual(['one'])
  await act(async () => useStudioStore.getState().setFilter({ status: [] }))
  expect(
    container
      .querySelector('[role="checkbox"][aria-label="选择 Alpha"]')
      ?.getAttribute('aria-checked'),
  ).toBe('true')
})
it('selects only visible page IDs while preserving selection from another page', async () => {
  useStudioStore.setState({ viewMode: 'list', selectedIds: ['off-page'] })
  await render()
  const selectPage = () =>
    container.querySelector<HTMLElement>(
      '[role="checkbox"][aria-label="Select apps on this page"]',
    )!
  await click(selectPage())
  expect(new Set(useStudioStore.getState().selectedIds)).toEqual(
    new Set(['off-page', 'one', 'two']),
  )
  await click(selectPage())
  expect(useStudioStore.getState().selectedIds).toEqual(['off-page'])
})
it('keeps the destructive confirmation and selection on failure, then clears only deleted IDs after success', async () => {
  useStudioStore.setState({ selectedIds: ['one'] })
  api.bulkDeleteChats.mockRejectedValueOnce(
    new Error('sensitive-delete-detail'),
  )
  await render()
  const toolbar = container.querySelector<HTMLElement>(
    '[role="toolbar"][aria-label="Bulk actions"]',
  )!
  expect(toolbar.textContent).toContain('1 selected')
  await click(button('Delete', toolbar))
  await click(button('Delete', document.querySelector('[role="alertdialog"]')!))
  await settle()
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull()
  expect(useStudioStore.getState().selectedIds).toEqual(['one'])
  expect(toast.error).toHaveBeenCalledExactlyOnceWith(
    'Could not delete the apps. Try again.',
  )
  expect(toast.success).not.toHaveBeenCalled()
  await click(button('Delete', document.querySelector('[role="alertdialog"]')!))
  await settle()
  expect(api.bulkDeleteChats).toHaveBeenNthCalledWith(2, ['one'])
  expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  expect(useStudioStore.getState().selectedIds).toEqual([])
})
it('uses keyboard-selectable project types and navigates through the router', async () => {
  const router = await render()
  await click(button('New project'))
  const radios = document.querySelectorAll<HTMLElement>('[role="radio"]')
  await act(async () => {
    radios[0].focus()
    radios[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
  })
  await settle()
  expect(radios[1].getAttribute('aria-checked')).toBe('true')
  await click(button('Continue'))
  expect(router.state.location.pathname).toBe('/agents')
  expect(router.state.location.search).toBe('?create=1')
})
it('returns focus to the persistent project opener after continuing to Create app and pressing Escape', async () => {
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  const flushFrames = () =>
    act(async () => {
      for (const callback of frames.splice(0)) callback(0)
    })
  await render()
  const origin = button('New project', container)
  origin.focus()
  await click(origin)
  await click(document.querySelector<HTMLElement>('[role="radio"]')!)
  const continueButton = button('Continue')
  continueButton.focus()
  await click(continueButton)
  expect(continueButton.isConnected).toBe(false)
  expect(useStudioStore.getState().createAppModalOpen).toBe(true)
  await flushFrames()
  // Enter the second step as a user would, after the first dialog's cleanup.
  document.querySelector<HTMLInputElement>('input[id$="-name"]')!.focus()
  await act(async () =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    ),
  )
  expect(document.querySelector('dialog')).toBeNull()
  await flushFrames()
  expect(button('New project', container)).toBe(origin)
  expect(document.activeElement).toBe(origin)
  expect(api.createChat).not.toHaveBeenCalled()
})
it('keeps the create-app draft on failure and through theme and locale changes', async () => {
  api.createChat.mockRejectedValueOnce(new Error('private-create-error'))
  await render()
  await act(async () => useStudioStore.getState().openCreateAppModal())
  const name = document.querySelector<HTMLInputElement>('input[id$="-name"]')!
  const description = document.querySelector<HTMLTextAreaElement>('textarea')!
  await type(name, 'Draft app')
  await type(description, 'Useful draft description')
  await click(button('Create app'))
  await settle()
  expect(useStudioStore.getState().createAppModalOpen).toBe(true)
  expect(name.value).toBe('Draft app')
  expect(description.value).toBe('Useful draft description')
  expect(toast.error).toHaveBeenCalledExactlyOnceWith(
    'Could not save the app. Try again.',
  )
  await act(async () => setAppearance({ preset: 'paper', mode: 'dark' }))
  await act(async () => changeLanguage('zh-CN'))
  expect(document.querySelector('input[id$="-name"]')).toBe(name)
  expect(name.value).toBe('Draft app')
  expect(document.body.textContent).not.toContain('private-create-error')
})

it('sorts current-page results and changes their time format through the shared controls', async () => {
  await render()
  const titles = () =>
    [...container.querySelectorAll('button[data-slot="resource-name"]')].map(
      (element) => element.textContent,
    )
  const sortMenu = () =>
    container.querySelector<HTMLElement>('[data-slot="filter-bar-sort"]')!
  expect(titles()).toEqual(['Beta', 'Alpha'])
  expect(sortMenu().getAttribute('aria-label')).toBe('Sort: Newest first')
  await openMenu(sortMenu())
  await click(menuItem('Oldest first'))
  expect(titles()).toEqual(['Alpha', 'Beta'])
  await openMenu(sortMenu())
  expect(menuItem('Detailed time').getAttribute('aria-checked')).toBe('true')
  await click(menuItem('Relative time'))
  expect(useStudioStore.getState().timeFormat).toBe('relative')
})
it('opens an app from its name and keeps per-row actions in the menu', async () => {
  const router = await render()
  await openMenu(labelled('Actions for Alpha'))
  expect(menuItem('Export template')).toBeTruthy()
  await click(menuItem('Export template'))
  expect(api.exportTemplates).toHaveBeenCalledWith(['one'])
  await click(button('Beta', container))
  expect(router.state.location.pathname).toBe('/studio/create-app')
  expect(new URLSearchParams(router.state.location.search).get('id')).toBe(
    'two',
  )
})
it('uses real server page state and disables navigation after the last page', async () => {
  await render()
  expect(container.textContent).toContain('1–12 / 20')
  await click(labelled('Previous'))
  expect(labelled('Previous').disabled).toBe(true)
  await click(labelled('Next'))
  await settle()
  expect(api.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 2, page_size: 12 }),
  )
  expect(labelled('Next').disabled).toBe(true)
  expect(container.textContent).toContain('13–20 / 20')
})
it('changes the server page size from the pager menu and returns to page one', async () => {
  await render()
  await openMenu(button('12 / page', container))
  await click(menuItem('24 / page'))
  await settle()
  expect(api.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1, page_size: 24 }),
  )
})
