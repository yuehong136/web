import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { APIError, apiClient } from '@/api/client'
import { setProductLanguage } from '@/locales/i18n'
import type { DatasetDTO } from '@/types/api'
import { KnowledgeSettingsPage } from '../KnowledgeSettingsPage'

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
// Keep the real page, query hooks, API adapter, resolver and parser controls.
vi.mock('../settings/LinkDataSource', () => ({ LinkDataSource: () => null }))
vi.mock('../settings/ParserVisualizationPanel', () => ({
  ParserVisualizationPanel: () => null,
}))
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let root: Root
let container: HTMLDivElement
let client: QueryClient
let stored: DatasetDTO
let writes: Record<string, unknown>[]

async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/knowledge/kb-1/settings']}>
          <Routes>
            <Route
              path="/knowledge/:id/settings"
              element={<KnowledgeSettingsPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
  await vi.waitFor(() =>
    expect(document.querySelector('input[type="number"]')).not.toBeNull(),
  )
}
function field(label: string): HTMLElement {
  const el = [...document.querySelectorAll('label')].find((x) =>
    x.textContent?.replace(/^\*/, '').startsWith(label),
  )
  expect(el, label).toBeDefined()
  return el!.parentElement!
}
async function input(label: string, value: string) {
  const el =
    field(label).querySelector<HTMLInputElement>('input[type=number]') ??
    field(label).querySelector<HTMLInputElement>('input')!
  expect(el.disabled).toBe(false)
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function save() {
  await act(async () => {
    document
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}
async function reload() {
  await act(async () => root.unmount())
  client.clear()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  root = createRoot(container)
  await render()
}

beforeEach(async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('en-US')
  stored = {
    id: 'kb-1',
    name: 'Docs',
    tenant_id: 'tenant-1',
    permission: 'team',
    document_count: 2,
    chunk_count: 8,
    chunk_method: 'naive',
    embedding_model: 'embedding@Builtin',
    parser_config: {
      layout_recognize: 'DeepDOC',
      chunk_token_num: 256,
      parent_child: { use_parent_child: true, children_delimiter: '\t' },
      overlapped_percent: 0.2,
      metadata: [{ key: 'author', description: 'Author', enum: ['Alice'] }],
      built_in_metadata: [{ key: 'source' }],
      enable_metadata: true,
      raptor: { use_raptor: false },
      graphrag: { use_graphrag: false },
    },
  }
  writes = []
  vi.spyOn(apiClient, 'get').mockImplementation(async (path) => {
    if (path === '/v1/datasets/kb-1') return structuredClone(stored) as never
    if (path === '/v1/llm/my_llms') return {} as never
    if (path === '/agents') return { total: 0, canvas: [] } as never
    throw new Error(`Unexpected GET ${path}`)
  })
  vi.spyOn(apiClient, 'put').mockImplementation(async (path, body) => {
    expect(path).toBe('/v1/datasets/kb-1')
    const update = body as Record<string, unknown>
    writes.push(structuredClone(update))
    stored = {
      ...stored,
      ...update,
      ...((update.ext as object) || {}),
      parser_config: {
        ...stored.parser_config,
        ...(update.parser_config as object),
      },
    }
    return structuredClone(stored) as never
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  await render()
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('reads canonical dataset fields and saves editable general options, then restores them after remount', async () => {
  expect(
    field('Recommended chunk size').querySelector<HTMLInputElement>(
      'input[type=number]',
    )?.value,
  ).toBe('256')
  expect(
    field('Use child chunks')
      .querySelector('[role="switch"]')
      ?.getAttribute('aria-checked'),
  ).toBe('true')
  expect(
    field('Child delimiter').querySelector<HTMLInputElement>('input')?.value,
  ).toBe('\\t')
  expect(
    field('Overlap percentage').querySelector<HTMLInputElement>(
      'input[type=number]',
    )?.value,
  ).toBe('20')
  await input('Recommended chunk size', '321')
  await input('Child delimiter', '\\n')
  await input('Overlap percentage', '15')
  await save()
  expect(writes).toHaveLength(1)
  expect(writes[0]).toMatchObject({
    chunk_method: 'naive',
    embedding_model: 'embedding@Builtin',
    permission: 'team',
    parser_config: {
      chunk_token_num: 321,
      overlapped_percent: 0.15,
      parent_child: { use_parent_child: true, children_delimiter: '\n' },
      metadata: [{ key: 'author', description: 'Author', enum: ['Alice'] }],
      raptor: { use_raptor: false },
      graphrag: { use_graphrag: false },
    },
  })
  expect(writes[0]).not.toHaveProperty('connectors')
  expect(stored.parser_config?.built_in_metadata).toEqual([{ key: 'source' }])
  await reload()
  expect(
    field('Recommended chunk size').querySelector<HTMLInputElement>(
      'input[type=number]',
    )?.value,
  ).toBe('321')
  expect(
    field('Child delimiter').querySelector<HTMLInputElement>('input')?.value,
  ).toBe('\\n')
  expect(
    field('Overlap percentage').querySelector<HTMLInputElement>(
      'input[type=number]',
    )?.value,
  ).toBe('15')
  await act(async () =>
    field('Use child chunks')
      .querySelector<HTMLButtonElement>('[role="switch"]')!
      .click(),
  )
  await save()
  expect(writes[1]).toMatchObject({
    parser_config: { parent_child: { use_parent_child: false } },
  })
  await reload()
  expect(
    field('Use child chunks')
      .querySelector('[role="switch"]')
      ?.getAttribute('aria-checked'),
  ).toBe('false')
  expect(document.body.textContent).not.toContain('Child delimiter')
})

it('keeps an edited draft available after a denied save', async () => {
  vi.mocked(apiClient.put).mockRejectedValueOnce(
    new APIError(200, '109', 'Denied'),
  )
  await input('Recommended chunk size', '321')
  await save()
  expect(writes).toHaveLength(0)
  expect(
    field('Recommended chunk size').querySelector<HTMLInputElement>(
      'input[type=number]',
    )?.value,
  ).toBe('321')
  expect(stored.parser_config?.chunk_token_num).toBe(256)
  await save()
  expect(writes).toHaveLength(1)
})

it('preserves a hydrated pipeline, saves via ext, and clears it when switching back to builtin', async () => {
  const pipelineId = 'a'.repeat(32)
  const originalGet = vi.mocked(apiClient.get).getMockImplementation()!
  vi.mocked(apiClient.get).mockImplementation(async (path, config) =>
    path === '/agents'
      ? ({
          total: 2,
          canvas: [
            {
              id: pipelineId,
              title: 'Document pipeline',
              tenant_id: 'tenant-1',
              canvas_category: 'dataflow_canvas',
            },
            {
              id: 'b'.repeat(32),
              title: 'Foreign pipeline',
              tenant_id: 'foreign',
              canvas_category: 'dataflow_canvas',
            },
          ],
        } as never)
      : originalGet(path, config),
  )
  stored.pipeline_id = pipelineId
  await reload()
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain('Document pipeline'),
  )
  expect(document.body.textContent).not.toContain('Foreign pipeline')
  await input('Knowledge base name', '中文知识库 2026')
  await save()
  expect(writes[0]).toMatchObject({
    name: '中文知识库 2026',
    ext: { pipeline_id: pipelineId },
  })
  expect(writes[0]).not.toHaveProperty('chunk_method')
  expect(writes[0]).not.toHaveProperty('parser_config')
  await reload()
  expect(document.body.textContent).toContain('Document pipeline')
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('[role=radio][value="1"]')!
      .click(),
  )
  await save()
  expect(writes[1]).toMatchObject({
    chunk_method: 'naive',
    ext: { pipeline_id: '' },
  })
  await reload()
  expect(
    document
      .querySelector('[role=radio][value="1"]')
      ?.getAttribute('aria-checked'),
  ).toBe('true')
})

it('rejects over-budget names and an empty pipeline mode before making a request', async () => {
  await input('Knowledge base name', '中'.repeat(43))
  await save()
  expect(writes).toHaveLength(0)
  expect(document.body.textContent).toContain('128 UTF-8 bytes')
  await input('Knowledge base name', '中文知识库')
  await act(async () =>
    document
      .querySelector<HTMLButtonElement>('[role=radio][value="2"]')!
      .click(),
  )
  await save()
  expect(writes).toHaveLength(0)
  expect(document.body.textContent).toContain('Select a valid data pipeline')
})
