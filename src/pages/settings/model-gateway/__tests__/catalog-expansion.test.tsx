// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { GatewayCatalog, GatewayCatalogModel } from '@/api/model-gateway'
import { createQueryClient } from '@/lib/query-client'
import { setProductLanguage } from '@/locales/i18n'
import { ScopeTree } from '../components/key-form/scope-tree'
import { ModelsPanel } from '../components/models/models-panel'
import {
  EXPAND_ALL_MAX_MODELS,
  normalizeChosen,
  useCatalogExpansionStore,
} from '../expansion'

const model = (
  instance: string,
  index: number,
  requests = 0,
): GatewayCatalogModel => ({
  model_id: `${instance}-${index}`.padStart(32, '0'),
  model_name: `${instance}-model-${index}`,
  provider: instance === 'tq' ? 'Tongyi-Qianwen' : 'VLLM',
  instance_id: instance,
  instance_name: 'default',
  model_types: ['chat'],
  servable_types: ['chat'],
  state: 'callable',
  reason: null,
  enabled: true,
  enabled_by_default: true,
  call_name: `${instance}-model-${index}`,
  names: [`${instance}-model-${index}`],
  alias: null,
  preferred: false,
  shares_name: false,
  description: null,
  rpm_limit: null,
  tpm_limit: null,
  max_parallel_requests: null,
  requests_7d: requests,
})

const catalogOf = (perConnection: number): GatewayCatalog => ({
  new_models_enabled: true,
  connections: [
    { instance_id: 'tq', instance_name: 'default', provider: 'Tongyi-Qianwen' },
    { instance_id: 'vl', instance_name: 'default', provider: 'VLLM' },
  ],
  models: ['tq', 'vl'].flatMap((instance) =>
    Array.from({ length: perConnection }, (_, index) =>
      model(instance, index, instance === 'tq' && index === 0 ? 1200 : 0),
    ),
  ),
})

let root: Root
let container: HTMLDivElement

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
const card = (provider: string) =>
  document.querySelector<HTMLElement>(`[aria-label="${provider} · default"]`)!
const trigger = (provider: string) =>
  card(provider).querySelector<HTMLButtonElement>('h3 button')!
const rows = (provider: string) =>
  card(provider).querySelectorAll('tbody tr').length
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent?.trim() === text,
  )!
const click = async (element: HTMLElement) => {
  await act(async () => element.click())
  await flush()
}
const search = (value: string) =>
  act(async () => {
    const field = document.querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })

async function renderPanel(catalog: GatewayCatalog) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter>
          <ModelsPanel catalog={catalog} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  localStorage.clear()
  useCatalogExpansionStore.setState({ chosen: {} })
  await setProductLanguage('en-US')
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('opens a short catalog expanded', async () => {
  await renderPanel(catalogOf(EXPAND_ALL_MAX_MODELS / 2))
  expect(trigger('VLLM').getAttribute('aria-expanded')).toBe('true')
  expect(rows('VLLM')).toBe(EXPAND_ALL_MAX_MODELS / 2)
})

it('opens a long catalog collapsed, with the counts on each header', async () => {
  await renderPanel(catalogOf(10))
  expect(trigger('Tongyi-Qianwen').getAttribute('aria-expanded')).toBe('false')
  expect(rows('Tongyi-Qianwen')).toBe(0)
  expect(card('Tongyi-Qianwen').textContent).toContain('10 / 10 models open')
  expect(card('Tongyi-Qianwen').textContent).toContain(
    '1,200 requests in 7 days',
  )

  await click(trigger('Tongyi-Qianwen'))
  expect(rows('Tongyi-Qianwen')).toBe(10)
  expect(rows('VLLM')).toBe(0)
  // The pick is a stored preference.
  expect(useCatalogExpansionStore.getState().chosen).toEqual({ tq: true })

  await click(button('Collapse all'))
  expect(rows('Tongyi-Qianwen')).toBe(0)
  await click(button('Expand all'))
  expect(rows('Tongyi-Qianwen')).toBe(10)
  expect(rows('VLLM')).toBe(10)
})

it('opens what a search finds and restores the picks afterwards', async () => {
  await renderPanel(catalogOf(10))
  await search('vl-model-3')
  expect(
    document.querySelector('[aria-label="Tongyi-Qianwen · default"]'),
  ).toBe(null)
  expect(rows('VLLM')).toBe(1)
  expect(card('VLLM').textContent).toContain('1 matches the filters')

  await click(trigger('VLLM'))
  expect(rows('VLLM')).toBe(0)
  await search('')
  expect(trigger('VLLM').getAttribute('aria-expanded')).toBe('false')
  expect(useCatalogExpansionStore.getState().chosen).toEqual({})
})

it('drops stored values that are not booleans', () => {
  expect(normalizeChosen({ a: true, b: 'yes', c: false })).toEqual({
    a: true,
    c: false,
  })
  expect(normalizeChosen(null)).toEqual({})
})

it('opens only the connections with picked models in a long scope tree', async () => {
  const catalog = catalogOf(10)
  await act(async () =>
    root.render(
      <ScopeTree
        catalog={catalog}
        scope={{
          allModels: false,
          instanceIds: ['tq'],
          modelIds: [catalog.models[12].model_id],
        }}
        onChange={() => {}}
      />,
    ),
  )
  const toggles = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
  )
  // A whole connection needs no model list; single picks must be visible.
  expect(toggles.map((item) => item.getAttribute('aria-expanded'))).toEqual([
    'false',
    'true',
  ])
  await click(toggles[0])
  expect(toggles[0].getAttribute('aria-expanded')).toBe('true')
})
