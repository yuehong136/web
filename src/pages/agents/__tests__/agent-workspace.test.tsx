import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AgentsPage from '../index'
import { changeLanguage } from '@/locales/i18n'
import { DEFAULT_APPEARANCE, setAppearance } from '@/themes/appearance'
import { AgentCanvasType, type AgentFlow } from '@/types/agent'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
const mock = vi.hoisted(() => ({
  list: vi.fn(),
  refetch: vi.fn(),
  setAgent: vi.fn(),
  deleteAgent: vi.fn(),
  setOptions: vi.fn(),
  failed: false,
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/hooks/use-agent-request', () => ({
  useFetchAgentList: (parameters: unknown) => mock.list(parameters),
  useFetchAgentTags: () => ({ data: [] }),
  useSetAgent: (options: unknown) => {
    mock.setOptions(options)
    return { setAgent: mock.setAgent, isLoading: false }
  },
  useDeleteAgent: () => ({ deleteAgent: mock.deleteAgent, isLoading: false }),
}))
vi.mock('../hooks/use-rename-agent', () => ({
  useRenameAgent: () => ({ rename: vi.fn(), isLoading: false }),
}))
vi.mock('@/lib/toast', () => ({ toast }))
const flow: AgentFlow = {
  id: 'flow-one',
  title: 'Research',
  description: 'Research workflow',
  canvas_type: AgentCanvasType.AGENT,
  dsl: {
    components: {},
    graph: { nodes: [], edges: [] },
    history: [],
    messages: [],
    reference: [],
    globals: {},
    retrieval: [],
  },
  create_time: 1000,
  update_time: 1000,
  user_id: 'user-one',
  permission: 'me',
}
let root: Root
let container: HTMLDivElement
let nativeDialog: ReturnType<typeof stubNativeDialog>
const click = (element: HTMLElement) => act(async () => element.click())
const button = (text: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent === text,
  )!
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
async function render() {
  const router = createMemoryRouter(
    [
      { path: '/agents', element: <AgentsPage /> },
      { path: '*', element: <h1>Editor</h1> },
    ],
    { initialEntries: ['/agents'] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
  await settle()
  return router
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
  mock.list.mockImplementation(() => ({
    agents: [flow],
    total: 7,
    isLoading: false,
    isError: false,
    refetch: mock.refetch,
  }))
  mock.setAgent.mockResolvedValue(flow)
  mock.deleteAgent.mockResolvedValue(true)
  await changeLanguage('en-US')
  setAppearance({ ...DEFAULT_APPEARANCE, mode: 'light' })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  nativeDialog.restore()
})
it('shows real totals without page-derived KPI cards and retries a true load failure', async () => {
  mock.list.mockReturnValue({
    agents: [],
    total: 0,
    isLoading: false,
    isError: true,
    refetch: mock.refetch,
  })
  await render()
  expect(container.textContent).toContain('Failed to load Agent list')
  expect(container.textContent).not.toContain('No agents or pipelines yet')
  await click(button('Retry'))
  expect(mock.refetch).toHaveBeenCalledOnce()
})
it('retains search and list preferences across theme and locale updates without unmounting the search input', async () => {
  await render()
  expect(container.textContent).toContain('Projects: 7')
  expect(container.textContent).not.toContain('Extended nodes')
  const search =
    container.querySelector<HTMLInputElement>('input[type=search]')!
  await type(search, 'Research')
  await click(
    container.querySelector<HTMLButtonElement>(
      'button[aria-label="List view"]',
    )!,
  )
  await act(async () => setAppearance({ preset: 'graphite', mode: 'dark' }))
  await act(async () => changeLanguage('zh-CN'))
  expect(container.querySelector('input[type=search]')).toBe(search)
  expect(search.value).toBe('Research')
  expect(
    container
      .querySelector('button[aria-label="列表视图"]')
      ?.getAttribute('aria-pressed'),
  ).toBe('true')
  expect(mock.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ keywords: 'Research' }),
  )
})
it('keeps a failed create draft and its type while theme and locale change, using the existing global error owner', async () => {
  mock.setAgent.mockRejectedValue(new Error('private-model-secret'))
  await render()
  await click(button('New asset'))
  const name = document.querySelector<HTMLInputElement>('input[id$="-name"]')!
  await type(name, 'Draft workflow')
  await click(button('Continue'))
  await settle()
  expect(document.body.textContent).toContain('Your name and type are kept')
  expect(document.body.textContent).not.toContain('private-model-secret')
  expect(name.value).toBe('Draft workflow')
  expect(mock.setOptions).toHaveBeenCalledWith({ showToast: false })
  expect(toast.success).not.toHaveBeenCalled()
  await act(async () => setAppearance({ preset: 'ocean' }))
  await act(async () => changeLanguage('zh-CN'))
  expect(document.querySelector('input[id$="-name"]')).toBe(name)
  expect(name.value).toBe('Draft workflow')
})
it('rejects unrecognized JSON without creating a blank asset, and accepts a valid empty graph', async () => {
  const router = await render()
  await click(button('Import JSON'))
  const input = document.querySelector<HTMLInputElement>('input[type=file]')!
  async function choose(content: string) {
    const file = new File([content], 'workflow.json', {
      type: 'application/json',
    })
    Object.defineProperty(file, 'text', { value: async () => content })
    Object.defineProperty(input, 'files', { configurable: true, value: [file] })
    await act(async () =>
      input.dispatchEvent(new Event('change', { bubbles: true })),
    )
  }
  await choose('{}')
  await click(button('Import workflow'))
  await settle()
  expect(mock.setAgent).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain('Could not import this workflow')
  await choose(JSON.stringify({ graph: { nodes: [], edges: [] } }))
  await click(button('Import workflow'))
  await settle()
  expect(mock.setAgent).toHaveBeenCalledOnce()
  expect(mock.setAgent.mock.calls[0][0].dsl.graph).toEqual({
    nodes: [],
    edges: [],
  })
  expect(router.state.location.pathname).not.toBe('/agents')
  expect(toast.success).toHaveBeenCalledExactlyOnceWith('Workflow imported')
})
it('keeps the selected asset in the delete dialog when the existing delete mutation fails', async () => {
  mock.deleteAgent.mockRejectedValueOnce(new Error('private-delete-trace'))
  await render()
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Actions for Research"]',
  )!
  await act(async () =>
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ),
  )
  await settle()
  const item = [
    ...document.querySelectorAll<HTMLElement>('[role=menuitem]'),
  ].find((element) => element.textContent === 'Delete')!
  await click(item)
  await click(
    button('Confirm delete', document.querySelector('[role=alertdialog]')!),
  )
  await settle()
  expect(mock.deleteAgent).toHaveBeenCalledExactlyOnceWith('flow-one')
  expect(document.querySelector('[role=alertdialog]')).not.toBeNull()
  expect(document.body.textContent).not.toContain('private-delete-trace')
})
