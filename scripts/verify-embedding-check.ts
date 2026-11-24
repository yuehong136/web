import assert from 'node:assert/strict'
import { apiClient } from '../src/api/client'
import { checkDatasetEmbedding } from '../src/api/knowledge-embedding'
import { knowledgeAPI } from '../src/api/knowledge'

const base = process.env.EMBEDDING_BASE
const dataset = process.env.EMBEDDING_DATASET
const token = process.env.EMBEDDING_TOKEN
const modelId = process.env.EMBEDDING_MODEL_ID
assert.ok(base && dataset && token && modelId)
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname))
assert.match(modelId, /^[0-9a-f]{32}$/)
const originalFetch = globalThis.fetch
// Keep the production client, authentication and envelope handling; redirect
// relative API URLs to the owned HTTP listener supplied by integration.
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input.toString()
  return originalFetch(
    base + new URL(url, 'http://fixture.invalid').pathname,
    init,
  )
}
apiClient.setAuthToken(token)
const check = await checkDatasetEmbedding(dataset, modelId)
assert.equal(check.summary.valid, 2)
assert.equal(check.summary.avg_cos_sim, 1)
const result = await knowledgeAPI.knowledgeBase.update({
  kb_id: dataset,
  embd_id: modelId,
})
assert.equal(result.embd_id, modelId)
const reloaded = await knowledgeAPI.knowledgeBase.get(dataset)
assert.equal(reloaded.embd_id, modelId)
assert.equal(reloaded.chunk_num, 3)
console.log('embedding Web acceptance passed')
