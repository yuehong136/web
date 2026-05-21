import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertNonEmptyBlob,
  assertPreviewResponse,
  buildAuthHeader,
  getDocumentUrl,
  getFileType,
  getPreviewResponseErrorMessage,
  isZipLikeBlob,
  PreviewResourceErrorResult,
  readBlobAsArrayBuffer,
  readBlobAsText,
} from '../preview-resource'

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

test('getDocumentUrl encodes document ids and optional download action', () => {
  assert.equal(
    getDocumentUrl('doc id/中文'),
    'http://localhost:8000/v1/document/get/doc%20id%2F%E4%B8%AD%E6%96%87',
  )
  assert.equal(
    getDocumentUrl('doc id/中文', 'download'),
    'http://localhost:8000/v1/document/get/doc%20id%2F%E4%B8%AD%E6%96%87?action=download',
  )
})

test('buildAuthHeader normalizes missing, raw and bearer tokens', async () => {
  await withLocalStorageToken(null, () => {
    assert.equal(buildAuthHeader(), null)
  })

  await withLocalStorageToken('token-1', () => {
    assert.equal(buildAuthHeader(), 'Bearer token-1')
  })

  await withLocalStorageToken('Bearer token-2', () => {
    assert.equal(buildAuthHeader(), 'Bearer token-2')
  })
})

test('getFileType covers supported preview formats', () => {
  assert.equal(getFileType('file.pdf'), 'pdf')
  assert.equal(getFileType('file.PNG'), 'image')
  assert.equal(getFileType('file.webm'), 'video')
  assert.equal(getFileType('file.docx'), 'docx')
  assert.equal(getFileType('file.xlsx'), 'xlsx')
  assert.equal(getFileType('file.pptx'), 'pptx')
  assert.equal(getFileType('file.log'), 'txt')
  assert.equal(getFileType('file.markdown'), 'md')
  assert.equal(getFileType('file.csv'), 'csv')
  assert.equal(getFileType(undefined, 'pdf'), 'pdf')
  assert.equal(getFileType('file.unknown'), 'unknown')
})

test('blob parsers cover text, arrayBuffer, empty and zip-like boundaries', async () => {
  const textBlob = new Blob(['hello'])
  assert.equal(await readBlobAsText(textBlob), 'hello')

  const buffer = await readBlobAsArrayBuffer(textBlob)
  assert.equal(new TextDecoder().decode(buffer), 'hello')

  assert.doesNotThrow(() => assertNonEmptyBlob(textBlob))
  assert.throws(
    () => assertNonEmptyBlob(new Blob()),
    (error) =>
      error instanceof PreviewResourceErrorResult &&
      error.reason === 'empty-resource',
  )

  assert.equal(await isZipLikeBlob(new Blob([Uint8Array.of(0x50, 0x4b)])), true)
  assert.equal(
    await isZipLikeBlob(new Blob([Uint8Array.of(0x00, 0x01)])),
    false,
  )
})

test('preview response errors normalize JSON, HTML and HTTP failures', async () => {
  const jsonError = new Response(JSON.stringify({ retmsg: 'bad token' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
  assert.equal(await getPreviewResponseErrorMessage(jsonError), 'bad token')
  await assert.rejects(
    () => assertPreviewResponse(jsonError),
    (error) =>
      error instanceof PreviewResourceErrorResult &&
      error.reason === 'http-error' &&
      error.message === 'bad token',
  )

  const htmlResponse = new Response('<html>login</html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  })
  await assert.rejects(
    () => assertPreviewResponse(htmlResponse),
    (error) =>
      error instanceof PreviewResourceErrorResult &&
      error.reason === 'html-response',
  )

  const jsonOkResponse = new Response(
    JSON.stringify({ message: 'not a file' }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  )
  await assert.rejects(
    () => assertPreviewResponse(jsonOkResponse),
    (error) =>
      error instanceof PreviewResourceErrorResult &&
      error.reason === 'json-error' &&
      error.message === 'not a file',
  )

  const plainError = new Response('missing', { status: 404 })
  assert.equal(
    await getPreviewResponseErrorMessage(plainError),
    'Preview resource request failed: 404',
  )
})
