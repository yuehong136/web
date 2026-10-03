// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/app-shell'
import {
  SettingsLayout,
  SettingsIndexRedirect,
} from '@/pages/settings/SettingsLayout'
import { useUIStore, useAuthStore } from '@/stores'
import { ManagedSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { MemoryDetailLayout } from '@/pages/memory/MemoryDetailLayout'
import { ExploreSidebar } from '@/pages/explore/components/explore-sidebar'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/locales/i18n'
import { ModelProviderCard } from '@/pages/settings/model-providers/components/model-provider-card'
import { AvailableModels } from '@/pages/settings/model-providers/components/available-models'

vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({ myLLMs: {} }),
  useFetchFactories: () => ({
    factories: [{ id: 'provider', name: 'Example provider', tags: 'LLM' }],
  }),
}))

vi.mock('@/hooks/use-pending-team-invitations', () => ({
  usePendingTeamInvitations: () => ({ pendingCount: 0 }),
}))
vi.mock('@/components/layout/SidebarConversations', () => ({
  SidebarConversations: () => null,
}))
vi.mock('@ant-design/x', () => ({ Conversations: () => <div /> }))
vi.mock('@/hooks/use-memory', () => ({
  useMemoryDetail: () => ({
    data: { id: 'memory-one', name: 'Session memory', storage_type: 'table' },
    isLoading: false,
  }),
}))
let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: true }),
  )
  useUIStore.setState({
    sidebarCollapsed: false,
    contextSidebarCollapsed: false,
  })
  useAuthStore.setState({
    user: { nickname: 'Admin', email: 'admin@example.com' } as never,
    isAuthenticated: true,
  })
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})
const render = async (returnTo: string, pathname = '/settings/mcp-servers') => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AppShell>
            <Outlet />
          </AppShell>
        ),
        children: [
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <SettingsIndexRedirect /> },
              { path: 'mcp-servers', element: <p>MCP servers content</p> },
              { path: 'mcp-tools', element: <p>MCP tools content</p> },
              { path: 'mcp-test', element: <p>MCP test content</p> },
              { path: 'mcp-batch', element: <p>MCP batch content</p> },
              { path: 'profile', element: <p>Profile page</p> },
              { path: 'datasource-detail', element: <h1>Source entity</h1> },
            ],
          },
          { path: 'agent', element: <h1>Agent workspace</h1> },
          { path: 'home', element: <h1>Home workspace</h1> },
          {
            path: 'explore',
            element: (
              <ManagedSecondaryNavigation
                section="explore"
                title="Explore conversations"
                fallbackClassName="w-72"
              >
                <nav aria-label="Conversations">
                  <button>New conversation</button>
                </nav>
              </ManagedSecondaryNavigation>
            ),
          },
          {
            path: 'memory/:id',
            element: <MemoryDetailLayout />,
            children: [
              { index: true, element: <h1>Memory messages</h1> },
              { path: 'settings', element: <h1>Memory configuration</h1> },
            ],
          },
        ],
      },
    ],
    {
      initialEntries: [{ pathname, state: { returnTo } }],
    },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  return router
}
const click = (element: HTMLElement) => act(async () => element.click())
const button = (name: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!
const openMenu = async (trigger: HTMLElement) => {
  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

it('keeps a fixed primary rail, collapses only the secondary panel, and restores the originating workspace', async () => {
  const router = await render('/agent')
  expect(
    container.querySelectorAll('[data-primary-navigation] nav a'),
  ).toHaveLength(4)
  expect(container.querySelectorAll('nav[aria-label="Settings"]')).toHaveLength(
    1,
  )
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(
    container
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('false')
  await click(
    container.querySelector<HTMLElement>('a[href="/settings/profile"]')!,
  )
  expect(container.querySelector('h1')?.textContent).toBe('Profile')
  await click(button('Collapse secondary navigation'))
  expect(
    container.querySelectorAll('[data-primary-navigation] nav a'),
  ).toHaveLength(4)
  expect(
    container
      .querySelector('[data-secondary-panel]')
      ?.getAttribute('data-collapsed'),
  ).toBe('true')
  await click(button('Expand secondary navigation'))
  await click(container.querySelector<HTMLElement>('a[href="/agent"]')!)
  expect(router.state.location.pathname).toBe('/agent')
  expect(container.querySelector('[data-primary-navigation]')).toBeTruthy()
  expect(useUIStore.getState().sidebarCollapsed).toBe(false)
})

it('keeps one precise settings heading in the top bar through route, locale, and navigation changes', async () => {
  const router = await render('/home')
  const title = () => container.querySelector('header h1')?.textContent
  expect(title()).toBe('MCP servers')
  expect(
    container.querySelectorAll('nav[aria-label="breadcrumb"]'),
  ).toHaveLength(1)
  await click(button('Collapse secondary navigation'))
  expect(title()).toBe('MCP servers')
  for (const [route, expected] of [
    ['mcp-tools', 'MCP tools'],
    ['mcp-tools/', 'MCP tools'],
    ['mcp-test', 'MCP test'],
    ['mcp-test/', 'MCP test'],
    ['mcp-batch', 'MCP batch'],
    ['mcp-batch/', 'MCP batch'],
  ]) {
    await act(async () => router.navigate(`/settings/${route}`))
    expect(title()).toBe(expected)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(
      container.querySelector('header a[href="/settings/mcp-servers"]'),
    ).toBeTruthy()
  }
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(title()).toBe('MCP 批处理')
  await act(async () => router.navigate('/home'))
  expect(container.querySelector('header h1')).toBeNull()
  expect(container.querySelector('h1')?.textContent).toBe('Home workspace')
})

it('leaves the entity heading to data source details and keeps a parent breadcrumb', async () => {
  const router = await render('/home', '/settings/datasource-detail')
  await act(async () => router.navigate('/settings/datasource-detail/'))
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('h1')?.textContent).toBe('Source entity')
  expect(
    container.querySelector('header a[href="/settings/datasource"]'),
  ).toBeTruthy()
  expect(
    container.querySelector('header [aria-current="page"]')?.textContent,
  ).toBe(i18n.t('datasource.configuration'))
})

it('defaults Settings to Profile, preserves its return location, and orders account before workspace and administration', async () => {
  const router = await render('/agent', '/settings')
  expect(router.state.location.pathname).toBe('/settings/profile')
  expect(router.state.location.state).toEqual({ returnTo: '/agent' })
  const links = Array.from(
    container.querySelectorAll('nav[aria-label="Settings"] a'),
  ).map((a) => a.textContent)
  expect(links).toEqual([
    'Profile',
    'Team',
    'Model providers',
    'Data sources',
    'MCP',
    'Channels',
    'API',
    'User management',
    'System status',
  ])
})

it('rejects an external return location when entering Settings', async () => {
  await render('//example.com', '/settings')
  expect(
    container.querySelector('[data-secondary-panel] a[href="/home"]')
      ?.textContent,
  ).toContain('Back to workspace')
})

it('offers one Settings entry in the account menu and puts appearance in a keyboard accessible submenu', async () => {
  const router = await render('/agent', '/home')
  await openMenu(button('Account menu for Admin'))
  const items = Array.from(document.querySelectorAll('[role="menuitem"]'))
  expect(items.some((item) => item.textContent === 'Profile')).toBe(false)
  expect(items.map((item) => item.textContent)).toContain(
    'Appearance and language',
  )
  const preferences = items.find(
    (item) => item.textContent === 'Appearance and language',
  )!
  await act(async () => {
    ;(preferences as HTMLElement).focus()
    preferences.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  expect(
    Array.from(document.querySelectorAll('[role="menuitemradio"]')).map(
      (item) => item.textContent,
    ),
  ).toEqual(['Light', 'Dark', 'System', '简体中文', 'English'])
  await act(async () =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  await openMenu(button('Account menu for Admin'))
  await click(
    document.querySelector<HTMLElement>('[role="menuitem"][href="/settings"]')!,
  )
  expect(router.state.location.pathname).toBe('/settings/profile')
  expect(router.state.location.state).toEqual({ returnTo: '/home' })
})

it('closes the mobile drawer after selecting a route and restores its toggle focus', async () => {
  const router = await render('/home', '/settings')
  await click(button('Open navigation'))
  const drawer = document.querySelector<HTMLElement>('[role="dialog"]')!
  expect(drawer.querySelector('nav[aria-label="Settings"]')).toBeTruthy()
  await click(
    drawer.querySelector<HTMLAnchorElement>('a[href="/settings/mcp-servers"]')!,
  )
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  expect(router.state.location.pathname).toBe('/settings/mcp-servers')
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(button('Open navigation'))
})

it('preserves detail route parameters when memory navigation is rendered outside the page outlet', async () => {
  const router = await render('/home', '/memory/memory-one')
  const panel = container.querySelector('[data-secondary-panel]')!
  expect(panel.querySelector('nav[aria-label="Session memory"]')).toBeTruthy()
  const settings = panel.querySelector<HTMLAnchorElement>(
    'a[href="/memory/memory-one/settings"]',
  )!
  expect(settings).toBeTruthy()
  await click(settings)
  expect(router.state.location.pathname).toBe('/memory/memory-one/settings')
  expect(container.querySelector('h1')?.textContent).toBe(
    'Memory configuration',
  )
  expect(
    container.querySelectorAll('nav[aria-label="Session memory"]'),
  ).toHaveLength(1)
})

it('keeps secondary destinations in More and routes feature navigation into the shared panel', async () => {
  const router = await render('/home')
  await openMenu(button('More'))
  expect(
    Array.from(document.querySelectorAll('[role="menuitem"]')).map(
      (item) => item.textContent,
    ),
  ).toEqual(['Search', 'Memory', 'Studio', 'Tools', 'MCP'])
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await router.navigate('/explore')
  })
  expect(
    container.querySelector(
      '[data-secondary-panel] nav[aria-label="Conversations"]',
    ),
  ).toBeTruthy()
  expect(
    container.querySelectorAll('nav[aria-label="Conversations"]'),
  ).toHaveLength(1)
  await click(button('Collapse secondary navigation'))
  expect(container.querySelector('nav[aria-label="Conversations"]')).toBeNull()
})

it('keeps the Explore rename dialog alive when only its secondary navigation is collapsed', async () => {
  const close = vi.fn()
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/explore']}>
        <AppShell>
          <ExploreSidebar
            activeTab="topics"
            mode="chat"
            selectedApp="fixture"
            dialogApps={[]}
            dialogAppsLoading={false}
            dialogAppsError={null}
            dialogConversations={[]}
            dialogConversationsLoading={false}
            dialogConversationsError={null}
            renamingConversationId="conversation-one"
            newConversationName="Fixture conversation"
            t={i18n.t.bind(i18n)}
            onTabChange={vi.fn()}
            onTopicsClick={vi.fn()}
            onDiscoverClick={vi.fn()}
            onAppSelect={vi.fn()}
            onCreateConversation={vi.fn()}
            onConversationSelect={vi.fn()}
            onRenameConversation={vi.fn()}
            onDeleteConversation={vi.fn().mockResolvedValue(undefined)}
            onConfirmRenameConversation={vi.fn()}
            onNewConversationNameChange={vi.fn()}
            onCloseRenameConversation={close}
          />
        </AppShell>
      </MemoryRouter>,
    ),
  )
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
  expect(dialog.textContent).toContain(
    i18n.t('explore.conversations.renameTitle'),
  )
  await act(async () => useUIStore.getState().setSidebarCollapsed(true))
  expect(document.querySelector('[role="dialog"]')).toBe(dialog)
  const cancel = Array.from(
    dialog.querySelectorAll<HTMLButtonElement>('button'),
  ).find((element) => element.textContent === 'Cancel')!
  await click(cancel)
  expect(close).toHaveBeenCalledOnce()
})

it('makes provider expansion a named native button and keeps configuration actions independent', async () => {
  const configure = vi.fn()
  await act(async () =>
    root.render(
      <ModelProviderCard
        name="Example provider"
        tags="LLM"
        llm={[{ name: 'example-model', type: 'chat', used_token: 0 }]}
        onApiKeyClick={configure}
        onDeleteClick={vi.fn()}
      />,
    ),
  )
  const toggle = container.querySelector<HTMLButtonElement>('h3 button')!
  expect(toggle.textContent).toContain('Example provider')
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(toggle.tabIndex).toBe(0)
  await click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(container.textContent).toContain('example-model')
  const apiButton = Array.from(
    container.querySelectorAll<HTMLButtonElement>('button'),
  ).find((element) => element.textContent === 'API-Key')!
  await click(apiButton)
  expect(configure).toHaveBeenCalledExactlyOnceWith('Example provider')
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
})

it('adds a model provider through an explicit accessible action', async () => {
  const add = vi.fn()
  await act(async () => root.render(<AvailableModels handleAddModel={add} />))
  expect(container.textContent).toContain('Available providers')
  const action = Array.from(
    container.querySelectorAll<HTMLButtonElement>('button'),
  ).find((element) => element.textContent === 'Add')!
  expect(action).toBeTruthy()
  await click(action)
  expect(add).toHaveBeenCalledExactlyOnceWith('Example provider')
})
