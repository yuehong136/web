import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/app-shell'
import { documentAPI } from '@/api/document'
import { useUIStore } from '@/stores'
import { changeLanguage } from '@/locales/i18n'
import AutoFillWorkbenchPage from '../AutoFillWorkbenchPage'

const fill = vi.fn()

vi.mock('@/components/layout/sidebar-utilities', () => ({
  SidebarUtilities: () => <button>Account</button>,
}))
vi.mock('@/components/layout/SidebarConversations', () => ({
  SidebarConversations: () => null,
}))
vi.mock('@/api/document', () => ({
  documentAPI: { processDocx: vi.fn(), fillDocx: vi.fn() },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@/hooks/use-mcp-request', () => ({
  useFetchMCPServers: () => ({ data: { mcp_servers: [] }, isFetching: false }),
}))
vi.mock('@/hooks/use-model-selector-request', () => ({
  useModelSelectorRequest: () => ({ myLLMs: {}, modelRequest: {} }),
}))
vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: ({ onSelect }: { onSelect: (name: string) => void }) => (
    <button type="button" onClick={() => onSelect('model-a')}>
      Pick model
    </button>
  ),
}))
vi.mock(
  '@/components/knowledge/document-preview/components/docx-document',
  () => ({
    renderDocxDocument: vi.fn(async () => '<p>Rendered</p>'),
    stepDocxZoom: (zoom: number, direction: 1 | -1) => zoom + direction * 25,
  }),
)
vi.mock('../ref/use-structured-ai-fill', () => ({
  useStructuredAIFill: () => ({ aiFilling: false, aiRawOutput: '', fill }),
}))

let container: HTMLDivElement
let root: Root

const header = () =>
  container.querySelector<HTMLElement>('[data-main-task-area]')!
    .previousElementSibling as HTMLElement
const currentStep = () =>
  header().querySelector('[aria-current="step"]')?.textContent
const buttonByText = (scope: ParentNode, text: string) =>
  Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => button.textContent?.trim() === text,
  )!
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', (query: string) =>
    Object.assign(new EventTarget(), {
      matches: query === '(min-width: 48rem)' || query === '(min-width: 64rem)',
    }),
  )
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  fill.mockReset().mockResolvedValue({ name: 'Ada' })
  vi.mocked(documentAPI.processDocx).mockResolvedValue({
    placeholders: { name: '' },
    file: btoa('docx'),
  } as never)
  useUIStore.setState({ sidebarCollapsed: false })
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  const router = createMemoryRouter(
    [
      {
        path: '/tools/auto-fill',
        element: (
          <AppShell>
            <AutoFillWorkbenchPage />
          </AppShell>
        ),
      },
    ],
    { initialEntries: ['/tools/auto-fill'] },
  )
  await act(async () => root.render(<RouterProvider router={router} />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const upload = async () => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
  const file = new File(['docx'], 'contract.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  await act(async () => {
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await settle()
  await settle()
}

it('puts the title and step bar in the card header and keeps help inside one drop zone', async () => {
  expect(header().querySelector('h1')?.textContent).toBe('Auto-fill')
  expect(
    header().querySelector('ol[aria-label="Auto-fill progress"]'),
  ).not.toBeNull()
  expect(currentStep()).toMatch(/Upload$/)
  const task = container.querySelector('[data-main-task-area]')!
  const zones = task.querySelectorAll('.border-dashed')
  expect(zones).toHaveLength(1)
  expect(zones[0].textContent).toContain('Word documents (.docx) up to 10 MB.')
  expect(zones[0].textContent).toContain('{{field name}}')
  expect(task.innerHTML).not.toMatch(/bg-linear|from-violet|rounded-2xl/)
  // Only react-dropzone's hidden file input carries an inline style.
  expect(task.querySelector('[style]:not(input[type="file"])')).toBeNull()
})

it('moves to the fill step after upload and sends the typed supplement with AI fill', async () => {
  await upload()
  expect(documentAPI.processDocx).toHaveBeenCalledOnce()
  expect(currentStep()).toMatch(/Fill in$/)
  expect(header().textContent).toContain('Upload (done)')
  expect(
    container.querySelector('label[for="placeholder-name"]'),
  ).not.toBeNull()

  await act(async () => buttonByText(container, 'Settings').click())
  const dialog = document.querySelector<HTMLElement>('dialog[open]')!
  expect(dialog.querySelector('h2')?.textContent).toBe('AI fill settings')
  await act(async () => buttonByText(dialog, 'Pick model').click())
  const promptTab = Array.from(
    dialog.querySelectorAll<HTMLElement>('[role="tab"]'),
  ).find((tab) => tab.textContent === 'Prompt')!
  await act(async () => {
    promptTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    promptTab.focus()
  })
  const supplement = Array.from(dialog.querySelectorAll('textarea')).find(
    (area) => area.placeholder.startsWith('Details sent'),
  )!
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!
    setter.call(supplement, 'Name is Ada')
    supplement.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => buttonByText(dialog, 'Done').click())
  expect(document.querySelector('dialog[open]')).toBeNull()

  await act(async () => buttonByText(container, 'AI fill').click())
  expect(fill).toHaveBeenCalledOnce()
  const request = fill.mock.calls[0][0]
  expect(request.llm_name).toBe('model-a')
  expect(request.messages[0].content).toContain('"name": ""')
  expect(request.messages[0].content).toContain(
    'Additional information: Name is Ada',
  )
  expect(
    container.querySelector<HTMLInputElement>('#placeholder-name')?.value,
  ).toBe('Ada')
})
