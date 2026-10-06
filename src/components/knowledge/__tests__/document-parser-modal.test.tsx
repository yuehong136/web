import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ChunkMethodModal } from '../ChunkMethodModal'
import { useDocumentParserModal } from '@/hooks/use-document-parser-modal'
import { documentKeys } from '@/hooks/use-document-request'
import { knowledgeKeys } from '@/hooks/use-knowledge-request'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api/client'
import { setProductLanguage } from '@/locales/i18n'
import { requireParserDocument } from '@/api/knowledge-document-parser'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
let root: Root
let container: HTMLDivElement
let client: QueryClient
let modal: ReturnType<typeof useDocumentParserModal>
let datasetId: string
let wire: ReturnType<typeof canonical>
let calls: { method: string; url: URL; body: any }[]
let respond: (url: URL, init?: RequestInit) => Promise<Response>

const pipelineId = 'a'.repeat(32)
function canonical(extra: Record<string, unknown> = {}) {
  return {
    id: 'doc-1',
    dataset_id: 'kb-1',
    name: 'source.txt',
    type: 'doc',
    size: 90,
    chunk_method: 'naive',
    pipeline_id: null as string | null,
    parser_config: {
      chunk_token_num: 512,
      delimiter: '\n',
      overlapped_percent: 10,
      image_context_size: 600,
      table_context_size: 900,
      mineru_lang: 'Turkish',
      parent_child: { use_parent_child: true, children_delimiter: '\n#' },
      raptor: { use_raptor: false, historical: null },
      opaque: { preserve: 1 },
    } as Record<string, unknown>,
    status: '0',
    run: 'DONE',
    chunk_count: 2,
    token_count: 12,
    progress: 1,
    update_time: 1,
    ...extra,
  }
}
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
function Harness() {
  const owner = useDocumentParserModal(datasetId)
  useLayoutEffect(() => {
    modal = owner
  }, [owner])
  return (
    <ChunkMethodModal
      open={owner.open}
      document={owner.document}
      onClose={owner.close}
      datasetId={datasetId}
      tenantId="owner"
      actorKey={owner.actorKey}
      session={owner.session}
      errorKey={owner.errorKey}
      isLoading={owner.busy}
      onSubmit={owner.submit}
    />
  )
}
async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    ),
  )
}
async function open(extra: Record<string, unknown> = {}) {
  await act(async () =>
    modal.show(
      requireParserDocument(
        canonical(extra),
        'kb-1',
        String(extra.id ?? 'doc-1'),
      ),
    ),
  )
}
async function input(element: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
function numeric(label: string) {
  const el = [...document.querySelectorAll('label')].find(
    (item) => item.textContent?.trim() === label,
  )
  expect(el, label).toBeDefined()
  const control = el!.parentElement!.querySelector<HTMLInputElement>(
    'input[type="number"]',
  )
  expect(control).toBeDefined()
  return control!
}
async function save() {
  const form = document.querySelector('form')!
  await act(async () =>
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ),
  )
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 15))
  })
}
const writes = () => calls.filter((call) => call.method === 'PATCH')

beforeEach(async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('en-US')
  useAuthStore.setState({ token: 'actor-one', user: { id: 'owner' } as never })
  apiClient.setAuthToken('actor-one')
  datasetId = 'kb-1'
  wire = canonical()
  calls = []
  respond = async (url, init) => {
    if (url.pathname.endsWith('/agents'))
      return response({
        code: 0,
        message: 'success',
        data: { canvas: [], total: 0 },
      })
    if (init?.method === 'PATCH') {
      const patch = JSON.parse(String(init.body))
      wire = {
        ...wire,
        parser_config: { ...wire.parser_config, ...patch.parser_config },
        ...(patch.pipeline_id !== undefined
          ? { pipeline_id: patch.pipeline_id }
          : {}),
        ...(patch.chunk_method !== undefined
          ? { chunk_method: patch.chunk_method }
          : {}),
      }
      return response({ code: 0, message: 'success', data: wire })
    }
    return response({ code: 0, message: 'success', data: { docs: [wire] } })
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    const parsed = new URL(String(url))
    const method = init?.method ?? 'GET'
    if (
      method === 'GET' &&
      ['/v1/llm/my_llms', '/v1/llm/list'].some((path) =>
        parsed.pathname.endsWith(path),
      )
    )
      // The shared PDF selector inventory is separate from document request assertions.
      return response({ code: 0, message: 'success', data: {} })
    calls.push({
      method,
      url: parsed,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    return respond(parsed, init)
  })
  container = document.createElement('div')
  document.body.append(container)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  root = createRoot(container)
  await render()
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  apiClient.setAuthToken(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('opens actual nested children and percent units; no-op mounts no defaults into a PATCH', async () => {
  await open()
  expect(numeric('Overlap percentage').value).toBe('10')
  expect(
    [...document.querySelectorAll<HTMLInputElement>('input')].find(
      (input) => input.value === '\\n#',
    ),
  ).not.toBeNull()
  await save()
  expect(writes()).toHaveLength(0)
  expect(modal.open).toBe(false)
})

it('an explicit overlap edit submits only that field and preserves unrelated historical configuration', async () => {
  await open()
  await input(numeric('Overlap percentage'), '20')
  await save()
  await settle()
  expect(writes()).toHaveLength(1)
  expect(writes()[0].body).toEqual({
    parser_config: { overlapped_percent: 0.2 },
  })
  expect(wire.parser_config.image_context_size).toBe(600)
  expect(wire.parser_config.table_context_size).toBe(900)
  expect(wire.parser_config.mineru_lang).toBe('Turkish')
  expect(wire.status).toBe('0')
  expect(modal.open).toBe(false)
})

it.each([
  [0.1, '10'],
  [0.3, '30'],
  [1, '1'],
  [10, '10'],
])(
  'displays stored overlap %s without changing its wire representation',
  async (value, display) => {
    await open({ parser_config: { overlapped_percent: value } })
    expect(numeric('Overlap percentage').value).toBe(display)
    await save()
    expect(writes()).toHaveLength(0)
  },
)

it('a config failure independently reads the original document, invalidates every original scope and retains a safe editable draft', async () => {
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  respond = async (_url, init) =>
    init?.method === 'PATCH'
      ? response(
          {
            code: 'DOCUMENT_UPDATE_INVALID',
            retcode: 102,
            retmsg: 'SECRET SQL DSL TOKEN',
            data: { outcome: 'unchanged' },
          },
          400,
        )
      : response({ code: 0, message: 'success', data: { docs: [wire] } })
  await open()
  await input(numeric('Overlap percentage'), '20')
  await save()
  await settle()
  expect(modal.open).toBe(true)
  expect(numeric('Overlap percentage').value).toBe('20')
  expect(document.body.textContent).toContain(
    'Check the parser selection and configuration.',
  )
  expect(document.body.textContent).not.toContain('SECRET')
  expect(calls.map((call) => call.method)).toEqual(['PATCH', 'GET'])
  const keys = invalidate.mock.calls.map(([input]) => input?.queryKey)
  for (const key of [
    documentKeys.datasetLists('kb-1'),
    documentKeys.filter('kb-1'),
    documentKeys.detail('doc-1'),
    documentKeys.standaloneDetail('doc-1'),
    documentKeys.documentChunks('doc-1'),
    documentKeys.documentChunkList('doc-1'),
    knowledgeKeys.detail('kb-1'),
  ])
    expect(keys).toContainEqual(key)
})

it('unknown outcome and malformed acknowledgment remain errors even after a legal readback', async () => {
  for (const kind of ['unknown', 'malformed']) {
    respond = async (_url, init) =>
      init?.method === 'PATCH'
        ? kind === 'unknown'
          ? response(
              {
                code: 'DOCUMENT_UPDATE_OUTCOME_UNKNOWN',
                retcode: 500,
                data: { outcome: 'unknown' },
              },
              500,
            )
          : response({
              code: 0,
              message: 'success',
              data: { ...wire, id: 'wrong' },
            })
        : response({ code: 0, message: 'success', data: { docs: [wire] } })
    await open()
    await input(numeric('Overlap percentage'), '20')
    await save()
    await settle()
    expect(modal.open).toBe(true)
    expect(document.body.textContent).toContain('could not be confirmed')
    expect(numeric('Overlap percentage').value).toBe('20')
  }
  expect(writes()).toHaveLength(2)
})

it('duplicate submits issue one request; Escape/reopen and same-dataset document switches ignore the late result', async () => {
  let release!: (response: Response) => void
  const held = new Promise<Response>((resolve) => {
    release = resolve
  })
  respond = async (_url, init) =>
    init?.method === 'PATCH'
      ? held
      : response({ code: 0, message: 'success', data: { docs: [wire] } })
  await open()
  await input(numeric('Overlap percentage'), '20')
  await save()
  await save()
  expect(writes()).toHaveLength(1)
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  expect(modal.open).toBe(false)
  await open({ id: 'doc-2', parser_config: { overlapped_percent: 0.3 } })
  await input(numeric('Overlap percentage'), '25')
  release(response({ code: 0, message: 'success', data: wire }))
  await settle()
  expect(modal.open).toBe(true)
  expect(modal.document?.id).toBe('doc-2')
  expect(numeric('Overlap percentage').value).toBe('25')
  expect(document.querySelector('[role="alert"]')).toBeNull()
})

it('credential and route changes close their old owner and suppress stale feedback while retaining original invalidation', async () => {
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  let release!: (response: Response) => void
  respond = async () =>
    new Promise<Response>((resolve) => {
      release = resolve
    })
  await open()
  await input(numeric('Overlap percentage'), '20')
  await save()
  await act(async () => useAuthStore.setState({ token: 'actor-two' }))
  expect(modal.open).toBe(false)
  datasetId = 'kb-2'
  await render()
  release(
    response(
      {
        code: 'DOCUMENT_UPDATE_INVALID',
        retcode: 102,
        data: { outcome: 'unchanged' },
      },
      400,
    ),
  )
  await settle()
  expect(modal.open).toBe(false)
  expect(document.querySelector('[role="alert"]')).toBeNull()
  expect(
    invalidate.mock.calls.map(([input]) => input?.queryKey),
  ).toContainEqual(documentKeys.datasetLists('kb-1'))
  expect(calls).toHaveLength(1)
})

it('retains a selected pipeline outside the first page, uses real owner/category and never bootstraps Agent detail', async () => {
  respond = async (url) => {
    expect(url.pathname.endsWith('/agents')).toBe(true)
    const page = Number(url.searchParams.get('page'))
    return response({
      code: 0,
      message: 'success',
      data: {
        total: 51,
        canvas:
          page === 1
            ? [
                {
                  id: 'b'.repeat(32),
                  title: 'Visible foreign team',
                  tenant_id: 'foreign',
                  user_id: 'owner',
                  canvas_category: 'dataflow_canvas',
                },
              ]
            : [
                {
                  id: pipelineId,
                  title: 'Owned pipeline',
                  tenant_id: 'owner',
                  user_id: 'foreign',
                  canvas_category: 'dataflow_canvas',
                },
              ],
      },
    })
  }
  await open({ pipeline_id: pipelineId })
  await settle()
  expect(document.body.textContent).toContain('Owned pipeline')
  expect(document.body.textContent).not.toContain('Visible foreign team')
  expect(calls.some((call) => call.url.searchParams.get('page') === '2')).toBe(
    true,
  )
  expect(
    calls.every(
      (call) =>
        call.url.searchParams.get('canvas_category') === 'dataflow_canvas',
    ),
  ).toBe(true)
  await save()
  expect(writes()).toHaveLength(0)
})

it('a missing or failed catalog preserves the retained pipeline ID and draft, with a safe unavailable state', async () => {
  for (const failure of [false, true]) {
    respond = async () =>
      failure
        ? response({ code: 102, message: 'SECRET DSL', data: null }, 500)
        : response({
            code: 0,
            message: 'success',
            data: { total: 0, canvas: [] },
          })
    await open({ pipeline_id: pipelineId })
    await settle()
    expect(document.body.textContent).toContain(pipelineId)
    expect(document.body.textContent).toContain('selection is retained')
    expect(document.body.textContent).not.toContain('SECRET')
    expect(modal.document?.pipeline_id).toBe(pipelineId)
  }
})

it('switching from a pipeline to its retained builtin sends an explicit mode change and keeps its stored configuration', async () => {
  wire = canonical({ pipeline_id: pipelineId })
  await open({ pipeline_id: pipelineId })
  await settle()
  const builtin = document.querySelector<HTMLButtonElement>('[role="radio"]')!
  await act(async () => builtin.click())
  await save()
  await settle()
  expect(writes()[0].body).toEqual({ chunk_method: 'naive', pipeline_id: '' })
  expect(wire.parser_config.opaque).toEqual({ preserve: 1 })
  expect(modal.open).toBe(false)
})

it('document MinerU fields retain both additional accepted languages and avoid submitting display defaults', async () => {
  for (const language of ['Bulgarian', 'Turkish']) {
    await open({
      parser_config: { layout_recognize: 'MinerU', mineru_lang: language },
    })
    expect(document.body.textContent).toContain(language)
    await save()
    expect(writes()).toHaveLength(0)
  }
})

it('a background refresh of the same document does not replace the open snapshot or draft', async () => {
  await open()
  await input(numeric('Overlap percentage'), '20')
  wire = canonical({ parser_config: { overlapped_percent: 0.3 } })
  await render()
  expect(numeric('Overlap percentage').value).toBe('20')
  expect(modal.document?.parser_config?.overlapped_percent).toBe(10)
})
