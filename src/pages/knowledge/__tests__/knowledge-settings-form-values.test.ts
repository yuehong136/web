import assert from 'node:assert/strict'
import test from 'node:test'
import type { KnowledgeBase } from '@/types/api'
import { parserConfigSchema } from '@/types/knowledge-form'
import {
  buildKnowledgeSettingsFormValues,
  buildKnowledgeSettingsParserConfig,
} from '../settings/knowledge-settings-form-values'

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

  assert.equal(values.parser_config?.chunk_token_num, 1)
})

test('knowledge settings preserve a valid chunk size', () => {
  const values = buildKnowledgeSettingsFormValues(
    createKnowledgeBase({ chunk_token_num: 256 }),
    (value) => value,
  )

  assert.equal(values.parser_config?.chunk_token_num, 256)
})

test('general settings hydrate nested parent-child values and retain edits through schema validation', () => {
  const values = buildKnowledgeSettingsFormValues(
    createKnowledgeBase({
      parent_child: { use_parent_child: true, children_delimiter: '\t' },
      enable_children: false,
      children_delimiter: 'stale',
      overlapped_percent: 0.2,
      metadata: [{ key: 'author', description: 'Author', enum: ['Alice'] }],
      raptor: { use_raptor: false },
      graphrag: { use_graphrag: false },
    }),
    (value) => value,
  )
  assert.equal(values.parser_config?.enable_children, true)
  assert.equal(values.parser_config?.children_delimiter, '\t')
  assert.equal(values.parser_config?.overlapped_percent, 0.2)
  const edited = parserConfigSchema.parse({
    ...values.parser_config,
    chunk_token_num: 321,
    children_delimiter: '\n',
    overlapped_percent: 0.15,
  })
  const payload = buildKnowledgeSettingsParserConfig(edited)
  assert.deepEqual(payload.parent_child, {
    use_parent_child: true,
    children_delimiter: '\n',
  })
  assert.equal(payload.chunk_token_num, 321)
  assert.equal(payload.overlapped_percent, 0.15)
  assert.deepEqual(payload.metadata, values.parser_config?.metadata)
  assert.equal(edited.raptor?.use_raptor, false)
  assert.equal(edited.graphrag?.use_graphrag, false)
})

test('flat legacy parent-child settings round trip and explicit disablement stays disabled on reload', () => {
  const values = buildKnowledgeSettingsFormValues(
    createKnowledgeBase({ enable_children: true, children_delimiter: ';' }),
    (value) => value,
  )
  assert.equal(values.parser_config?.enable_children, true)
  assert.equal(values.parser_config?.children_delimiter, ';')
  const disabled = buildKnowledgeSettingsParserConfig(
    parserConfigSchema.parse({
      ...values.parser_config,
      enable_children: false,
    }),
  )
  assert.equal(
    (disabled.parent_child as { use_parent_child: boolean }).use_parent_child,
    false,
  )
  const reloaded = buildKnowledgeSettingsFormValues(
    createKnowledgeBase({ ...disabled, parent_child: {} }),
    (value) => value,
  )
  assert.equal(reloaded.parser_config?.enable_children, false)
  assert.equal(
    parserConfigSchema.safeParse({ overlapped_percent: 0.31 }).success,
    false,
  )
})
