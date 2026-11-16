import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { useTeamStore } from '@/stores/team'
import { useCollectionViewStore } from '@/stores/collection-view'
import { useAuthStore } from '@/stores'
import type { JoinedTeam, TeamMember } from '@/types/team'
import { TeamPage } from '../TeamPage'

const api = vi.hoisted(() => ({
  members: [] as unknown[],
  joined: [] as unknown[],
  remove: vi.fn(),
  accept: vi.fn(),
}))
vi.mock('@/hooks/use-team-request', () => ({
  useFetchTenantInfo: () => ({
    tenantInfo: { tenant_id: 'me', name: 'My team', role: 'owner' },
  }),
  useFetchTeamMembers: () => ({
    members: api.members,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useFetchJoinedTeams: () => ({ joinedTeams: api.joined, isLoading: false }),
  useBatchInviteMembers: () => ({ batchInvite: vi.fn(), isLoading: false }),
  useUpdateMemberRole: () => ({ updateRole: vi.fn(), isLoading: false }),
  useRemoveMember: () => ({ removeMember: api.remove, isLoading: false }),
  useAcceptInvitation: () => ({
    acceptInvitation: api.accept,
    isLoading: false,
  }),
  useRejectInvitation: () => ({ rejectInvitation: vi.fn(), isLoading: false }),
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const members = [
  {
    id: '1',
    user_id: 'me',
    nickname: 'Owner One',
    email: 'owner@example.com',
    avatar: null,
    role: 'owner',
    status: 1,
    update_date: '2026-11-01T10:00:00Z',
    delta_seconds: 60,
  },
  {
    id: '2',
    user_id: 'u2',
    nickname: 'Admin Two',
    email: 'admin@example.com',
    avatar: null,
    role: 'admin',
    status: 1,
    update_date: '2026-11-02T10:00:00Z',
    delta_seconds: 60,
  },
  {
    id: '3',
    user_id: 'u3',
    nickname: 'Guest Three',
    email: 'guest@example.com',
    avatar: null,
    role: 'invite',
    status: 1,
    update_date: '2026-11-03T10:00:00Z',
    delta_seconds: 60,
  },
] as unknown as TeamMember[]
const joined = [
  {
    tenant_id: 't1',
    nickname: 'Research',
    email: 'lead@example.com',
    avatar: null,
    role: 'invite',
    update_date: '2026-11-03T10:00:00Z',
    delta_seconds: 60,
  },
] as unknown as JoinedTeam[]
let root: Root
let container: HTMLDivElement
const button = (text: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent?.trim() === text,
  )

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  api.members = members
  api.joined = joined
  api.remove.mockResolvedValue(true)
  api.accept.mockResolvedValue(true)
  useTeamStore.getState().reset()
  useCollectionViewStore.getState().reset()
  useAuthStore.setState({ user: { id: 'me' } } as never)
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

it('titles the page, uses two tabs and inline totals instead of stat cards', async () => {
  await act(async () => root.render(<TeamPage />))
  const header = container.querySelector('[data-slot="page-title-bar"]')!
  expect(header.querySelector('h1')?.textContent).toBe('Team')
  expect(header.textContent).toContain('Members: 3')
  const stats = header.querySelector('[data-slot="inline-stats"]')!
  expect(stats.textContent).toContain('Admins1')
  expect(stats.textContent).toContain('Pending invitations1')
  expect(container.querySelectorAll('[role="tab"]')).toHaveLength(2)
  expect(button('Invite members', header)).toBeTruthy()
  // A small team opens as cards, ending in an invite card.
  const cards = container.querySelectorAll('[data-slot="resource-card"]')
  expect(cards).toHaveLength(3)
  expect(container.textContent).toContain('Owner One (you)')
  expect(
    container.querySelector('[data-slot="resource-grid"] [style]'),
  ).toBeNull()
  const invite = container.querySelector<HTMLButtonElement>(
    '[data-slot="resource-create-card"] button',
  )!
  expect(invite.textContent).toContain('Invite members')
  await act(async () => invite.click())
  expect(useTeamStore.getState().inviteDialogOpen).toBe(true)
})

it('keeps rows for members once the list view is chosen', async () => {
  useCollectionViewStore.getState().choose('team-members', 'list')
  await act(async () => root.render(<TeamPage />))
  const rows = container.querySelectorAll('[data-slot="resource-row"]')
  expect(rows).toHaveLength(3)
  expect(
    container.querySelector('[data-slot="resource-list"] [style]'),
  ).toBeNull()
})

it('removes a member through the shared confirm dialog', async () => {
  await act(async () => root.render(<TeamPage />))
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Member actions for Admin Two"]',
  )!
  await act(async () => {
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
  const item = [
    ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ].find((element) => element.textContent === 'Remove member')!
  await act(async () => item.click())
  const dialog = document.querySelector('[role="alertdialog"]')!
  expect(dialog.textContent).toContain('Admin Two')
  await act(async () => button('Remove', dialog)!.click())
  expect(api.remove).toHaveBeenCalledWith({ tenantId: 'me', userId: 'u2' })
})

it('accepts a pending team invitation from the joined teams tab', async () => {
  useTeamStore.setState({ activeTab: 'joined-teams' })
  await act(async () => root.render(<TeamPage />))
  const header = container.querySelector('[data-slot="page-title-bar"]')!
  expect(header.textContent).toContain('Teams: 1')
  expect(button('Invite members', header)).toBeUndefined()
  const card = container.querySelector('[data-slot="resource-card"]')!
  expect(card.textContent).toContain('Research')
  expect(card.textContent).toContain('Pending')
  expect(
    card.querySelector('[data-slot="entity-avatar-badge-anchor"]'),
  ).not.toBeNull()
  await act(async () => button('Accept invitation', card)!.click())
  expect(api.accept).toHaveBeenCalledWith('t1')
})

it('moves the invite action into the empty member list', async () => {
  api.members = []
  await act(async () => root.render(<TeamPage />))
  const header = container.querySelector('[data-slot="page-title-bar"]')!
  expect(button('Invite members', header)).toBeUndefined()
  expect(container.textContent).toContain('No team members yet')
  expect(button('Invite members', container)).toBeTruthy()
})
