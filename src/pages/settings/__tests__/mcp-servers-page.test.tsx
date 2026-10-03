// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '@/locales/i18n'
import { MCPServersPage } from '@/pages/settings/MCPServersPage'
import type { MCPServer } from '@/types/mcp'

const mocks = vi.hoisted(() => ({
  servers: [] as MCPServer[],
  remove: vi.fn(),
  testConnection: vi.fn(),
  refetch: vi.fn(),
  copy: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  isError: false,
}))
vi.mock('@/hooks/use-mcp-request', () => ({
  useFetchMCPServers: () => ({
    data: { mcp_servers: mocks.servers },
    isLoading: false,
    isFetching: false,
    isError: mocks.isError,
    refetch: mocks.refetch,
  }),
  useDeleteMCPServer: () => ({ mutateAsync: mocks.remove, isPending: false }),
  useTestMCPConnection: () => ({ mutateAsync: mocks.testConnection }),
  useMCPStats: () => ({
    totalServers: 2,
    activeServers: 2,
    totalTools: 2,
    serverTypes: 2,
    isLoading: false,
  }),
  getServerTools: () => [{ name: 'weather' }],
  hasServerTools: () => true,
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))
vi.mock('@/lib/utils', async (original) => ({
  ...(await original<typeof import('@/lib/utils')>()),
  copyToClipboard: mocks.copy,
}))
vi.mock('@/components/mcp/MCPServerForm', () => ({
  MCPServerForm: ({
    server,
    onCancel,
  }: {
    server?: MCPServer
    onCancel: () => void
  }) => (
    <div>
      <p>{server?.name || 'New server form'}</p>
      <button onClick={onCancel}>Cancel form</button>
    </div>
  ),
}))

let root: Root
let container: HTMLDivElement
const server = (id: string, type: string, created: string): MCPServer =>
  ({
    id,
    name: id,
    server_type: type,
    url: `https://example.com/${id}`,
    create_time: created,
  }) as MCPServer

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  mocks.isError = false
  mocks.servers = [
    server('old-server', 'sse', '2026-01-01'),
    server('new-server', 'streamable-http', '2026-02-01'),
  ]
  mocks.remove.mockResolvedValue(undefined)
  mocks.copy.mockResolvedValue(undefined)
  mocks.testConnection.mockResolvedValue([{ name: 'weather' }])
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <MCPServersPage />
      </MemoryRouter>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
const button = (label: string) =>
  document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const textButton = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent === text,
  )!
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
const openMenu = (name = 'new-server') =>
  act(async () => {
    const trigger = button(`Actions for ${name}`)
    trigger.focus()
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
  })
const menuItem = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(
    (element) => element.textContent === text,
  )!

it('has one page heading, sortable resources, and permanently accessible card actions', async () => {
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('h1')?.textContent).toBe('MCP servers')
  expect(container.querySelector('article h2')?.textContent).toBe('new-server')
  expect(button('Copy URL for new-server')).toBeTruthy()
  expect(button('Test connection to new-server')).toBeTruthy()
  await click(button('Sort by update time'))
  expect(container.querySelector('article h2')?.textContent).toBe('old-server')
  await click(button('Copy URL for new-server'))
  expect(mocks.copy).toHaveBeenCalledWith('https://example.com/new-server')
  await click(button('Test connection to new-server'))
  expect(mocks.testConnection).toHaveBeenCalledWith(
    expect.objectContaining({
      url: 'https://example.com/new-server',
      server_type: 'streamable-http',
    }),
  )
  expect(mocks.refetch).toHaveBeenCalledOnce()
})

it('uses one confirmation for both views, never deletes on menu selection or cancel, and restores focus', async () => {
  const nativeConfirm = vi.spyOn(window, 'confirm')
  await openMenu()
  await click(menuItem('Delete server'))
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain(
    'new-server',
  )
  expect(mocks.remove).not.toHaveBeenCalled()
  await click(textButton('Cancel'))
  expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  expect(document.activeElement).toBe(button('Actions for new-server'))
  expect(mocks.remove).not.toHaveBeenCalled()
  await click(button('Table view'))
  expect(container.querySelector('table')).toBeTruthy()
  await openMenu()
  await click(menuItem('Delete server'))
  await click(textButton('Confirm delete'))
  expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(['new-server'])
  expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  expect(nativeConfirm).not.toHaveBeenCalled()
  nativeConfirm.mockRestore()
})

it('keeps a failed deletion reviewable and retryable', async () => {
  mocks.remove.mockRejectedValueOnce(new Error('failed'))
  await openMenu()
  await click(menuItem('Delete server'))
  await click(textButton('Confirm delete'))
  expect(document.querySelector('[role="alertdialog"]')).toBeTruthy()
  await click(textButton('Confirm delete'))
  expect(mocks.remove).toHaveBeenCalledTimes(2)
  expect(document.querySelector('[role="alertdialog"]')).toBeNull()
})

it('opens native create and edit dialogs and restores the initiating control on cancel', async () => {
  const create = textButton('Create server')
  await click(create)
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    'New server form',
  )
  await click(textButton('Cancel form'))
  expect(document.activeElement).toBe(create)
  await openMenu()
  await click(menuItem('Edit config'))
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    'new-server',
  )
  await click(textButton('Cancel form'))
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(document.activeElement).toBe(button('Actions for new-server'))
})

it('distinguishes query failure from an empty resource list and offers retry', async () => {
  mocks.isError = true
  await act(async () =>
    root.render(
      <MemoryRouter>
        <MCPServersPage />
      </MemoryRouter>,
    ),
  )
  expect(container.textContent).toContain('Unable to load servers')
  expect(container.textContent).not.toContain('No MCP servers yet')
  await click(textButton('Retry'))
  expect(mocks.refetch).toHaveBeenCalledOnce()
})
