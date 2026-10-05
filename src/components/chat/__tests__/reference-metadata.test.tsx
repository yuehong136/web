import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReferenceMetadataSettings } from '../reference-metadata-settings'
import { ReferenceMetadataBadges } from '../reference-metadata-badges'
import { knowledgeMetadataAPI } from '@/api/knowledge-metadata'
import type { ReferenceMetadataConfig } from '@/types/reference-metadata'

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/api/knowledge-metadata', () => ({
  knowledgeMetadataAPI: { getKeys: vi.fn() },
}))

let container: HTMLDivElement
let root: Root
let queryClient: QueryClient
beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  vi.mocked(knowledgeMetadataAPI.getKeys).mockResolvedValue(['author', 'year'])
})
afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  container.remove()
  vi.clearAllMocks()
})

describe('reference metadata controls', () => {
  it('preserves omitted fields, explicit none and selected values across toggles', async () => {
    let latest: ReferenceMetadataConfig = { include: true }
    function Harness() {
      const [value, setValue] = useState(latest)
      return (
        <ReferenceMetadataSettings
          datasetIds={['b', 'a']}
          value={value}
          onChange={(next) => {
            latest = next
            setValue(next)
          }}
        />
      )
    }
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      ),
    )
    expect(knowledgeMetadataAPI.getKeys).toHaveBeenCalledWith(['a', 'b'])
    expect(latest.fields).toBeUndefined()
    const toggles = () =>
      container.querySelectorAll<HTMLButtonElement>('[role="switch"]')
    await act(async () => toggles()[1].click())
    expect(latest).toEqual({ include: true, fields: [] })
    await act(async () => toggles()[0].click())
    expect(latest).toEqual({ include: false, fields: [] })
    await act(async () => toggles()[0].click())
    expect(latest.fields).toEqual([])
    await act(async () => toggles()[1].click())
    expect(latest.fields).toBeNull()
  })

  it('shows failed key loading without clearing the saved selection', async () => {
    vi.mocked(knowledgeMetadataAPI.getKeys).mockRejectedValue(
      new Error('offline'),
    )
    const change = vi.fn()
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <ReferenceMetadataSettings
            datasetIds={['a']}
            value={{ include: true, fields: ['saved'] }}
            onChange={change}
          />
        </QueryClientProvider>,
      ),
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'referenceMetadata.error',
    )
    expect(container.textContent).toContain('saved')
    expect(change).not.toHaveBeenCalled()
  })

  it('renders structured metadata safely as text, including false and zero', async () => {
    await act(async () =>
      root.render(
        <ReferenceMetadataBadges
          metadata={{
            html: '<img src=x onerror=alert(1)>',
            zero: 0,
            flag: false,
            list: ['a', 'b'],
            nested: { key: 'value' },
          }}
        />,
      ),
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(container.textContent).toContain('zero: 0')
    expect(container.textContent).toContain('flag: false')
    expect(container.textContent).toContain('{"key":"value"}')
  })
})
