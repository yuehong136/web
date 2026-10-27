import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  categorizePreviewFailure,
  type PreviewErrorCategory,
} from '../preview-error'
import {
  assertNonEmptyBlob,
  assertPreviewResponse,
  getPreviewErrorCategory,
  PreviewResourceErrorResult,
} from '../preview-resource'
import { APIError } from '@/api/client-types'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'text/html' } })

const caught = async (run: () => unknown): Promise<unknown> => {
  try {
    await run()
  } catch (error) {
    return error
  }
  throw new Error('expected the call to fail')
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('preview failure categories', () => {
  // 前四项是本地 MultiRAG `GET /v1/document/get/{doc_id}` 的实际响应形状
  it.each<[string, Response, PreviewErrorCategory, string]>([
    [
      'a missing document',
      json({ code: 101, message: 'Document not found!', data: false }),
      'not-found',
      'Document not found!',
    ],
    [
      'a document the user cannot access',
      json({ retcode: 109, retmsg: 'No authorization.', data: false }),
      'forbidden',
      'No authorization.',
    ],
    [
      'a download without permission',
      json({
        retcode: 108,
        retmsg: 'No download permission. Please contact your administrator.',
        data: false,
      }),
      'forbidden',
      'No download permission',
    ],
    [
      'an expired token',
      json({ code: 401, message: 'Invalid credentials', data: null }, 401),
      'session-expired',
      'Invalid credentials',
    ],
    [
      'a login page served instead of the file',
      html('<p>Sign in to continue</p>'),
      'session-expired',
      'Sign in to continue',
    ],
    [
      'a forbidden status',
      json({ detail: 'Blocked by gateway policy' }, 403),
      'forbidden',
      'Blocked by gateway policy',
    ],
    [
      'an unknown route',
      json({ code: 404, message: 'Not Found: /v1/document/get/x' }, 404),
      'not-found',
      'Not Found: /v1',
    ],
    [
      'a storage failure',
      json({ code: 100, message: 'File not found in storage' }),
      'unavailable',
      'File not found in storage',
    ],
    [
      'a gateway error page',
      html('<p>Bad gateway</p>', 502),
      'unavailable',
      'Bad gateway',
    ],
  ])(
    'classifies %s without keeping backend text',
    async (_, response, category, backendText) => {
      const error = await caught(() => assertPreviewResponse(response))

      expect(error).toBeInstanceOf(PreviewResourceErrorResult)
      expect(getPreviewErrorCategory(error)).toBe(category)
      expect((error as Error).message).not.toContain(backendText)
      expect(JSON.stringify(error)).not.toContain(backendText)
    },
  )

  it('ranks an expired session before permission and existence', () => {
    expect(categorizePreviewFailure({ status: 401, code: 109 })).toBe(
      'session-expired',
    )
    expect(categorizePreviewFailure({ status: 404, code: 109 })).toBe(
      'forbidden',
    )
    expect(categorizePreviewFailure({ status: 200, code: 403 })).toBe(
      'forbidden',
    )
    expect(categorizePreviewFailure({ status: 200, code: 404 })).toBe(
      'not-found',
    )
    expect(categorizePreviewFailure({ status: 500 })).toBe('unavailable')
    expect(categorizePreviewFailure({})).toBe('unavailable')
  })

  it('treats an empty file as unsupported', async () => {
    const error = await caught(() => assertNonEmptyBlob(new Blob()))

    expect(getPreviewErrorCategory(error)).toBe('unsupported')
  })

  it('treats network failures and unknown errors as unavailable', () => {
    expect(getPreviewErrorCategory(new TypeError('Failed to fetch'))).toBe(
      'unavailable',
    )
    expect(getPreviewErrorCategory('boom')).toBe('unavailable')
  })

  it('lets file responses through', async () => {
    await expect(
      assertPreviewResponse(
        new Response('%PDF-1.7', {
          headers: { 'content-type': 'application/pdf' },
        }),
      ),
    ).resolves.toBeUndefined()
  })
})

describe('document download', () => {
  // 下载走 REST 文件端点（knowledgeAPI.document.download），失败以 HTTP 状态表达
  it.each<[number, PreviewErrorCategory]>([
    [401, 'session-expired'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [500, 'unavailable'],
  ])(
    'classifies a %i download failure without its backend text',
    (status, category) => {
      const error = new APIError(status, 'ERR', 'No download permission.')
      expect(getPreviewErrorCategory(error)).toBe(category)
    },
  )
})
