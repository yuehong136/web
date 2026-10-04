import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { apiClient, APIError } from '@/api/client'
import { setProductLanguage } from '@/locales/i18n'
import type { Document } from '@/types/api'
import { useDocumentPageModals } from '../hooks/use-document-page-modals'
import { DocumentPageModals } from '../components/document-page-modals'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
// Parser controls are unrelated to this regression. Keep the real form owner,
// metadata dialogs, page-modal wiring, mutation hooks and domain API.
vi.mock('@/pages/knowledge/settings/ChunkMethodForm', () => ({
  ChunkMethodForm: ({
    onMetadataSettingsClick,
    metadataCount,
  }: {
    onMetadataSettingsClick: () => void
    metadataCount?: number
  }) => {
    const form = useFormContext()
    return (
      <>
        <button
          type="button"
          onClick={() =>
            form.setValue('parser_config.chunk_token_num', 321, {
              shouldDirty: true,
            })
          }
        >
          Change chunk size
        </button>
        <button type="button" onClick={onMetadataSettingsClick}>
          Metadata settings ({metadataCount})
        </button>
      </>
    )
  },
}))

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
type Props = Parameters<typeof DocumentPageModals>[0]
let root: Root
let container: HTMLDivElement
let client: QueryClient
let modals: ReturnType<typeof useDocumentPageModals>
let stored: Document
let refetch: ReturnType<typeof vi.fn>
let puts: Array<Record<string, unknown>>
let patches: Array<Record<string, unknown>>

function snapshot(): Document {
  const result = structuredClone(stored)
  const metadata = result.parser_config?.metadata
  // Match the real document-list read contract, rather than echoing the PUT.
  if (Array.isArray(metadata) && metadata.length) {
    result.parser_config!.metadata = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        metadata.map(({ key, description, enum: values }) => [
          key,
          {
            description: description ?? '',
            ...(values?.length ? { type: 'string', enum: values } : {}),
          },
        ]),
      ),
    }
  }
  return result
}
function canonicalSnapshot() {
  return {
    ...stored,
    dataset_id: stored.kb_id,
    chunk_method: stored.parser_id,
    chunk_count: stored.chunk_num,
    token_count: stored.token_num,
    run: 'DONE',
  }
}
function Harness() {
  const listState = { refetch } as unknown as Props['listState']
  const pageModals = useDocumentPageModals({
    datasetId: 'kb-1',
    currentKnowledgeBase: null,
    listState,
    actions: {} as Parameters<typeof useDocumentPageModals>[0]['actions'],
  })
  useLayoutEffect(() => {
    modals = pageModals
  }, [pageModals])
  return (
    <>
      <button onClick={() => pageModals.handleShowChunkMethodModal(snapshot())}>
        Open parser
      </button>
      <DocumentPageModals
        kbId="kb-1"
        currentKnowledgeBase={null}
        listState={listState}
        pageModals={pageModals}
        logModal={{ logVisible: false, logInfo: {} } as Props['logModal']}
        generate={{ deleteConfirmOpen: false } as Props['generate']}
        navigate={vi.fn()}
        isRenaming={false}
      />
    </>
  )
}

async function render() {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Harness />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}
async function click(text: string) {
  const metadataDialog = [
    ...document.querySelectorAll('dialog, [role="dialog"]'),
  ].find((el) => el.textContent?.includes('Document metadata settings'))
  const scope = text === 'Cancel' ? (metadataDialog ?? document) : document
  const button = [...scope.querySelectorAll('button')].findLast(
    (el) => el.textContent?.trim() === text,
  )
  expect(button, text).toBeDefined()
  await act(async () => button!.click())
}
async function saveTopDialog() {
  const dialogs = [...document.querySelectorAll('dialog, [role="dialog"]')]
  const dialog =
    dialogs.find((el) =>
      el.textContent?.includes('Document metadata settings'),
    ) ?? dialogs.find((el) => el.textContent?.includes('Metadata settings ('))
  expect(dialog).toBeDefined()
  const buttons = [...dialog!.querySelectorAll('button')]
  const save = buttons.find((el) => el.textContent?.trim() === 'Save')
  expect(save).toBeDefined()
  await act(async () => save!.click())
}
async function addAuthor() {
  await click('Add field')
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="Letters and underscores only"]',
  )
  expect(input).toBeDefined()
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, 'author')
    input!.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await click('Confirm')
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
    id: 'doc-1',
    kb_id: 'kb-1',
    name: 'metadata.txt',
    type: 'doc',
    size: 1,
    pipeline_id: null,
    status: '1',
    run: '3',
    chunk_num: 0,
    token_num: 0,
    progress: 1,
    update_time: 1,
    parser_id: 'naive',
    parser_config: {
      metadata: [],
      built_in_metadata: [{ key: 'source' }],
      enable_metadata: false,
      chunk_token_num: 512,
    },
  } as unknown as Document
  puts = []
  patches = []
  refetch = vi.fn(async () => snapshot())
  vi.spyOn(apiClient, 'put').mockImplementation(async (_endpoint, payload) => {
    const data = payload as { metadata: unknown[] }
    puts.push(structuredClone(data))
    stored.parser_config = {
      ...stored.parser_config,
      metadata: structuredClone(data.metadata),
    }
    return undefined as never
  })
  vi.spyOn(apiClient, 'patch').mockImplementation(
    async (_endpoint, payload) => {
      const data = payload as { parser_config: Record<string, unknown> }
      patches.push(structuredClone(data))
      stored.parser_config = {
        ...stored.parser_config,
        ...structuredClone(data.parser_config),
      }
      return {
        retcode: 0,
        retmsg: 'success',
        data: canonicalSnapshot(),
      } as never
    },
  )
  vi.spyOn(apiClient, 'get').mockImplementation(
    async () =>
      ({
        retcode: 0,
        retmsg: 'success',
        data: { docs: [canonicalSnapshot()] },
      }) as never,
  )
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('retains saved metadata when reopening, saving the outer draft and remounting with server data', async () => {
  await click('Open parser')
  await click('Change chunk size')
  await click('Metadata settings (0)')
  await addAuthor()
  await saveTopDialog()
  expect(puts).toEqual([
    {
      metadata: [
        { key: 'author', type: 'string', description: '', enum: undefined },
      ],
    },
  ])
  expect(refetch).toHaveBeenCalled()
  await click('Metadata settings (1)')
  expect(document.body.textContent).toContain('author')
  await click('Cancel')
  await saveTopDialog()
  expect(patches[0].parser_config).toMatchObject({
    metadata: [{ key: 'author' }],
    chunk_token_num: 321,
  })
  expect(patches[0].parser_config).not.toHaveProperty('built_in_metadata')
  expect(patches[0].parser_config).not.toHaveProperty('enable_metadata')
  expect(stored.parser_config?.built_in_metadata).toEqual([{ key: 'source' }])
  expect(stored.parser_config?.enable_metadata).toBe(false)
  expect(JSON.stringify(patches)).not.toContain('restrictDefinedValues')
  await reload()
  await click('Open parser')
  await click('Metadata settings (1)')
  expect(document.body.textContent).toContain('author')
})

it('distinguishes an absent save result from an explicit empty array and resets for a new document session', async () => {
  stored.parser_config!.metadata = [{ key: 'author' }]
  await click('Open parser')
  await act(async () => modals.handleSingleFileMetadataSaved())
  await click('Metadata settings (1)')
  expect(document.body.textContent).toContain('author')
  await click('Cancel')
  await act(async () => modals.handleSingleFileMetadataSaved([]))
  await click('Metadata settings (0)')
  expect(document.body.textContent).not.toContain('author')
  await saveTopDialog()
  expect(puts).toEqual([{ metadata: [] }])
  await saveTopDialog()
  expect(stored.parser_config!.metadata).toEqual([])
  expect(stored.parser_config!.built_in_metadata).toEqual([{ key: 'source' }])
  await reload()
  await click('Open parser')
  await click('Metadata settings (0)')
  expect(document.body.textContent).not.toContain('author')
  await click('Cancel')
  await act(async () =>
    modals.handleShowChunkMethodModal({
      ...snapshot(),
      id: 'doc-2',
      parser_config: { metadata: [{ key: 'category' }] },
    }),
  )
  await click('Metadata settings (1)')
  expect(document.body.textContent).toContain('category')
})

it('keeps the metadata draft open on a business failure and does not update the outer form', async () => {
  vi.mocked(apiClient.put).mockRejectedValue(new APIError(200, '109', 'Denied'))
  await click('Open parser')
  await click('Metadata settings (0)')
  await addAuthor()
  await saveTopDialog()
  expect(modals.singleFileMetadataModalOpen).toBe(true)
  expect(document.body.textContent).toContain('author')
  expect(modals.savedMetadataSettings).toBeUndefined()
  expect(refetch).not.toHaveBeenCalled()
  expect(stored.parser_config!.metadata).toEqual([])
  await click('Cancel')
  await click('Metadata settings (0)')
  expect(document.body.textContent).not.toContain('author')
})
