import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPipelineResultSummary,
  createDisplayJson,
  filterPipelineChunks,
  getChunkMetadataEntries,
  getChunkPages,
  getChunkText,
  getChunkType,
  getChunkVectorDimensions,
  normalizePipelineOutputChunks,
  PipelineResultChunkType,
} from '../pipeline-result-utils'

test('normalizes common pipeline output shapes into chunk records', () => {
  assert.equal(normalizePipelineOutputChunks(null).length, 0)
  assert.equal(normalizePipelineOutputChunks([{ text: 'A' }, 'skip']).length, 1)
  assert.deepEqual(normalizePipelineOutputChunks({ chunks: [{ text: 'B' }] }), [
    { text: 'B' },
  ])
  assert.deepEqual(normalizePipelineOutputChunks({ data: [{ text: 'C' }] }), [
    { text: 'C' },
  ])
})

test('summarizes chunk types, text length, and vectorized chunks', () => {
  const chunks = [
    { text: 'alpha', doc_type_kwd: 'text', q_2048_vec: [0.1, 0.2] },
    { text: '', doc_type_kwd: 'image', img_id: 'image-1' },
    { text: 'table row', doc_type_kwd: 'table' },
    { note: 'unknown' },
  ]

  assert.equal(getChunkText(chunks[0]), 'alpha')
  assert.equal(getChunkType(chunks[1]), PipelineResultChunkType.Image)
  assert.equal(getChunkVectorDimensions(chunks[0]), 2)
  assert.deepEqual(buildPipelineResultSummary(chunks), {
    totalChunks: 4,
    textChunks: 1,
    tableChunks: 1,
    imageChunks: 1,
    otherChunks: 1,
    vectorizedChunks: 1,
    totalTextCharacters: 14,
  })
})

test('filters chunks by query and document type', () => {
  const chunks = [
    { text: 'Admissions policy', doc_type_kwd: 'text', chunk_order_int: 3 },
    { text: '', doc_type_kwd: 'image', img_id: 'cover-chart' },
    { text: 'Funding table', doc_type_kwd: 'table' },
  ]

  assert.deepEqual(
    filterPipelineChunks(chunks, 'policy', PipelineResultChunkType.All),
    [chunks[0]],
  )
  assert.deepEqual(
    filterPipelineChunks(chunks, 'cover', PipelineResultChunkType.Image),
    [chunks[1]],
  )
  assert.deepEqual(
    filterPipelineChunks(chunks, '', PipelineResultChunkType.Table),
    [chunks[2]],
  )
})

test('extracts page metadata and hides raw vectors from display json', () => {
  const chunk = {
    text: 'body',
    page_num_int: [2, 2, 3],
    position_int: [[4, 10, 20]],
    q_2048_vec: [0.1, 0.2, 0.3],
    img_id: 'image-2',
  }

  assert.deepEqual(getChunkPages(chunk), [2, 3])
  assert.deepEqual(getChunkMetadataEntries(chunk), [
    { key: 'page_num_int', value: [2, 2, 3] },
    { key: 'position_int', value: [[4, 10, 20]] },
    { key: 'img_id', value: 'image-2' },
  ])
  assert.deepEqual(createDisplayJson([chunk]), [
    {
      text: 'body',
      page_num_int: [2, 2, 3],
      position_int: [[4, 10, 20]],
      q_2048_vec: '[vector omitted: 3 dimensions]',
      img_id: 'image-2',
    },
  ])
})
