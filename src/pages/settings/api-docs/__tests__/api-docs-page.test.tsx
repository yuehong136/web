// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createQueryClient } from '@/lib/query-client'
import { setProductLanguage } from '@/locales/i18n'
import { ApiDocsPage } from '../api-docs-page'
import {
  buildCurlExample,
  groupEndpoints,
  resolveBaseUrl,
  schemaType,
} from '../api-schema'
import type { OpenAPISpec } from '@/types/api'

const spec: OpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Workspace API', version: '2.1' },
  paths: {
    '/api/v1/chats': {
      get: {
        operationId: 'list_chats',
        summary: 'List chats',
        tags: ['chat'],
        description: 'Returns **all** chats. <img src=x onerror="alert(1)">',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
        ],
      },
      post: {
        operationId: 'create_chat',
        summary: 'Create chat',
        tags: ['chat'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Chat' },
              example: { name: "it's" },
            },
          },
        },
        responses: { '200': { description: 'Created' } },
      },
    },
    '/api/v1/datasets': {
      get: {
        operationId: 'list_datasets',
        summary: 'List datasets',
        tags: ['dataset'],
      },
    },
  },
  components: {
    schemas: {
      Chat: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Chat name' },
          tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
        },
      },
      Tag: { type: 'string' },
    },
  },
}

const mocks = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('@/pages/settings/api-documentation-data', async (original) => ({
  ...(await original<
    typeof import('@/pages/settings/api-documentation-data')
  >()),
  loadApiSpecification: mocks.load,
}))
vi.mock('@/hooks/use-environment-request', () => {
  const resolver = {
    currentEnvironment: { base_url: 'https://api.test/' },
    selectEnvironment: () => {},
    getVariableMap: () => ({}),
    resolveText: (text: string) => text,
  }
  return { useEnvironmentResolver: () => resolver }
})
vi.mock('@/components/environment', () => ({
  ModernEnvironmentSelector: () => null,
  NewEnvironmentManager: () => null,
}))

let root: Root
let container: HTMLDivElement
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const render = async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={createQueryClient()}>
        <ApiDocsPage />
      </QueryClientProvider>,
    ),
  )
  for (let i = 0; i < 20 && !container.querySelector('[data-api-section]'); i++)
    await flush()
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  mocks.load.mockResolvedValue({ spec, source: 'static' })
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.clearAllMocks()
})

it('lists every endpoint in the contents and renders the document beside it', async () => {
  await render()
  const toc = container.querySelector('nav[aria-label="API contents"]')!
  expect(
    Array.from(toc.querySelectorAll('a')).map((link) => link.textContent),
  ).toEqual(['GETList chats', 'POSTCreate chat', 'GETList datasets'])
  expect(toc.textContent).toContain('Chat')
  expect(toc.textContent).toContain('Datasets')
  expect(container.querySelectorAll('[data-api-section]')).toHaveLength(3)
  expect(container.textContent).toContain('https://api.test/api/v1/chats')
  expect(container.textContent).toContain('Bundled copy')
  // No request runner: the docs only describe requests.
  expect(
    Array.from(container.querySelectorAll('button')).map((b) => b.textContent),
  ).not.toContain('Run')
})

it('renders descriptions as Markdown with raw HTML shown as text', async () => {
  await render()
  const section = container.querySelector('#api-list_chats')!
  expect(section.querySelector('strong')?.textContent).toBe('all')
  expect(section.querySelector('img')).toBeNull()
  expect(section.textContent).toContain('<img src=x onerror="alert(1)">')
})

it('scrolls to an endpoint from the contents and marks it current', async () => {
  await render()
  const target = container.querySelector<HTMLElement>('#api-list_datasets')!
  target.scrollIntoView = vi.fn()
  const link = container.querySelector<HTMLAnchorElement>(
    'a[href="#api-list_datasets"]',
  )!
  await act(async () => link.click())
  expect(target.scrollIntoView).toHaveBeenCalledOnce()
  expect(link.getAttribute('aria-current')).toBe('location')
})

it('filters the contents and the document together', async () => {
  await render()
  const search = container.querySelector<HTMLInputElement>(
    'input[aria-label="Search endpoints"]',
  )!
  await act(async () => {
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!
    set!.call(search, 'dataset')
    search.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(container.querySelectorAll('[data-api-section]')).toHaveLength(1)
  expect(container.querySelectorAll('nav a')).toHaveLength(1)
})

it('explains a fallback to the bundled copy with fixed wording', async () => {
  mocks.load.mockResolvedValue({
    spec,
    source: 'static',
    warning: 'dynamic-fallback',
  })
  await render()
  expect(container.textContent).toContain(
    'The live specification could not be loaded, so the bundled copy is shown.',
  )
  expect(container.textContent).not.toContain('dynamic-fallback')
})

it('resolves schema references, groups by tag and quotes curl bodies', () => {
  expect(
    schemaType(spec, {
      type: 'array',
      items: { $ref: '#/components/schemas/Tag' },
    }),
  ).toBe('array<string>')
  expect(schemaType(spec, { $ref: '#/components/schemas/Missing' })).toBe(
    'Missing',
  )
  const loop: OpenAPISpec = {
    ...spec,
    components: { schemas: { A: { $ref: '#/components/schemas/A' } } },
  }
  expect(schemaType(loop, { $ref: '#/components/schemas/A' })).toBe('A')
  expect(
    groupEndpoints(
      [
        { id: 'a', summary: 'A', method: 'GET', path: '/a' },
        { id: 'b', summary: 'B', method: 'GET', path: '/b', tags: ['x'] },
      ],
      '',
      'Other',
    ).map((group) => group.tag),
  ).toEqual(['Other', 'x'])
  expect(buildCurlExample('POST', 'https://h/x', { name: "it's" })).toContain(
    `-d '{"name":"it'\\''s"}'`,
  )
  expect(
    resolveBaseUrl(undefined, { BASE_URL: 'https://v/' }, 'https://o'),
  ).toBe('https://v')
  expect(resolveBaseUrl(undefined, {}, 'https://o')).toBe('https://o')
})
