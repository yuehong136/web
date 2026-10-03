/** Isolated acceptance: supply a scratch API, token, dataset IDs and expected rows. */
import assert from 'node:assert/strict'
import { apiClient, APIError } from '../src/api/client'
import { knowledgeRestConfig } from '../src/api/knowledge-config'
import { knowledgeAPI } from '../src/api/knowledge'
import { knowledgeGraphAPI } from '../src/api/knowledge-retrieval'

const base = process.env.DATASET_ACCEPTANCE_BASE
const token = process.env.DATASET_ACCEPTANCE_TOKEN
const datasets = JSON.parse(
  process.env.DATASET_ACCEPTANCE_IDS || '[]',
) as string[]
const expected = JSON.parse(
  process.env.DATASET_ACCEPTANCE_CHUNKS || '[]',
) as string[]
const docId = process.env.DATASET_ACCEPTANCE_DOC
assert.ok(base && token && datasets.length && expected.length && docId)
knowledgeRestConfig.baseURL = `${base}/api`
apiClient.setAuthToken(token)

const result = await knowledgeAPI.retrievalTest.test({
  kb_ids: datasets,
  question: 'availability',
  highlight: true,
})
assert.equal(result.total, expected.length)
assert.deepEqual(
  result.chunks.map((chunk) => chunk.chunk_id).sort(),
  expected.sort(),
)
assert.ok(result.chunks.every((chunk) => !Object.hasOwn(chunk, 'vector')))
const absent = await knowledgeAPI.retrievalTest.test({
  kb_ids: [datasets[0]!],
  question: 'availability',
  meta_data_filter: {
    method: 'manual',
    manual: [{ key: 'category', op: '=', value: 'absent' }],
  },
})
assert.equal(absent.total, 0)
assert.deepEqual(absent.chunks, [])
const aggregate = await knowledgeAPI.knowledgeBase.getKnowledgeGraph(
  datasets[0]!,
)
assert.ok(aggregate.graph?.nodes?.length)
const document = await knowledgeGraphAPI.get(datasets[0]!, docId)
assert.ok(document.graph?.nodes?.length)
apiClient.setAuthToken('invalid-acceptance-token')
await assert.rejects(
  knowledgeAPI.retrievalTest.test({
    kb_ids: datasets,
    question: 'availability',
  }),
  APIError,
)
console.log(
  'dataset Web acceptance: retrieval, metadata, aggregate/document graph and auth passed',
)
