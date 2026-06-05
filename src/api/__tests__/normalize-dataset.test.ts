import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDataset } from '../knowledge'
import type { DatasetDTO } from '@/types/api'

// 锁定 RESTful /api/v1/datasets 防腐层：DTO(remap 后字段) → 稳定领域模型 KnowledgeBase。
// 后端 remap_dictionary_keys 重命名的 4 个字段必须被还原，其余字段透传。

test('normalizeDataset maps RESTful field names back to legacy KnowledgeBase shape', () => {
  const dto: DatasetDTO = {
    id: 'kb-1',
    name: 'Docs',
    document_count: 12,
    chunk_count: 340,
    chunk_method: 'qa',
    embedding_model: 'bge-m3',
    token_num: 5000,
    permission: 'team',
    update_time: 123,
  }

  const kb = normalizeDataset(dto)

  // 4 个 remap 字段还原
  assert.equal(kb.doc_num, 12)
  assert.equal(kb.chunk_num, 340)
  assert.equal(kb.parser_id, 'qa')
  assert.equal(kb.embd_id, 'bge-m3')

  // 同名字段透传
  assert.equal(kb.id, 'kb-1')
  assert.equal(kb.name, 'Docs')
  assert.equal(kb.token_num, 5000)
  assert.equal(kb.permission, 'team')
  assert.equal(kb.update_time, 123)
})

test('normalizeDataset applies safe defaults when counts/methods are absent', () => {
  const kb = normalizeDataset({ id: 'kb-2', name: 'Empty' })

  assert.equal(kb.doc_num, 0)
  assert.equal(kb.chunk_num, 0)
  assert.equal(kb.parser_id, 'naive')
  assert.equal(kb.embd_id, '')
})
