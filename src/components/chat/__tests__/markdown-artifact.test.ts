import { isSafeMarkdownImageSource } from '@/components/chat/markdown-image-source'
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
  openArtifactResource,
  resolveArtifactUrl,
  shouldForceArtifactDownload,
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
    '/api/v1/documents/artifact/chart.png?run_id=run-1&session_id=session-1',
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
      '/api/v1/documents/artifact/chart.png?run_id=run-1&session_id=session-1',
    ),
    'http://localhost:8000/api/v1/documents/artifact/chart.png?run_id=run-1&session_id=session-1',
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
          '/v1/document/artifact/chart.png?run_id=run-1&session_id=session-1',
          '/api/v1/documents/artifact/chart.png?run_id=run-1&session_id=session-1',
        ]) {
          const blob = await fetchArtifactBlob(url)
          assert.equal(blob.size, 11)
          assert.equal(blob.type, 'image/png')
        }
      },
    )
    assert.deepEqual(seen, [
      'http://localhost:8000/v1/document/artifact/chart.png?run_id=run-1&session_id=session-1',
      'http://localhost:8000/api/v1/documents/artifact/chart.png?run_id=run-1&session_id=session-1',
    ])
  })
})

test('fetchArtifactBlob accepts authorized JSON and HTML artifact files', async () => {
  for (const [extension, contentType, disposition, contents] of [
    ['json', 'application/json', 'inline', '{"chart":1}'],
    ['html', 'text/html', 'attachment', '<h1>Chart</h1>'],
  ]) {
    await withFetch(
      (async () =>
        new Response(contents, {
          status: 200,
          headers: {
            'content-type': contentType,
            'content-disposition': `${disposition}; filename="1234.${extension}"`,
          },
        })) as typeof fetch,
      async () => {
        const blob = await fetchArtifactBlob(
          `/api/v1/documents/artifact/1234.${extension}?run_id=run-1`,
        )
        assert.equal(await blob.text(), contents)
      },
    )
  }
})

test('active artifact formats are downloaded instead of opened as app-origin blobs', () => {
  assert.equal(
    shouldForceArtifactDownload(
      new Blob(['<script></script>'], { type: 'text/html' }),
      'report.html',
    ),
    true,
  )
  assert.equal(
    shouldForceArtifactDownload(
      new Blob(['<svg/>'], { type: 'image/svg+xml' }),
      'diagram.svg',
    ),
    true,
  )
  assert.equal(
    shouldForceArtifactDownload(new Blob(['<svg/>']), 'diagram.svg'),
    true,
  )
  assert.equal(
    shouldForceArtifactDownload(
      new Blob(['png'], { type: 'image/png' }),
      'chart.png',
    ),
    false,
  )
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
      new Response('{"chart":1}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-disposition': 'inline; filename="other.json"',
        },
      })) as typeof fetch,
    async () => {
      await assert.rejects(
        () => fetchArtifactBlob('/api/v1/documents/artifact/report.json'),
        (error) =>
          error instanceof PreviewResourceErrorResult &&
          error.reason === 'json-error',
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

test('artifact links open or download once and clean up preview resources', async (t) => {
  for (const mode of [
    'preview',
    'blocked',
    'closed',
    'csv',
    'html',
    'svg',
    'failed',
    'navigation-failed',
  ] as const) {
    await t.test(mode, async () => {
      const extension = ['csv', 'html', 'svg'].includes(mode) ? mode : 'png'
      const href = `/api/v1/documents/artifact/report.${extension}`
      const types: Record<string, string> = {
        csv: 'text/csv',
        html: 'text/html',
        svg: 'image/svg+xml',
      }
      const type = types[mode] ?? 'image/png'
      const navigation: string[] = []
      const downloads: string[] = []
      const revoked: string[] = []
      const timers: (() => void)[] = []
      let opened = false
      let fetches = 0
      const popup = {
        opener: {} as unknown,
        closed: false,
        close: () => {
          popup.closed = true
        },
        location: {
          replace: (url: string) => {
            if (mode === 'navigation-failed')
              throw new Error('closed while fetching')
            navigation.push(url)
          },
        },
      }
      const descriptors = Object.fromEntries(
        ['window', 'document'].map((name) => [
          name,
          Object.getOwnPropertyDescriptor(globalThis, name),
        ]),
      )
      const originalCreate = URL.createObjectURL
      const originalRevoke = URL.revokeObjectURL
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
          open: () => {
            opened = true
            return mode === 'blocked' ? null : popup
          },
          setTimeout: (callback: () => void) => {
            timers.push(callback)
            return 1
          },
        },
      })
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: {
          createElement: () => {
            const anchor = {
              href: '',
              download: '',
              click: () => downloads.push(anchor.download),
            }
            return anchor
          },
          body: { appendChild: () => {}, removeChild: () => {} },
        },
      })
      URL.createObjectURL = () => 'blob:controlled'
      URL.revokeObjectURL = (url) => {
        revoked.push(url)
      }
      try {
        await withLocalStorageToken('controlled-token', async () => {
          await withFetch(
            (async (_url, init) => {
              fetches += 1
              assert.equal(opened, true)
              if (mode !== 'blocked') assert.equal(popup.opener, null)
              assert.equal(
                (init?.headers as Headers).get('Authorization'),
                'Bearer controlled-token',
              )
              if (mode === 'closed') popup.closed = true
              return new Response('controlled bytes', {
                status: mode === 'failed' ? 401 : 200,
                headers: {
                  'content-type': type,
                  'content-disposition': `inline; filename="report.${extension}"`,
                },
              })
            }) as typeof fetch,
            async () => {
              if (mode === 'failed' || mode === 'navigation-failed')
                await assert.rejects(() => openArtifactResource(href))
              else await openArtifactResource(href)
            },
          )
        })
        assert.equal(fetches, 1)
        assert.equal(navigation.length, mode === 'preview' ? 1 : 0)
        assert.equal(
          downloads.length,
          ['blocked', 'closed', 'csv', 'html', 'svg'].includes(mode) ? 1 : 0,
        )
        if (downloads.length) assert.equal(downloads[0], `report.${extension}`)
        assert.equal(popup.closed, mode !== 'preview' && mode !== 'blocked')
        if (mode === 'preview') {
          assert.deepEqual(revoked, [])
          assert.equal(timers.length, 1)
          timers[0]?.()
        }
        assert.equal(revoked.length, mode === 'failed' ? 0 : 1)
      } finally {
        URL.createObjectURL = originalCreate
        URL.revokeObjectURL = originalRevoke
        for (const [name, descriptor] of Object.entries(descriptors)) {
          if (descriptor) Object.defineProperty(globalThis, name, descriptor)
          else Reflect.deleteProperty(globalThis, name)
        }
      }
    })
  }
})

test('raster data source guard handles large images and rejects malformed or active data MIME', () => {
  for (const mime of ['png', 'jpeg', 'jpg', 'gif', 'webp'])
    assert.equal(
      isSafeMarkdownImageSource(`data:image/${mime};base64,YWJjZA==`),
      true,
    )
  assert.equal(isSafeMarkdownImageSource('data:image/png;base64,YWJjZA'), true)
  assert.equal(
    isSafeMarkdownImageSource(
      'data:image/png;base64,' + 'AAAA'.repeat(500_000),
    ),
    true,
  )
  for (const source of [
    'data:image/svg+xml;base64,PHN2Zy8+',
    'data:text/html;base64,YWJjZA==',
    'data:image/png;base64,',
    'data:image/png;base64,YWJjZ',
    'data:image/png;base64,!!!!',
    'data:image/png;base64,YW=Jj',
    'data:image/png;utf8,text',
    ' data:image/png;base64,YWJjZA==',
  ])
    assert.equal(isSafeMarkdownImageSource(source), false, source)
})
