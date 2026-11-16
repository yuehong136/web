import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCitationNumber,
  getCitedChunks,
  getSourceBadge,
} from '../citation-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

const chunk = (id: string, extra: Partial<ReferenceChunk> = {}) =>
  ({ id, content: id, ...extra }) satisfies ReferenceChunk

test('cited chunks follow first citation order, once each, and ignore unknown ids', () => {
  const references = [chunk('a'), chunk('b'), chunk('c')]
  assert.deepEqual(
    getCitedChunks('x[ID:2] y[ID:0][ID:2] z[ID:9]', references).map(
      (item) => item.id,
    ),
    ['c', 'a'],
  )
  assert.deepEqual(getCitedChunks('no markers', references), [])
})

test('keyed references resolve by their key and keep their own numbers', () => {
  const references = [
    chunk('a', { reference_index: 4, reference_key: '4' }),
    chunk('b', { reference_index: 7, reference_key: '7' }),
  ]
  const cited = getCitedChunks('[ID:7] then [ID:0]', references)
  // [ID:0] has no keyed chunk: no positional fallback to another chunk
  assert.deepEqual(
    cited.map((item) => item.id),
    ['b'],
  )
  assert.equal(getCitationNumber(cited[0], references), 7)
  const plain = [chunk('y'), chunk('x')]
  assert.equal(getCitationNumber(plain[1], plain), 2)
})

test('source badges name the file type, web results and unnamed chunks', () => {
  assert.equal(getSourceBadge(chunk('a', { document_name: 'Plan.pdf' })), 'PDF')
  assert.equal(
    getSourceBadge(chunk('a', { url: 'https://example.com', dataset_id: '' })),
    'WEB',
  )
  assert.equal(getSourceBadge(chunk('a', { doc_type: 'image' })), 'IMG')
  assert.equal(getSourceBadge(chunk('a')), 'DOC')
})
