// @vitest-environment jsdom
import { act, type PropsWithChildren } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '@/locales/i18n'
import { MCPPage } from '@/pages/settings/mcp/mcp-page'
import type { MCPServer } from '@/types/mcp'

const mocks = vi.hoisted(() => ({
  servers: [] as MCPServer[],
  remove: vi.fn(),
  testConnection: vi.fn(),
  previewTest: vi.fn(),
  testTool: vi.fn(),
  exportServers: vi.fn(),
  importServers: vi.fn(),
  fetchTools: vi.fn(),
  refetch: vi.fn(),
  copy: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  isError: false,
}))
vi.mock('@/hooks/use-mcp-request', () => ({
  mcpQueryKeys: { servers: () => ['mcp', 'servers'] },
  useFetchMCPTools: mocks.fetchTools,
  useFetchMCPServers: () => ({
    data: { mcp_servers: mocks.servers },
    isPending: false,
    isFetching: false,
    isError: mocks.isError,
    refetch: mocks.refetch,
  }),
  useDeleteMCPServer: () => ({ mutateAsync: mocks.remove, isPending: false }),
  useTestMCPConnection: () => ({ mutateAsync: mocks.testConnection }),
  useMCPStats: () => ({
    totalServers: 2,
    activeServers: 1,
    totalTools: 1,
    serverTypes: 2,
    isLoading: false,
  }),
  getServerTools: (server: MCPServer) =>
    server.id === 'old-server' ? [{ name: 'weather' }] : [],
}))
vi.mock('@/api/mcp', () => ({
  mcpAPI: {
    testConnection: mocks.previewTest,
    testTool: mocks.testTool,
    export: mocks.exportServers,
    import: mocks.importServers,
  },
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

vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Panel: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Separator: ({ 'aria-label': label }: { 'aria-label': string }) => (
    <hr aria-label={label} />
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
    headers: { Authorization: 'Bearer test' },
    variables: { region: 'eu', tools: { weather: {} } },
  }) as MCPServer

function LocationProbe() {
  const current = useLocation()
  return (
    <output data-testid="location">{`${current.pathname}${current.search}`}</output>
  )
}
const location = () =>
  document.querySelector('[data-testid="location"]')?.textContent

const render = async (path = '/settings/mcp') => {
  const client = new QueryClient()
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/settings/mcp"
              element={
                <>
                  <MCPPage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('matchMedia', () =>
    Object.assign(new EventTarget(), { matches: true }),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.clearAllMocks()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1400,
    height: 900,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1400,
    bottom: 900,
    toJSON() {},
  })
  mocks.isError = false
  mocks.servers = [
    server('old-server', 'sse', '2026-01-01'),
    server('new-server', 'streamable-http', '2026-02-01'),
  ]
  mocks.remove.mockResolvedValue(undefined)
  mocks.copy.mockResolvedValue(undefined)
  mocks.testConnection.mockResolvedValue([{ name: 'weather' }])
  mocks.previewTest.mockResolvedValue([{ name: 'weather', description: '' }])
  mocks.testTool.mockResolvedValue({ content: [], isError: false })
  mocks.exportServers.mockResolvedValue({ mcpServers: { a: { url: 'u' } } })
  mocks.fetchTools.mockReturnValue({
    data: {
      'old-server': [{ name: 'weather', description: 'Current weather' }],
      'new-server': [{ name: 'search', description: 'Web search' }],
    },
    refetch: mocks.refetch,
    isPending: false,
    isError: false,
    isFetching: false,
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
  vi.restoreAllMocks()
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
const rowNames = () =>
  Array.from(
    container.querySelectorAll('table[aria-label="MCP servers"] tbody tr'),
  ).map(
    (row) => row.querySelector('td button:not([role="checkbox"])')?.textContent,
  )
const tab = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).find(
    (element) => element.textContent === name,
  )!
const activate = (element: HTMLElement) =>
  act(async () => {
    element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 0 }),
    )
    element.focus()
  })

it('lists servers in one table with the heading left to the settings shell', async () => {
  await render()
  expect(container.querySelectorAll('h1')).toHaveLength(0)
  expect(rowNames()).toEqual(['new-server', 'old-server'])
  expect(textButton('Create server')).toBeTruthy()
  expect(container.querySelector('a[href="/mcp-chat"]')).toBeTruthy()
  expect(container.textContent).toContain('Ready servers')
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

it('confirms deletion, never deletes on cancel, restores focus and retries failures', async () => {
  const nativeConfirm = vi.spyOn(window, 'confirm')
  mocks.remove.mockRejectedValueOnce(new Error('failed'))
  await render()
  await openMenu()
  await click(menuItem('Delete server'))
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain(
    'new-server',
  )
  await click(textButton('Cancel'))
  expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  expect(document.activeElement).toBe(button('Actions for new-server'))
  expect(mocks.remove).not.toHaveBeenCalled()
  await openMenu()
  await click(menuItem('Delete server'))
  await click(textButton('Confirm delete'))
  expect(document.querySelector('[role="alertdialog"]')).toBeTruthy()
  await click(textButton('Confirm delete'))
  expect(mocks.remove).toHaveBeenLastCalledWith(['new-server'])
  expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  expect(nativeConfirm).not.toHaveBeenCalled()
})

it('opens create and edit forms and restores the initiating control', async () => {
  await render()
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
  expect(document.activeElement).toBe(button('Actions for new-server'))
})

it('distinguishes a failed query from an empty list', async () => {
  mocks.isError = true
  await render()
  expect(container.textContent).toContain('Unable to load servers')
  expect(container.textContent).not.toContain('No MCP servers yet')
  await click(textButton('Retry'))
  expect(mocks.refetch).toHaveBeenCalledOnce()
})

it('opens a server in the side panel with Tools, Batch and Test tabs', async () => {
  await render()
  await click(textButton('new-server'))
  expect(location()).toBe('/settings/mcp?tab=tools&server=new-server')
  expect(
    Array.from(document.querySelectorAll('[role="tab"]')).map(
      (element) => element.textContent,
    ),
  ).toEqual(['Tools', 'Batch', 'Test'])
  expect(mocks.fetchTools).toHaveBeenLastCalledWith(['new-server'], true, 30)
  await click(button('Run search'))
  await click(
    Array.from(
      document.querySelectorAll<HTMLButtonElement>('dialog button'),
    ).find((element) => element.textContent === 'Run')!,
  )
  expect(mocks.testTool).toHaveBeenCalledExactlyOnceWith({
    mcp_id: 'new-server',
    tool_name: 'search',
    arguments: {},
    timeout: 30,
  })
})

it('prefills the connection test from the server and sends seconds', async () => {
  await render('/settings/mcp?tab=test&server=old-server')
  const url = document.querySelector<HTMLInputElement>('#mcp-test-url')!
  expect(url.value).toBe('https://example.com/old-server')
  expect(
    document.querySelector<HTMLInputElement>('#mcp-test-timeout')!.value,
  ).toBe('10')
  await click(textButton('Test connection'))
  expect(mocks.previewTest).toHaveBeenCalledExactlyOnceWith({
    url: 'https://example.com/old-server',
    server_type: 'sse',
    timeout: 10,
    headers: { Authorization: 'Bearer test' },
    variables: { region: 'eu' },
  })
  expect(document.body.textContent).toContain('Connected, 1 tool found')
})

it('exports and deletes the selected servers from the Batch tab', async () => {
  await render('/settings/mcp?tab=batch')
  await click(
    container.querySelector<HTMLElement>('[aria-label="Select old-server"]')!,
  )
  expect(document.body.textContent).toContain('1 server selected')
  await click(textButton('Export'))
  expect(mocks.exportServers).toHaveBeenCalledExactlyOnceWith({
    mcp_ids: ['old-server'],
  })
  expect(
    document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Exported configuration"]',
    )!.value,
  ).toContain('"a"')
  await click(textButton('Delete'))
  expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain(
    'Delete 1 server?',
  )
  await click(
    document.querySelector<HTMLElement>(
      '[role="alertdialog"] button:last-of-type',
    )!,
  )
  expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(['old-server'])
})

it('switches tabs through the URL so the panel can be linked', async () => {
  await render('/settings/mcp?tab=tools')
  expect(mocks.fetchTools).toHaveBeenLastCalledWith(
    ['old-server', 'new-server'],
    true,
    30,
  )
  await activate(tab('Test'))
  expect(location()).toBe('/settings/mcp?tab=test')
  await click(button('Close details'))
  expect(location()).toBe('/settings/mcp')
})
