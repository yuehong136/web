import { afterEach, expect, it, vi } from 'vitest'
import {
  convertToAPIEndpoints,
  loadApiSpecification,
} from '../api-documentation-data'
import { systemAPI } from '@/api/system'
import type { OpenAPISpec } from '@/types/api'
vi.mock('@/api/system', () => ({ systemAPI: { filterOpenAPI: vi.fn() } }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
it('falls back to static documentation when the filtered endpoint fails', async () => {
  vi.mocked(systemAPI.filterOpenAPI).mockRejectedValue(new Error('Unavailable'))
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ paths: {} }))),
  )
  const result = await loadApiSpecification(true)
  expect(result.source).toBe('static')
  expect(result.warning).toBeTruthy()
  expect(result.spec.paths).toEqual({})
})
it('does not start a fallback after cancellation', async () => {
  const controller = new AbortController()
  controller.abort()
  vi.mocked(systemAPI.filterOpenAPI).mockRejectedValue(new Error('Cancelled'))
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  await expect(loadApiSpecification(true, controller.signal)).rejects.toThrow(
    'Cancelled',
  )
  expect(fetch).not.toHaveBeenCalled()
})
it('converts operations while preserving request, response and security contracts', () => {
  const spec = {
    paths: {
      '/items': {
        get: {
          operationId: 'list-items',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              required: true,
              example: 0,
              schema: { type: 'integer', example: 10 },
            },
          ],
          responses: { '200': { description: 'OK' } },
          security: [{ bearer: [] }],
        },
      },
    },
  } as unknown as OpenAPISpec
  const [endpoint] = convertToAPIEndpoints(spec)
  expect(endpoint).toMatchObject({
    id: 'list-items',
    method: 'GET',
    path: '/items',
    parameters: [{ name: 'limit', required: true, example: 0 }],
    responses: [{ status: 200 }],
    security: [{ bearer: [] }],
  })
})
