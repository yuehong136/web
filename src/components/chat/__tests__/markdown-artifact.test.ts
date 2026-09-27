import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ComponentProps } from '@ant-design/x-markdown'
import {
  MarkdownArtifactImage,
  MarkdownArtifactLink,
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

test('isArtifactUrl matches only exact old/new paths on the configured API origin', () => {
  for (const url of [
    '/v1/document/artifact/chart.png',
    '/api/v1/documents/artifact/chart.png?session_id=session-1',
    'http://localhost:8000/v1/document/artifact/chart.png',
    'http://localhost:8000/api/v1/documents/artifact/chart.png',
  ]) {
    assert.equal(isArtifactUrl(url), true, url)
  }

  for (const url of [
    '/v1/document/artifacts/chart.png',
    '/v1/document/get/chart.png',
    '/api/v1/documents/artifact/chart.png/extra',
    '/api/v1/documents/artifact/chart%2Fextra.png',
    '/api/v1/documents/artifact/',
    'https://outside.example/api/v1/documents/artifact/chart.png',
    'http://localhost:8000.evil.example/v1/document/artifact/chart.png',
    'http://other@localhost:8000/v1/document/artifact/chart.png',
    '//outside.example/v1/document/artifact/chart.png',
    '//localhost:8000/v1/document/artifact/chart.png',
    'https://outside.example/?next=/v1/document/artifact/chart.png',
    'javascript:alert(1)',
    undefined,
  ]) {
    assert.equal(isArtifactUrl(url), false, String(url))
  }
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

test('resolveArtifactUrl preserves queries for old and new API routes', () => {
  assert.equal(
    resolveArtifactUrl('/v1/document/artifact/chart.png?x=1'),
    'http://localhost:8000/v1/document/artifact/chart.png?x=1',
  )
  assert.equal(
    resolveArtifactUrl(
      '/api/v1/documents/artifact/chart.png?session_id=session-1&download=1',
    ),
    'http://localhost:8000/api/v1/documents/artifact/chart.png?session_id=session-1&download=1',
  )
  assert.equal(
    resolveArtifactUrl('http://localhost:8000/v1/document/artifact/chart.png'),
    'http://localhost:8000/v1/document/artifact/chart.png',
  )
  assert.throws(
    () =>
      resolveArtifactUrl(
        'https://outside.example/api/v1/documents/artifact/chart.png',
      ),
    TypeError,
  )
})

test('external artifact-shaped links and images stay ordinary markup', () => {
  const url = 'https://outside.example/api/v1/documents/artifact/chart.png'
  const markdownProps = {
    domNode: {} as ComponentProps['domNode'],
    streamStatus: 'done' as const,
  }
  const link = renderToStaticMarkup(
    createElement(
      MarkdownArtifactLink,
      { ...markdownProps, href: url },
      'Outside',
    ),
  )
  const image = renderToStaticMarkup(
    createElement(MarkdownArtifactImage, {
      ...markdownProps,
      src: url,
      alt: 'Outside',
    }),
  )
  assert.match(link, /<a href="https:\/\/outside\.example\//)
  assert.match(image, /<img src="https:\/\/outside\.example\//)
  assert.doesNotMatch(link, /Opening artifact/)
  assert.doesNotMatch(image, /Loading artifact image/)
})

test('fetchArtifactBlob sends auth only for old/new API URLs', async () => {
  await withLocalStorageToken('token-1', async () => {
    const seen: string[] = []
    await withFetch(
      (async (input, init) => {
        seen.push(String(input))
        assert.equal(
          (init?.headers as Headers).get('Authorization'),
          'Bearer token-1',
        )
        assert.equal(init?.redirect, 'error')
        return new Response(new Blob(['image-bytes'], { type: 'image/png' }), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      }) as typeof fetch,
      async () => {
        for (const url of [
          '/v1/document/artifact/chart.png',
          '/api/v1/documents/artifact/chart.png?session_id=session-1',
        ]) {
          const blob = await fetchArtifactBlob(url)
          assert.equal(blob.size, 11)
          assert.equal(blob.type, 'image/png')
        }
      },
    )
    assert.deepEqual(seen, [
      'http://localhost:8000/v1/document/artifact/chart.png',
      'http://localhost:8000/api/v1/documents/artifact/chart.png?session_id=session-1',
    ])
  })
})

test('fetchArtifactBlob rejects external and protocol-relative URLs before fetch', async () => {
  await withLocalStorageToken('token-1', async () => {
    let fetchCount = 0
    await withFetch(
      (async () => {
        fetchCount += 1
        throw new Error('Unexpected fetch')
      }) as typeof fetch,
      async () => {
        for (const url of [
          'https://outside.example/api/v1/documents/artifact/chart.png',
          '//outside.example/v1/document/artifact/chart.png',
          '//localhost:8000/api/v1/documents/artifact/chart.png',
        ]) {
          await assert.rejects(() => fetchArtifactBlob(url), TypeError)
        }
      },
    )
    assert.equal(fetchCount, 0)
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
