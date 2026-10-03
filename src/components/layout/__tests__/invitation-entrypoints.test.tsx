// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SidebarUtilities } from '@/components/layout/sidebar-utilities'
import { AppTopBar } from '@/components/layout/app-top-bar'
import { SettingsLayout } from '@/pages/settings/SettingsLayout'
import { teamAPI } from '@/api/team'
import { teamKeys } from '@/hooks/use-team-request'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useTeamStore } from '@/stores/team'
import { TenantRole, type JoinedTeam } from '@/types/team'
import i18n from '@/locales/i18n'

vi.mock('@/api/team', () => ({ teamAPI: { listJoinedTeams: vi.fn() } }))
vi.mock('@/components/layout/SidebarConversations', () => ({
  SidebarConversations: () => null,
}))

let container: HTMLDivElement
let root: Root
let client: QueryClient
const initialAuth = useAuthStore.getState()
const team = (id: string, role: TenantRole): JoinedTeam => ({
  tenant_id: id,
  role,
  nickname: id,
  email: `${id}@example.com`,
  avatar: null,
  update_date: '2026-10-03',
  delta_seconds: 0,
})
const flush = () => new Promise((resolve) => setTimeout(resolve, 10))

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: true }),
  )
  vi.mocked(teamAPI.listJoinedTeams).mockReset().mockResolvedValue([])
  useAuthStore.setState({
    isAuthenticated: true,
    user: { nickname: 'Admin' } as never,
  })
  useUIStore.setState({ contextSidebarCollapsed: false })
  useTeamStore.getState().setActiveTab('my-team')
  await i18n.changeLanguage('en-US')
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  useAuthStore.setState(initialAuth, true)
  vi.unstubAllGlobals()
})

const render = async (path = '/home') => {
  const router = createMemoryRouter(
    [
      {
        path: '/home',
        element: (
          <>
            <AppTopBar onOpenSidebar={() => {}} />
            <SidebarUtilities collapsed />
          </>
        ),
      },
      {
        path: '/settings',
        element: <SettingsLayout />,
        children: [
          { path: 'profile', element: <p>Profile destination</p> },
          { path: 'team', element: <p>Team destination</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    await flush()
  })
  await act(flush)
  return router
}

const openAccount = async () => {
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Account menu for Admin"]',
  )!
  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    await flush()
  })
}
const invitationItem = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
    (item) => item.textContent?.startsWith('Team invitations'),
  )

it('shows no global bell or empty invitation entry for an ordinary team member', async () => {
  vi.mocked(teamAPI.listJoinedTeams).mockResolvedValue([
    team('joined', TenantRole.Normal),
  ])
  await render()
  expect(container.querySelector('.lucide-bell')).toBeNull()
  await openAccount()
  expect(invitationItem()).toBeUndefined()
  expect(document.querySelector('[aria-label="Notifications"]')).toBeNull()
})

it('opens pending invitations directly and updates the team badge with the shared query', async () => {
  vi.mocked(teamAPI.listJoinedTeams).mockResolvedValue([
    team('one', TenantRole.Invite),
    team('two', TenantRole.Invite),
    team('joined', TenantRole.Normal),
  ])
  const router = await render()
  expect(container.querySelector('[data-pending-invitations="2"]')).toBeTruthy()
  await openAccount()
  expect(invitationItem()?.textContent).toBe('Team invitations2')
  await act(async () => {
    invitationItem()!.click()
    await flush()
  })
  expect(router.state.location.pathname).toBe('/settings/team')
  expect(useTeamStore.getState().activeTab).toBe('joined-teams')
  const link = container.querySelector('a[href="/settings/team"]')!
  expect(
    link.querySelector('[aria-label="2 pending invitations"]')?.textContent,
  ).toBe('2')
  expect(teamAPI.listJoinedTeams).toHaveBeenCalledOnce()
  await act(async () => {
    client.setQueryData(teamKeys.joinedTeams(), [
      team('one', TenantRole.Normal),
    ])
    await flush()
  })
  expect(link.querySelector('[aria-label="2 pending invitations"]')).toBeNull()
  expect(container.querySelector('[data-pending-invitations]')).toBeNull()
  await openAccount()
  expect(invitationItem()).toBeUndefined()
})

it('selects the invitations tab from the settings team link', async () => {
  vi.mocked(teamAPI.listJoinedTeams).mockResolvedValue([
    team('one', TenantRole.Invite),
  ])
  const router = await render('/settings/profile')
  await act(async () =>
    container
      .querySelector<HTMLAnchorElement>('a[href="/settings/team"]')!
      .click(),
  )
  expect(router.state.location.pathname).toBe('/settings/team')
  expect(useTeamStore.getState().activeTab).toBe('joined-teams')
})

it('does not request private team data for unauthenticated visitors', async () => {
  useAuthStore.setState({ isAuthenticated: false, user: null })
  await render()
  expect(teamAPI.listJoinedTeams).not.toHaveBeenCalled()
  expect(container.querySelector('.lucide-bell')).toBeNull()
})

it('keeps unavailable team queries out of the action menu', async () => {
  vi.mocked(teamAPI.listJoinedTeams).mockRejectedValue(
    new Error('private diagnostic'),
  )
  await render()
  await openAccount()
  expect(invitationItem()).toBeUndefined()
  expect(document.body.textContent).not.toContain('private diagnostic')
})
