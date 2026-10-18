import assert from 'node:assert/strict'
import test from 'node:test'
import { apiClient, type RequestConfig } from '../client'
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
