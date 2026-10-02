import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { apiClient, APIError } from '../client'
import { readDocumentImage, resolveDocumentImageUrl } from '../document-images'

const KB = 'a'.repeat(32)
const FILE = 'b'.repeat(32)
const ID = `${KB}-folder/hyphen-key 10% 中文.png`
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])
const originalFetch = globalThis.fetch
const originalDecoder = globalThis.createImageBitmap
let calls: { url: string; config: RequestInit }[]
let bitmapClosed = 0
const imageResponse = (
  body: BodyInit = PNG,
  type = 'image/png',
  status = 200,
) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
beforeEach(() => {
  calls = []
  bitmapClosed = 0
  apiClient.setAuthToken('test-jwt')
  globalThis.createImageBitmap = async () =>
    ({
      close: () => {
        bitmapClosed++
      },
    }) as ImageBitmap
  globalThis.fetch = async (url, config) => {
    calls.push({ url: String(url), config: config! })
    return imageResponse()
  }
})
afterEach(() => {
  apiClient.setAuthToken(null)
  globalThis.fetch = originalFetch
  globalThis.createImageBitmap = originalDecoder
})

test('raw compound key is encoded once, preserving slash and literal percent encoding', () => {
  const root = 'https://api.example.test/prefix/api'
  assert.equal(
    resolveDocumentImageUrl({ kind: 'dataset', imageId: ID }, root),
    `${root}/v1/documents/images/${encodeURIComponent(ID)}`,
  )
  assert.notEqual(
    resolveDocumentImageUrl({ kind: 'dataset', imageId: `${KB}-a%2Fb` }, root),
    resolveDocumentImageUrl({ kind: 'dataset', imageId: `${KB}-a/b` }, root),
  )
  assert.equal(
    resolveDocumentImageUrl({ kind: 'runtime', fileId: FILE }, root),
    `${root}/v1/documents/runtime/${FILE}/image`,
  )
})
test('canonical encoded URL uses configured API origin and keeps encoding', () => {
  const path = `/api/v1/documents/images/${encodeURIComponent(ID)}`
  assert.equal(
    resolveDocumentImageUrl(
      { kind: 'canonical', url: path },
      'https://api.test/api',
      'https://web.test',
    ),
    `https://api.test${path}`,
  )
  assert.equal(
    resolveDocumentImageUrl(
      { kind: 'canonical', url: `https://api.test${path}` },
      'https://api.test/api',
    ),
    `https://api.test${path}`,
  )
})
for (const url of [
  `https://evil.test/api/v1/documents/images/${ID}`,
  `//api.test/api/v1/documents/images/${ID}`,
  `https://user@api.test/api/v1/documents/images/${ID}`,
  '/api/v1/documents/images-evil/x',
  `/api/v1/documents/images/${KB}-x?token=private`,
  `/api/v1/documents/images/${KB}-x#hash`,
  '/api/v1/documents/runtime/owner-key/image',
  'data:image/png;base64,evil',
  `/api/v1/documents/images/${KB}-100%broken`,
  `/api/v1/documents/images/${KB}-x\\evil`,
])
  test(`reject untrusted canonical source before any auth transport: ${url}`, async () => {
    await assert.rejects(
      readDocumentImage({ kind: 'canonical', url }),
      APIError,
    )
    assert.equal(calls.length, 0)
  })
test('valid binary uses existing Bearer for JWT and APIkey, no-store and redirect error', async () => {
  for (const credential of ['test-jwt', 'test-api-key']) {
    apiClient.setAuthToken(credential)
    const result = await readDocumentImage({ kind: 'dataset', imageId: ID })
    assert.equal(result.size, PNG.length)
    assert.equal(
      (calls.at(-1)!.config.headers as Record<string, string>).Authorization,
      `Bearer ${credential}`,
    )
    assert.equal(calls.at(-1)!.config.redirect, 'error')
    assert.equal(calls.at(-1)!.config.cache, 'no-store')
    assert.equal(calls.at(-1)!.url.includes(credential), false)
  }
  assert.equal(bitmapClosed, 2)
})
for (const [status, code] of [
  [401, 401],
  [404, 102],
  [415, 102],
  [500, 500],
  [422, 101],
  [200, 500],
  [200, 0],
])
  test(`image JSON HTTP${status}/code${code} remains failure with original status and safe message`, async () => {
    globalThis.fetch = async () =>
      imageResponse(
        JSON.stringify({ code, message: 'PRIVATE-OWNER-KEY', data: null }),
        'application/json',
        status,
      )
    await assert.rejects(
      readDocumentImage({ kind: 'runtime', fileId: FILE }),
      (error) => {
        assert.ok(error instanceof APIError)
        assert.equal(error.status, status)
        assert.equal(error.code, code === 0 ? '102' : String(code))
        assert.equal(error.message.includes('PRIVATE'), false)
        return true
      },
    )
    assert.equal(bitmapClosed, 0)
  })
for (const [body, mime, status] of [
  ['', 'image/png', 200],
  ['<html>private</html>', 'text/html', 200],
  ['<svg/>', 'image/svg+xml', 200],
  ['{"retcode":0,"data":{}}', 'application/json', 200],
  ['not-image', 'image/png', 200],
  [PNG, 'application/octet-stream', 200],
  [PNG, 'image/jpeg', 200],
  [PNG, 'image/png', 206],
] as const)
  test(`invalid binary ${mime}/${status}/${String(body).slice(0, 10)}`, async () => {
    globalThis.fetch = async () => imageResponse(body, mime, status)
    await assert.rejects(
      readDocumentImage({ kind: 'dataset', imageId: ID }),
      APIError,
    )
    assert.equal(bitmapClosed, 0)
  })
test('native decode failure rejects truncated raster after signature check', async () => {
  globalThis.createImageBitmap = async () => {
    throw new Error('private decode detail')
  }
  await assert.rejects(
    readDocumentImage({ kind: 'dataset', imageId: ID }),
    (error) =>
      error instanceof APIError && error.status === 415 && error.code === '102',
  )
})
test('caller abort reaches actual fetch and remains expected AbortError', async () => {
  let captured: AbortSignal | undefined
  globalThis.fetch = async (_url, config) =>
    new Promise((_resolve, reject) => {
      captured = config!.signal!
      captured.addEventListener('abort', () => reject(captured!.reason))
    })
  const controller = new AbortController()
  const request = readDocumentImage(
    { kind: 'dataset', imageId: ID },
    controller.signal,
  )
  controller.abort()
  await assert.rejects(
    request,
    (error) => error instanceof DOMException && error.name === 'AbortError',
  )
  assert.equal(captured?.aborted, true)
})
test('abort during late decoding closes bitmap and never returns the old blob', async () => {
  let finish!: (value: ImageBitmap) => void
  let entered!: () => void
  const decoding = new Promise<void>((resolve) => {
    entered = resolve
  })
  globalThis.createImageBitmap = () => {
    entered()
    return new Promise((resolve) => {
      finish = resolve
    })
  }
  const controller = new AbortController()
  const request = readDocumentImage(
    { kind: 'dataset', imageId: ID },
    controller.signal,
  )
  await decoding
  controller.abort()
  await assert.rejects(
    request,
    (error) => error instanceof DOMException && error.name === 'AbortError',
  )
  assert.equal(bitmapClosed, 0)
  finish({
    close: () => {
      bitmapClosed++
    },
  } as ImageBitmap)
  await Promise.resolve()
  assert.equal(bitmapClosed, 1)
})

test('HTTP204 and absent image MIME never enter the decoder', async () => {
  for (const response of [
    new Response(null, { status: 204 }),
    new Response(PNG),
  ]) {
    globalThis.fetch = async () => response
    await assert.rejects(
      readDocumentImage({ kind: 'dataset', imageId: ID }),
      APIError,
    )
  }
  assert.equal(bitmapClosed, 0)
})

test('the binary reader keeps its timeout active through body consumption', async () => {
  let signal!: AbortSignal
  globalThis.fetch = async (_url, config) => {
    signal = config!.signal!
    return new Response(
      new ReadableStream({
        start(controller) {
          signal.addEventListener(
            'abort',
            () => controller.error(signal.reason),
            { once: true },
          )
        },
      }),
    )
  }
  await assert.rejects(
    apiClient.get('https://api.test/api/v1/documents/images/a-key', {
      timeout: 10,
      readResponse: (response) => response.blob(),
    }),
    (error) => error instanceof APIError && error.code === 'TIMEOUT',
  )
  assert.equal(signal.aborted, true)
})

for (const abortCaller of [true, false])
  test(`fulfilled old-owner 401 cannot clear a new identity; caller abort=${abortCaller}`, async () => {
    const previousWindow = globalThis.window
    const previousEvent = globalThis.CustomEvent
    let logoutEvents = 0
    globalThis.window = {
      location: {
        href: 'https://web.test/explore',
        origin: 'https://web.test',
      },
      history: { replaceState() {} },
      dispatchEvent() {
        logoutEvents++
        return true
      },
    } as unknown as Window & typeof globalThis
    globalThis.CustomEvent =
      class extends Event {} as unknown as typeof CustomEvent
    try {
      apiClient.setAuthToken('owner-a')
      globalThis.fetch = async () =>
        imageResponse(
          '{"code":401,"message":"Unauthorized","data":null}',
          'application/json',
          401,
        )
      const caller = new AbortController()
      const request = readDocumentImage(
        { kind: 'dataset', imageId: ID },
        caller.signal,
      )
      apiClient.setAuthToken('owner-b')
      if (abortCaller) caller.abort()
      await assert.rejects(
        request,
        (error) => error instanceof DOMException && error.name === 'AbortError',
      )
      assert.equal(logoutEvents, 0)
      globalThis.fetch = async (_url, config) => {
        assert.equal(
          (config!.headers as Record<string, string>).Authorization,
          'Bearer owner-b',
        )
        return imageResponse()
      }
      await readDocumentImage({ kind: 'dataset', imageId: ID })
      assert.equal(bitmapClosed, 1)
    } finally {
      globalThis.window = previousWindow
      globalThis.CustomEvent = previousEvent
    }
  })

test(
  'internal deadline settles during pending native decode; late bitmap closes once',
  { timeout: 1000 },
  async () => {
    const originalTimer = globalThis.setTimeout
    const originalClear = globalThis.clearTimeout
    let deadline!: () => void
    let finish!: (value: ImageBitmap) => void
    let entered!: () => void
    const decoding = new Promise<void>((resolve) => {
      entered = resolve
    })
    const fakeTimer = {} as ReturnType<typeof setTimeout>
    globalThis.setTimeout = ((callback: () => void) => {
      deadline = callback
      return fakeTimer
    }) as typeof setTimeout
    globalThis.clearTimeout = ((timer) => {
      if (timer !== fakeTimer) originalClear(timer)
    }) as typeof clearTimeout
    globalThis.createImageBitmap = () => {
      entered()
      return new Promise((resolve) => {
        finish = resolve
      })
    }
    try {
      const request = readDocumentImage({ kind: 'dataset', imageId: ID })
      await decoding
      deadline()
      await assert.rejects(
        request,
        (error) =>
          error instanceof APIError &&
          error.status === 408 &&
          error.code === 'TIMEOUT',
      )
      assert.equal(bitmapClosed, 0)
      finish({
        close() {
          bitmapClosed++
        },
      } as ImageBitmap)
      await Promise.resolve()
      assert.equal(bitmapClosed, 1)
      globalThis.createImageBitmap = async () =>
        ({
          close() {
            bitmapClosed++
          },
        }) as ImageBitmap
      await readDocumentImage({ kind: 'dataset', imageId: ID })
      assert.equal(bitmapClosed, 2)
    } finally {
      globalThis.setTimeout = originalTimer
      globalThis.clearTimeout = originalClear
    }
  },
)
