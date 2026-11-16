import { act, type PropsWithChildren } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
import type { Document } from '@/types/api'
import { KnowledgeDocumentsPage } from '../KnowledgeDocumentsPage'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  getFilter: vi.fn(),
  getKnowledge: vi.fn(),
}))
vi.mock('@/api/knowledge', () => ({
  knowledgeAPI: {
    document: { list: mocks.list, getFilter: mocks.getFilter },
    knowledgeBase: { get: mocks.getKnowledge },
  },
}))
vi.mock('@/hooks/use-abilities', () => ({
  useAbilities: () => ({ canDownloadInTenant: () => true }),
}))
vi.mock('../generate/hooks', () => ({
  useGenerateState: () => ({
    graph: { status: 'start', traceData: null },
    raptor: { status: 'start', traceData: null },
    isActionPending: false,
    deleteConfirmOpen: false,
    deletingType: null,
    handleRun: vi.fn(),
    handlePause: vi.fn(),
    handleDeleteRequest: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    handleDeleteCancel: vi.fn(),
  }),
}))
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Panel: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Separator: ({ 'aria-label': label }: { 'aria-label': string }) => (
    <hr aria-label={label} />
  ),
}))

const doc = (id: string, overrides: Partial<Document> = {}): Document =>
  ({
    id,
    name: `${id}.pdf`,
    type: 'pdf',
    suffix: 'pdf',
    size: 2048,
    kb_id: 'kb',
    status: '1',
    run: '3',
    chunk_num: 12,
    token_num: 3400,
    created_by: 'user',
    nickname: 'Ada',
    create_date: '2026-11-10T08:00:00',
    update_date: '2026-11-10T08:00:00',
    create_time: 0,
    update_time: 0,
    parser_id: 'naive',
    progress: 1,
    progress_msg: 'Parsed.\n[ERROR] Page 3 skipped',
    process_begin_at: '',
    process_duration: 0,
    meta_fields: { author: 'Ada' },
    ...overrides,
  }) as Document

let root: Root
let container: HTMLDivElement
let client: QueryClient
let nativeDialog: ReturnType<typeof stubNativeDialog>
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
const panel = () =>
  container.querySelector<HTMLElement>(
    '[data-workspace-detail] [data-context-panel]',
  )

async function render(entry = '/knowledge/kb/documents') {
  const router = createMemoryRouter(
    [
      {
        path: '/knowledge/:id/documents',
        element: <KnowledgeDocumentsPage />,
      },
      {
        path: '/knowledge/:id/documents/:docId/chunks',
        element: <h1>Chunks</h1>,
      },
    ],
    { initialEntries: [entry] },
  )
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  )
  await settle()
  await settle()
  return router
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  nativeDialog = stubNativeDialog()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({
      width: 1400,
      height: 900,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1400,
      bottom: 900,
      toJSON() {},
    }),
  )
  mocks.list.mockResolvedValue({
    docs: [doc('report'), doc('notes', { run: '4', chunk_num: 0 })],
    total: 2,
  })
  mocks.getFilter.mockResolvedValue({
    filter: { suffix: { pdf: 2 }, run_status: { '3': 1, '4': 1 } },
    total: 2,
  })
  mocks.getKnowledge.mockResolvedValue({
    id: 'kb',
    name: 'Manuals',
    tenant_id: 'tenant',
    chunk_num: 12,
    doc_num: 2,
  })
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  nativeDialog.restore()
  vi.restoreAllMocks()
})

it('shows six default columns and opens a row in the Inspector without leaving the page', async () => {
  const router = await render()
  const headers = [...container.querySelectorAll('thead th')]
    .map((cell) => cell.textContent?.trim())
    .filter(Boolean)
  // Six data columns, then the visually hidden row-actions header.
  expect(headers).toEqual([
    'File name',
    'Chunks',
    'Parser',
    'Task status',
    'Enabled',
    'Created at',
    'Actions',
  ])
  expect(panel()).toBeNull()

  const row = [...container.querySelectorAll('tbody tr')].find((tr) =>
    tr.textContent?.includes('report.pdf'),
  )!
  await act(async () =>
    (row.querySelector('td:nth-child(3)') as HTMLElement).click(),
  )
  expect(router.state.location.pathname).toBe('/knowledge/kb/documents')
  expect(document.querySelector('[role="dialog"]')).toBeNull()
  expect(panel()?.querySelector('h2')?.textContent).toBe('report.pdf')
  expect(panel()?.textContent).toContain('Ada')
  expect(panel()?.textContent).toContain('author')
  expect(
    panel()?.querySelector(
      '[data-slot="document-parse-log"] .text-status-error',
    )?.textContent,
  ).toBe('[ERROR] Page 3 skipped')
  expect(row.getAttribute('aria-current')).toBe('true')
})

it('opens the Inspector from the keyboard-reachable name and links to the chunks page', async () => {
  const router = await render()
  const name = [...container.querySelectorAll('tbody button')].find(
    (button) => button.textContent === 'notes.pdf',
  ) as HTMLButtonElement
  await act(async () => name.click())
  expect(panel()?.querySelector('h2')?.textContent).toBe('notes.pdf')
  await act(async () =>
    panel()!
      .querySelector<HTMLButtonElement>('button[aria-label="View chunks"]')!
      .click(),
  )
  expect(router.state.location.pathname).toBe(
    '/knowledge/kb/documents/notes/chunks',
  )
})

it('opens the upload dialog once for the create flow import step', async () => {
  const router = await render('/knowledge/kb/documents?import=1')
  const dialog = document.querySelector('dialog[open]')
  expect(dialog?.textContent).toContain('Upload documents')
  expect(router.state.location.search).toBe('')
})
