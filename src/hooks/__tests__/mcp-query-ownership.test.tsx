// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useFetchMCPServers, useFetchMCPTools } from '../use-mcp-request'
import { mcpAPI } from '@/api/mcp'
vi.mock('@/api/mcp', () => ({
  mcpAPI: { listServers: vi.fn(), listTools: vi.fn() },
}))
let root: Root, container: HTMLDivElement, client: QueryClient
function Probe({
  id = 'first',
  enabled = true,
}: {
  id?: string
  enabled?: boolean
}) {
  const servers = useFetchMCPServers({ page_size: 100, enabled })
  const tools = useFetchMCPTools([id], enabled, 30000)
  return (
    <output>
      {JSON.stringify({ servers: servers.data, tools: tools.data })}
    </output>
  )
}
async function render(id = 'first', enabled = true) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Probe id={id} enabled={enabled} />
      </QueryClientProvider>,
    ),
  )
}
async function deliver(update: () => void) {
  await act(async () => {
    update()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  container = document.createElement('div')
  root = createRoot(container)
  vi.mocked(mcpAPI.listServers).mockResolvedValue({
    mcp_servers: [],
    total: 0,
  } as never)
})
afterEach(() => {
  act(() => root.unmount())
  client.clear()
})
it('does not load a closed panel and shares cached server reads when opened', async () => {
  vi.mocked(mcpAPI.listTools).mockResolvedValue({})
  await render('first', false)
  expect(mcpAPI.listServers).not.toHaveBeenCalled()
  await render()
  await render('second')
  expect(mcpAPI.listServers).toHaveBeenCalledTimes(1)
  expect(mcpAPI.listTools).toHaveBeenCalledWith({
    mcp_ids: ['first'],
    timeout: 30000,
  })
})
it('keeps a late response from an old server out of the current tool view', async () => {
  let first!: (value: Record<string, never[]>) => void,
    second!: (value: Record<string, never[]>) => void
  vi.mocked(mcpAPI.listTools).mockImplementation(
    ({ mcp_ids }) =>
      new Promise((resolve) => {
        if (mcp_ids[0] === 'first') first = resolve
        else second = resolve
      }),
  )
  await render()
  await render('second')
  await deliver(() => second({ second: [] }))
  expect(container.textContent).toContain('"second"')
  await deliver(() => first({ first: [] }))
  expect(container.textContent).not.toContain('"first"')
  expect(container.textContent).toContain('"second"')
})
