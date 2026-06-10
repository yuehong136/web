import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchArtifactBlob,
  getArtifactName,
  isArtifactUrl,
  resolveArtifactUrl,
} from '../MarkdownArtifact'
import { PreviewResourceErrorResult } from '@/lib/knowledge/preview-resource'

const withLocalStorageToken = async (
  token: string | null,
  run: () => void | Promise<void>,
) => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  )

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => (key === 'auth_token' ? token : null),
    },
  })

  try {
    await run()
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage')
    }
  }
}

const withFetch = async (
  handler: typeof fetch,
  run: () => void | Promise<void>,
) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler
  try {
    await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('isArtifactUrl only matches document artifact routes', () => {
  assert.equal(isArtifactUrl('/v1/document/artifact/chart.png'), true)
  assert.equal(
    isArtifactUrl('http://localhost:8000/v1/document/artifact/chart.png'),
    true,
  )
  assert.equal(isArtifactUrl('/v1/document/artifacts/chart.png'), false)
  assert.equal(isArtifactUrl('/v1/document/get/chart.png'), false)
  assert.equal(isArtifactUrl(undefined), false)
})

test('artifact names are derived from fallback, relative and absolute URLs', () => {
  assert.equal(
    getArtifactName('/v1/document/artifact/chart%201.png'),
    'chart 1.png',
  )
  assert.equal(
    getArtifactName(
      'http://localhost:8000/v1/document/artifact/report.csv?download=1',
    ),
    'report.csv',
  )
  assert.equal(
    getArtifactName('/v1/document/artifact/chart.png', 'Plot'),
    'Plot',
  )
  assert.equal(getArtifactName(undefined), 'artifact')
})

test('resolveArtifactUrl maps relative artifact URLs to the API base URL', () => {
  assert.equal(
    resolveArtifactUrl('/v1/document/artifact/chart.png?x=1'),
    'http://localhost:8000/v1/document/artifact/chart.png?x=1',
  )
  assert.equal(
    resolveArtifactUrl('http://api.example/v1/document/artifact/chart.png'),
    'http://api.example/v1/document/artifact/chart.png',
  )
})

test('fetchArtifactBlob sends the auth header and returns a validated blob', async () => {
  await withLocalStorageToken('token-1', async () => {
    await withFetch(
      (async (input, init) => {
        assert.equal(
          input,
          'http://localhost:8000/v1/document/artifact/chart.png',
        )
        assert.equal(
          (init?.headers as Headers).get('Authorization'),
          'Bearer token-1',
        )
        return new Response(new Blob(['image-bytes'], { type: 'image/png' }), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      }) as typeof fetch,
      async () => {
        const blob = await fetchArtifactBlob('/v1/document/artifact/chart.png')
        assert.equal(blob.size, 11)
        assert.equal(blob.type, 'image/png')
      },
    )
  })
})

test('fetchArtifactBlob rejects JSON responses and empty files', async () => {
  await withFetch(
    (async () =>
      new Response(JSON.stringify({ retmsg: 'login required' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch,
    async () => {
      await assert.rejects(
        () => fetchArtifactBlob('/v1/document/artifact/error.png'),
        (error) =>
          error instanceof PreviewResourceErrorResult &&
          error.reason === 'json-error' &&
          error.message === 'login required',
      )
    },
  )

  await withFetch(
    (async () =>
      new Response(new Blob([], { type: 'image/png' }), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })) as typeof fetch,
    async () => {
      await assert.rejects(
        () => fetchArtifactBlob('/v1/document/artifact/empty.png'),
        (error) =>
          error instanceof PreviewResourceErrorResult &&
          error.reason === 'empty-resource',
      )
    },
  )
})
