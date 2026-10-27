import assert from 'node:assert/strict'
import test from 'node:test'
import { APIError, apiClient, type RequestConfig } from '../client'
import {
  downloadDocumentFile,
  downloadGeneratedAttachment,
} from '../document-files'

test('document and generated attachment downloads keep separate REST resources', async () => {
  const calls: { path: string; name?: string; config?: RequestConfig }[] = []
  const original = apiClient.download
  apiClient.download = async (path, name, config) => {
    calls.push({ path, name, config })
  }
  try {
    await downloadDocumentFile('doc/中文', 'document.txt')
    await downloadGeneratedAttachment('generated/id', 'report.pdf', 'pdf')
  } finally {
    apiClient.download = original
  }
  assert.deepEqual(
    calls.map(({ path, config }) => [path, config?.baseURL]),
    [
      [
        '/documents/doc%2F%E4%B8%AD%E6%96%87/download',
        'http://localhost:8000/api',
      ],
      [
        '/documents/runtime/generated%2Fid/download',
        'http://localhost:8000/api',
      ],
    ],
  )
  assert.deepEqual(calls[1].config?.params, { ext: 'pdf' })
})

test('canonical document downloads preserve JSON bytes and reject HTTP errors', async () => {
  const originalFetch = globalThis.fetch
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document',
  )
  const downloaded: Blob[] = []
  let clicks = 0
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      URL: {
        createObjectURL: (blob: Blob) => {
          downloaded.push(blob)
          return 'blob:owned-document'
        },
        revokeObjectURL: () => {},
      },
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => ({ click: () => clicks++ }),
      body: { appendChild: () => {}, removeChild: () => {} },
    },
  })
  apiClient.setAuthToken(null)
  try {
    // An authorized source may itself look exactly like an API envelope.
    // These binary endpoints report errors through HTTP status, not file data.
    for (const source of ['{"code":109,"message":"原始文件"}\n', '[1,2]', '']) {
      globalThis.fetch = async () =>
        new Response(source, {
          headers: { 'content-type': 'application/json' },
        })
      for (const download of [
        () => downloadDocumentFile('document', 'source.json'),
        () => downloadGeneratedAttachment('generated', 'source.json', 'json'),
      ]) {
        const before = downloaded.length
        await download()
        assert.equal(downloaded.length, before + 1)
        assert.equal(await downloaded.at(-1)!.text(), source)
      }
    }
    assert.equal(clicks, 6)
    for (const status of [403, 404, 500]) {
      globalThis.fetch = async () =>
        new Response('{"code":109,"message":"No authorization."}', {
          status,
          headers: { 'content-type': 'application/json' },
        })
      await assert.rejects(
        downloadDocumentFile('document'),
        (error: unknown) =>
          error instanceof APIError && error.status === status,
      )
      await assert.rejects(
        downloadGeneratedAttachment('generated', 'source.json', 'json'),
        (error: unknown) =>
          error instanceof APIError && error.status === status,
      )
    }
    assert.equal(clicks, 6)
    assert.equal(downloaded.length, 6)
  } finally {
    globalThis.fetch = originalFetch
    if (originalWindow)
      Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
    if (originalDocument)
      Object.defineProperty(globalThis, 'document', originalDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  }
})
