/** Production preview and download consumers against an owned HTTP API. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { apiClient } from '../src/api/client'
import { knowledgeAPI } from '../src/api/knowledge'
import {
  assertPreviewResponse,
  fetchPreviewResource,
  getDocumentUrl,
} from '../src/lib/knowledge/preview-resource'

const base = process.env.DOCUMENT_FILES_BASE
const docId = process.env.DOCUMENT_FILES_ID
const token = process.env.DOCUMENT_FILES_TOKEN
assert.ok(base && docId && token)
let currentToken: string | null = token
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => (key === 'auth_token' ? currentToken : null),
    setItem: (_key: string, value: string) => {
      currentToken = value
    },
    removeItem: () => {
      currentToken = null
    },
  },
  configurable: true,
})
apiClient.setAuthToken(token)
const realFetch = globalThis.fetch
const paths: string[] = []
globalThis.fetch = ((url, init) => {
  const parsed = new URL(String(url), base)
  paths.push(parsed.pathname)
  return realFetch(`${base}${parsed.pathname}${parsed.search}`, init)
}) as typeof fetch

const preview = await fetchPreviewResource(getDocumentUrl(docId))
await assertPreviewResponse(preview)
const bytes = Buffer.from(await preview.arrayBuffer())
const sha256 = createHash('sha256').update(bytes).digest('hex')
assert.equal(sha256, process.env.DOCUMENT_FILES_SHA256)
assert.equal(preview.headers.get('cache-control'), 'no-store')

const { JSDOM } = createRequire(import.meta.url)('jsdom')
const dom = new JSDOM('<body></body>', { url: 'http://localhost/' })
Object.defineProperty(globalThis, 'window', {
  value: dom.window,
  configurable: true,
})
Object.defineProperty(globalThis, 'document', {
  value: dom.window.document,
  configurable: true,
})
let downloaded: Blob | undefined
let clicked = false
dom.window.URL.createObjectURL = (blob: Blob) => {
  downloaded = blob
  return 'blob:owned-document'
}
dom.window.URL.revokeObjectURL = () => {}
dom.window.HTMLAnchorElement.prototype.click = () => {
  clicked = true
}
await knowledgeAPI.document.download(docId, '文档.txt')
assert.ok(clicked && downloaded)
assert.equal(
  createHash('sha256')
    .update(Buffer.from(await downloaded.arrayBuffer()))
    .digest('hex'),
  sha256,
)
apiClient.setAuthToken(null)
const anonymous = await fetchPreviewResource(getDocumentUrl(docId))
await assert.rejects(assertPreviewResponse(anonymous))
await assert.rejects(knowledgeAPI.document.download(docId))
assert.ok(paths.every((path) => path.startsWith(`/api/v1/documents/${docId}/`)))
console.log(
  JSON.stringify({ sha256, size: bytes.length, anonymous_denied: true, paths }),
)
