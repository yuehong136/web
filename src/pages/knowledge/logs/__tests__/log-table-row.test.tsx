import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { knowledgeAPI } from '@/api/knowledge'
import { setProductLanguage } from '@/locales/i18n'
import { KnowledgeLogsPage } from '../KnowledgeLogsPage'
import { useLogListState } from '../hooks/use-log-list-state'
import en from '@/locales/en-US/knowledge'
import zh from '@/locales/zh-CN/knowledge'
import { LogTableRow } from '../components/log-table-row'
import { LogTabType } from '../constants'

async function render(
  taskType: string,
  language: string,
  tab = LogTabType.DATASET_LOGS,
) {
  const i18n = createInstance()
  await i18n.init({
    lng: language,
    resources: { en: { translation: en }, zh: { translation: zh } },
  })
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <table>
        <tbody>
          <LogTableRow
            item={{ id: 'log', task_type: taskType, operation_status: '3' }}
            activeTab={tab}
            onViewDetail={() => {}}
          />
        </tbody>
      </table>
    </I18nextProvider>,
  )
}

describe('dataset processing type display', () => {
  for (const [language, label] of [
    ['en', 'Knowledge graph'],
    ['zh', '知识图谱'],
  ]) {
    for (const type of ['GraphRAG', 'Graph']) {
      it(`${language} renders ${type} with a graph icon and translated label`, async () => {
        const html = await render(type!, language!)
        expect(html).toContain(label)
        expect(html).toContain('lucide-network')
        expect(html).toContain('aria-hidden="true"')
      })
    }
  }
  it('keeps RAPTOR, unknown types, and file task types unchanged', async () => {
    for (const type of ['RAPTOR', 'future-task']) {
      const html = await render(type, 'en')
      expect(html).toContain(type)
      expect(html).not.toContain('lucide-network')
    }
    const file = await render('GraphRAG', 'zh', LogTabType.FILE_LOGS)
    expect(file).toContain('GraphRAG')
    expect(file).not.toContain('lucide-network')
  })
})

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let root: Root
let container: HTMLDivElement
let client: QueryClient
let state: ReturnType<typeof useLogListState>
let navigate: ReturnType<typeof useNavigate>
function Harness() {
  const current = useLogListState(LogTabType.FILE_LOGS)
  useEffect(() => {
    state = current
  }, [current])
  return null
}
function Navigation() {
  const current = useNavigate()
  useEffect(() => {
    navigate = current
  }, [current])
  return null
}
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
}
const mount = async (page = false) => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/knowledge/a/logs']}>
          <Navigation />
          <Routes>
            <Route
              path="/knowledge/:id/logs"
              element={page ? <KnowledgeLogsPage /> : <Harness />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await settle()
}

describe('log pagination request ownership', () => {
  beforeEach(async () => {
    await setProductLanguage('en-US')
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.spyOn(knowledgeAPI.logs, 'listFileLogs').mockResolvedValue({
      logs: [
        {
          id: 'log',
          operation_status: '3',
          create_date: '',
          create_time: 0,
          document_id: 'doc',
          document_name: 'report',
          document_suffix: '',
          document_type: '',
          dsl: {},
          path: [],
          task_id: 'task',
          name: 'log',
          kb_id: 'a',
          parser_id: '',
          pipeline_id: '',
          pipeline_title: '',
          avatar: '',
          process_begin_at: null,
          process_duration: 0,
          progress: 1,
          progress_msg: '',
          status: '1',
          task_type: '',
          tenant_id: 'tenant',
          update_date: '',
          update_time: 0,
        },
      ],
      total: 100,
    })
    vi.spyOn(knowledgeAPI.logs, 'listDatasetLogs').mockResolvedValue({
      logs: [],
      total: 0,
    })
    vi.spyOn(knowledgeAPI.logs, 'getSummary').mockResolvedValue({
      doc_num: 1,
      chunk_num: 1,
      token_num: 0,
      status: {
        unstart_count: 0,
        cancel_count: 0,
        running_count: 0,
        done_count: 1,
        fail_count: 0,
      },
    })
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    client.clear()
    vi.restoreAllMocks()
  })
  it('keeps filters, accepts omitted or same size, and resets a changed size atomically', async () => {
    await mount()
    await act(async () => {
      state.handleFilterSubmit({ operation_status: ['3'] })
      state.handleSearchChange({ target: { value: 'report' } } as any)
      state.handlePaginationChange(4)
    })
    await settle()
    expect(state.pagination).toMatchObject({ page: 4, pageSize: 10 })
    await act(async () => state.handlePaginationChange(5, 10))
    await settle()
    expect(state.pagination.page).toBe(5)
    vi.mocked(knowledgeAPI.logs.listFileLogs).mockClear()
    await act(async () => state.handlePaginationChange(5, 50))
    await settle()
    expect(state.pagination).toMatchObject({ page: 1, pageSize: 50 })
    expect(knowledgeAPI.logs.listFileLogs).toHaveBeenCalledExactlyOnceWith({
      kb_id: 'a',
      page: 1,
      page_size: 50,
      keywords: 'report',
      operation_status: ['3'],
    })
  })
  it('rejects malformed pagination without requesting or changing state', async () => {
    await mount()
    vi.mocked(knowledgeAPI.logs.listFileLogs).mockClear()
    for (const [page, size] of [
      [0, undefined],
      [-1, undefined],
      [1.5, undefined],
      [NaN, undefined],
      [Infinity, undefined],
      [2, 0],
      [2, -1],
      [2, 12],
      [2, NaN],
      [2, Infinity],
    ]) {
      await act(async () => state.handlePaginationChange(page!, size))
    }
    await settle()
    expect(state.pagination).toMatchObject({ page: 1, pageSize: 10 })
    expect(knowledgeAPI.logs.listFileLogs).not.toHaveBeenCalled()
  })
  it('uses the real Next button and resets the new dataset before its first request', async () => {
    await mount(true)
    const next = () =>
      Array.from(container.querySelectorAll('button')).find(
        (button) => button.textContent === 'Next',
      )!
    await act(async () => next().click())
    await settle()
    expect(knowledgeAPI.logs.listFileLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ kb_id: 'a', page: 2, page_size: 10 }),
    )
    const input = container.querySelector('input')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, 'private-search')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await settle()
    await act(async () => next().click())
    await settle()
    vi.mocked(knowledgeAPI.logs.listFileLogs).mockClear()
    await act(async () => navigate('/knowledge/b/logs'))
    await settle()
    expect(knowledgeAPI.logs.listFileLogs).toHaveBeenCalledExactlyOnceWith({
      kb_id: 'b',
      page: 1,
      page_size: 10,
      keywords: '',
      operation_status: undefined,
    })
    expect(container.querySelector('input')!.value).toBe('')
  })
})
