import assert from 'node:assert/strict'
import test from 'node:test'
import type { KnowledgeBase } from '@/types/api'
import { parserConfigSchema } from '@/types/knowledge-form'
import { buildKnowledgeSettingsFormValues } from '../settings/knowledge-settings-form-values'

const createKnowledgeBase = (
  parserConfig: KnowledgeBase['parser_config'],
): KnowledgeBase => ({
  id: 'kb-1',
  name: 'Docs',
  tenant_id: 'tenant-1',
  permission: 'me',
  doc_num: 0,
  token_num: 0,
  chunk_num: 0,
  parser_id: 'naive',
  embd_id: 'embedding-1',
  update_time: 0,
  parser_config: parserConfig,
})

test('parser config requires a positive suggested chunk size', () => {
  assert.equal(
    parserConfigSchema.safeParse({ chunk_token_num: 0 }).success,
    false,
  )
  assert.equal(
    parserConfigSchema.safeParse({ chunk_token_num: 1 }).success,
    true,
  )
})

test('knowledge settings normalize a legacy zero chunk size to one', () => {
  const values = buildKnowledgeSettingsFormValues(
    createKnowledgeBase({ chunk_token_num: 0 }),
    (value) => value,
  )

  assert.equal(values.parser_config.chunk_token_num, 1)
})

test('knowledge settings preserve a valid chunk size', () => {
  const values = buildKnowledgeSettingsFormValues(
    createKnowledgeBase({ chunk_token_num: 256 }),
    (value) => value,
  )

  assert.equal(values.parser_config.chunk_token_num, 256)
})
