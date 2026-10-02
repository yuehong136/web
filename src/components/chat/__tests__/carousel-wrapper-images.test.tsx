import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { CarouselWrapper } from '../CarouselWrapper'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { queryClient } from '@/lib/query-client'
import type { UserInfo } from '@/types/api'
import type { ReferenceChunk } from '@/utils/reference-replacer'

// Only force lazy carousel failure; fallback and binary transport are real.
vi.mock('../ImageCarousel', () => ({
  default: () => {
    throw new Error('controlled carousel failure')
  },
}))
const KB = 'a'.repeat(32)
const chunk: ReferenceChunk = {
  id: 'chunk',
  content: 'image',
  document_id: 'doc',
  document_name: 'doc',
  dataset_id: KB,
  image_id: `${KB}-x.png`,
  reference_index: 4,
  doc_type: 'image',
}
afterEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  apiClient.setAuthToken(null)
  queryClient.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('lazy failure fallback uses keyed reference and authenticated owned blob, with safe external navigation', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  URL.createObjectURL = vi.fn(() => 'blob:fallback')
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ close() {} })),
  )
  const fetch = vi.fn(
    async (_url: RequestInfo | URL, _config?: RequestInit) =>
      new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), {
        headers: { 'Content-Type': 'image/png' },
      }),
  )
  vi.stubGlobal('fetch', fetch)
  const open = vi.spyOn(window, 'open').mockReturnValue(null)
  apiClient.setAuthToken('test-token')
  useAuthStore.setState({
    user: { id: 'owner' } as UserInfo,
    token: 'test-token',
    isAuthenticated: true,
  })
  const el = document.createElement('div')
  document.body.append(el)
  const root = createRoot(el)
  const group = [{ id: '4', fullMatch: '[ID:4]', start: 0, end: 6 }]
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <CarouselWrapper
          group={group}
          chunks={[{ ...chunk, url: 'https://public.test/page' }]}
        />
      </QueryClientProvider>,
    )
    await new Promise((r) => setTimeout(r, 25))
  })
  await act(async () => new Promise((r) => setTimeout(r, 40)))
  expect(el.querySelector('img')?.src).toBe('blob:fallback')
  expect(String(fetch.mock.calls[0][0])).toContain('/api/v1/documents/images/')
  expect((fetch.mock.calls[0][1] as RequestInit).headers).toMatchObject({
    Authorization: 'Bearer test-token',
  })
  await act(async () => el.querySelector<HTMLButtonElement>('button')!.click())
  expect(open).toHaveBeenCalledWith(
    'https://public.test/page',
    '_blank',
    'noopener,noreferrer',
  )
  expect(fetch).toHaveBeenCalledTimes(1)
  await act(async () => root.unmount())
  el.remove()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fallback')
})
