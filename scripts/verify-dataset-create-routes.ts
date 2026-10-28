/** Production default-model and dataset clients against an owned HTTP fixture. */
import assert from 'node:assert/strict'
import { constants, openSync, writeSync, fsyncSync, closeSync } from 'node:fs'
import { apiClient } from '../src/api/client'
import { knowledgeAPI } from '../src/api/knowledge'
import { createModelProvidersAPI } from '../src/api/llm-providers'

const base = process.env.DOMAIN_ACCEPTANCE_BASE
const token = process.env.DOMAIN_ACCEPTANCE_TOKEN
const mode = process.env.DOMAIN_ACCEPTANCE_MODE ?? 'create'
assert.ok(base && token && process.env.MULTIRAG_RUN_JOURNAL)
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname))
const fd = openSync(
  process.env.MULTIRAG_RUN_JOURNAL!,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
const record = (kind: string, data: object) => {
  writeSync(fd, JSON.stringify({ kind, ...data }) + '\n')
  fsyncSync(fd)
}
apiClient.setAuthToken(token)
const realFetch = globalThis.fetch
const receipts: object[] = []
// Change only the origin. Request construction, response envelopes and mapping
// still pass through the production domain client and actual HTTP transport.
globalThis.fetch = (async (url, init) => {
  const parsed = new URL(String(url), base)
  const response = await realFetch(
    `${base}${parsed.pathname}${parsed.search}`,
    init,
  )
  const body = await response.clone().json()
  receipts.push({
    method: init?.method ?? 'GET',
    path: parsed.pathname,
    httpStatus: response.status,
    code: body.code,
    ...(init?.method === 'POST'
      ? { requestBody: JSON.parse(String(init.body)) }
      : {}),
  })
  return response
}) as typeof fetch
try {
  if (mode === 'create') {
    const name = process.env.DOMAIN_ACCEPTANCE_DATASET_NAME
    const expectedReference = process.env.DOMAIN_ACCEPTANCE_MODEL_REFERENCE
    assert.ok(name && expectedReference)
    const defaults = await createModelProvidersAPI(base).defaults()
    const reference = defaults.find(
      (row) => row.model_type === 'embedding',
    )?.reference
    assert.equal(reference, expectedReference)
    assert.match(reference!, /^[1-9]\d*$/)
    record('reserve-web-default-model-dataset', {
      name,
      embeddingModelReference: reference,
    })
    const created = await knowledgeAPI.knowledgeBase.create({
      name,
      embd_id: reference!,
      parser_id: 'naive',
      permission: 'me',
      language: 'English',
    })
    assert.ok(created.kb_id)
    record('created-web-default-model-dataset', { id: created.kb_id, name })
    const fetched = await knowledgeAPI.knowledgeBase.get(created.kb_id)
    assert.equal(String(fetched.embd_id), reference)
    assert.equal(fetched.name, name)
    console.log(
      JSON.stringify({
        status: 'passed',
        layer: 'actual-Web-default-and-create-clients-to-HTTP',
        id: created.kb_id,
        defaultModels: defaults,
        embeddingModelReference: reference,
        receipts,
        independentSQL: 'I-owned',
      }),
    )
  } else {
    assert.equal(mode, 'cleanup')
    const id = process.env.DOMAIN_ACCEPTANCE_DATASET_ID
    assert.ok(id)
    record('reserve-web-default-model-dataset-cleanup', { id })
    await knowledgeAPI.knowledgeBase.delete(id)
    console.log(
      JSON.stringify({
        status: 'passed',
        mode,
        id,
        receipts,
        independentSQL: 'I-owned',
      }),
    )
  }
} finally {
  globalThis.fetch = realFetch
  apiClient.setAuthToken(null)
  closeSync(fd)
}
