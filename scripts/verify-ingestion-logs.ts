/** Run against an isolated API whose owned log IDs are supplied by the harness. */
import assert from 'node:assert/strict'
import { apiClient, APIError } from '../src/api/client'
import { knowledgeRestConfig } from '../src/api/knowledge-config'
import { knowledgeAPI } from '../src/api/knowledge'

const base = process.env.INGESTION_BASE
const token = process.env.INGESTION_TOKEN
const dataset = process.env.INGESTION_DATASET
const ids = JSON.parse(process.env.INGESTION_LOG_IDS || '[]') as string[]
assert.ok(base && token && dataset && ids.length === 5)
knowledgeRestConfig.baseURL = `${base}/api`
apiClient.setAuthToken(token)
const common = { kb_id: dataset, keywords: 'HTTP SCRATCH', desc: false }
const file = await knowledgeAPI.logs.listFileLogs({
  ...common,
  types: ['txt'],
  suffix: ['txt'],
  create_date_from: '2025-01-04T08:00:00+08:00',
  create_date_to: '2025-01-04',
})
assert.equal(file.total, 1)
assert.equal(file.logs[0]?.id, ids[3])
assert.equal(file.logs[0]?.document_name, 'HTTP scratch')
assert.equal(file.logs[0]?.document_suffix, 'txt')
const all = await knowledgeAPI.logs.listDatasetLogs(common)
assert.equal(all.total, 3)
assert.deepEqual(
  all.logs.map((row) => row.id),
  ids.slice(0, 3),
)
const page = await knowledgeAPI.logs.listDatasetLogs({
  ...common,
  page: 2,
  page_size: 1,
})
assert.equal(page.total, 3)
assert.equal(page.logs[0]?.id, ids[1])
const searched = await knowledgeAPI.logs.listDatasetLogs({
  ...common,
  keywords: 'missing',
})
assert.deepEqual(searched, { total: 0, logs: [] })
const filtered = await knowledgeAPI.logs.listDatasetLogs({
  ...common,
  operation_status: ['success'],
})
assert.equal(filtered.total, 2)
apiClient.setAuthToken('invalid-ingestion-token')
await assert.rejects(knowledgeAPI.logs.listFileLogs(common), APIError)
console.log(
  'ingestion Web acceptance passed: file/dataset, search, filters, fields, pagination, auth',
)
