import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { memoryAPI } from '@/api/memory'
import { MemoryIncrementalPage } from '@/pages/memory/memory-incremental-page'
import type { MemoryCapabilities } from '@/types/memory-revisions'
import type {
  MemoryDiscovery,
  MemoryDiscoveryPreview,
  MemoryDiscoveryProfile,
} from '@/types/memory-incremental'

export const caps: MemoryCapabilities = {
  revisions: {
    supported: true,
    managed: true,
    activation_scope: 'memory_bank',
    ordinary_writes_after_activation: true,
    managed_delete_supported: true,
    max_content_bytes: 65535,
    max_content_tokens: 8192,
  },
  maintenance: {
    supported: true,
    modes: ['dream'],
    candidate_review_required: true,
    actions: ['add', 'patch', 'noop'],
    requires_registered_sources: true,
    automatic_publication: false,
    max_sources: 32,
    max_candidates: 32,
    max_publication_candidates: 16,
    execution: 'persistent_background',
    discoveries: {
      supported: true,
      registered_active_only: true,
      max_sources: 256,
      max_batch_sources: 32,
      max_runs_per_request: 8,
      expected_preview_hash_required: true,
      token_fit: 'not_checked',
    },
  },
}
export const source = (id = '9007199254740993') => ({
  source_id: id,
  source_revision: '9007199254740995',
  source_generation: '9007199254740997',
  content_sha256: 'a'.repeat(64),
})
export const profile = (): MemoryDiscoveryProfile => ({
  scope: { user_id: null, agent_id: null, session_id: null },
  policy: 'general',
  input_budget_tokens: 16384,
  output_budget_tokens: 4096,
  strategy_sha256: 'b'.repeat(64),
  model_reference: 'controlled@fixture',
  config_reference: 'c'.repeat(64),
  entries: [],
  context_sources: [],
})
export const newPreview = (): MemoryDiscoveryPreview => ({
  preview_sha256: 'd'.repeat(64),
  profile_sha256: 'e'.repeat(64),
  profile: profile(),
  counts: {
    active: 2,
    covered: 0,
    inflight: 0,
    blocked: 0,
    eligible: 2,
    selected_primary: 2,
    context: 0,
  },
  batches: [source(), source('9007199254741001')].map((item, index) => ({
    ordinal: index + 1,
    primary_sources: [item],
    context_sources: [],
    entry_ids: [],
  })),
  has_more: false,
  registered_active_only: true,
  token_fit: 'not_checked',
})
export const newDiscovery = (): MemoryDiscovery => ({
  ...newPreview(),
  discovery_id: 'a'.repeat(32),
  operation_id: 'create-original',
  state: 'planned',
  progress: {
    planned: 2,
    created: 0,
    submitted: 0,
    running: 0,
    analyzed: 0,
    failed: 0,
    canceled: 0,
    blocked: 0,
    pending: 2,
  },
  batches: newPreview().batches.map((batch, index) => ({
    ...batch,
    batch_id: String(index + 1).repeat(32),
    state: 'planned',
    create_operation_id: `create-child-${index}`,
    analysis_operation_id: `analyze-child-${index}`,
    job_id: String(index + 3).repeat(32),
    job_state: null,
    error_code: null,
    execution: null,
  })),
  created_at: '2026-11-15T12:00:00Z',
  updated_at: '2026-11-15T12:00:00Z',
})

export class IncrementalHarness {
  host: HTMLDivElement
  root: Root
  cache: QueryClient
  preview = newPreview()
  discovery = newDiscovery()
  plans: MemoryDiscovery[] = []
  constructor() {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    this.host = document.createElement('div')
    document.body.append(this.host)
    this.root = createRoot(this.host)
    this.cache = this.newCache()
    vi.spyOn(memoryAPI.revision, 'capabilities').mockResolvedValue(
      structuredClone(caps),
    )
    vi.spyOn(memoryAPI.incremental, 'list').mockImplementation(
      async (_mid, operationId) => ({
        discoveries: structuredClone(
          this.plans.filter(
            (item) => !operationId || item.operation_id === operationId,
          ),
        ),
      }),
    )
    vi.spyOn(memoryAPI.incremental, 'preview').mockImplementation(async () =>
      structuredClone(this.preview),
    )
    vi.spyOn(memoryAPI.incremental, 'create').mockImplementation(
      async (_mid, command) => {
        this.discovery = {
          ...this.discovery,
          operation_id: command.operation_id,
        }
        this.plans = [this.discovery]
        return structuredClone(this.discovery)
      },
    )
    vi.spyOn(memoryAPI.incremental, 'discovery').mockImplementation(async () =>
      structuredClone(this.discovery),
    )
    vi.spyOn(memoryAPI.incremental, 'run').mockImplementation(async () =>
      structuredClone(this.discovery),
    )
    vi.spyOn(memoryAPI.incremental, 'cancel').mockImplementation(async () =>
      structuredClone(this.discovery),
    )
    vi.spyOn(memoryAPI.dreaming, 'run').mockRejectedValue(
      new Error('Only parent explicit submission is allowed'),
    )
    vi.spyOn(memoryAPI.dreaming, 'publish').mockRejectedValue(
      new Error('No automatic publication'),
    )
  }
  newCache() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  }
  async render(url = '/memory/bank/maintenance/batches', extra?: ReactNode) {
    await act(async () =>
      this.root.render(
        <MemoryRouter initialEntries={[url]}>
          <QueryClientProvider client={this.cache}>
            <Routes>
              <Route
                path="/memory/:id/maintenance/batches"
                element={
                  <>
                    <MemoryIncrementalPage />
                    <LocationProbe />
                    {extra}
                  </>
                }
              />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>,
      ),
    )
  }
  async reload() {
    const url = this.url()
    await act(async () => this.root.unmount())
    this.cache.clear()
    this.cache = this.newCache()
    this.root = createRoot(this.host)
    await this.render(url)
  }
  url() {
    return this.host.querySelector('[data-location]')!.textContent!
  }
  button(key: string) {
    return [...this.host.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent === key,
    )!
  }
  async click(key: string) {
    await act(async () => this.button(key).click())
  }
  async fill(selector: string, value: string) {
    const element = this.host.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(selector)!
    await act(async () => {
      const prototype =
        element.tagName === 'TEXTAREA'
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
        element,
        value,
      )
      element.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  async dispose() {
    await act(async () => this.root.unmount())
    this.cache.clear()
    this.host.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
  }
}
function LocationProbe() {
  const location = useLocation()
  return (
    <output data-location>
      {location.pathname}
      {location.search}
    </output>
  )
}
