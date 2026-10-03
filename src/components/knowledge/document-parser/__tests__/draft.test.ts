import assert from 'node:assert/strict'
import test from 'node:test'
import type { Document } from '@/types/api'
import { APIError } from '@/api/client'
import {
  hydrateParserDraft,
  serializeParserDraft,
  validateParserConfigPatch,
  requiredSourceParser,
} from '../draft'
import { normalizeParserPipelinePage } from '../catalog'

const document = (extra: Record<string, unknown> = {}) =>
  ({
    id: 'doc',
    name: 'source.txt',
    type: 'doc',
    parser_id: 'naive',
    pipeline_id: null,
    parser_config: {
      old: null,
      raptor: { use_raptor: false, unknown: 9 },
      graphrag: { method: 'general' },
      image_context_size: 600,
      table_context_size: 900,
      overlapped_percent: 10,
      parent_child: { use_parent_child: true, children_delimiter: '\n#' },
      mineru_lang: 'Bulgarian',
      filename_embd_weight: null,
      pages: null,
      llm_id: 'legacy',
    },
    ...extra,
  }) as unknown as Document

test('noop and unrelated edits omit mounted defaults, preserve full snapshots, nested children and distinct large contexts', () => {
  const source = document()
  const before = structuredClone(source)
  const initial = hydrateParserDraft(source)
  const current = structuredClone(initial)
  current.parser_config.auto_keywords = 0
  current.parser_config.chunk_token_num = 512
  assert.deepEqual(serializeParserDraft(initial, current, {}), {})
  current.parser_config.auto_questions = 2
  assert.deepEqual(
    serializeParserDraft(initial, current, {
      parser_config: { auto_questions: true },
    }),
    {
      parser_config: { auto_questions: 2 },
    },
  )
  assert.equal(initial.parser_config.enable_children, true)
  assert.equal(initial.parser_config.children_delimiter, '\n#')
  assert.equal(initial.parser_config.overlapped_percent, 10)
  assert.deepEqual(source, before)
})

test('same builtin and pipeline omit mode; actual switches request one final mode without resetting draft config', () => {
  const initial = hydrateParserDraft(document())
  const current = structuredClone(initial)
  assert.deepEqual(serializeParserDraft(initial, current, {}), {})
  current.parseType = 2
  current.pipeline_id = 'a'.repeat(32)
  assert.deepEqual(serializeParserDraft(initial, current, {}), {
    pipeline_id: 'a'.repeat(32),
  })
  const pipeline = hydrateParserDraft(document({ pipeline_id: 'a'.repeat(32) }))
  assert.equal(pipeline.parseType, 2)
  assert.deepEqual(
    serializeParserDraft(pipeline, structuredClone(pipeline), {}),
    {},
  )
  const builtin = { ...pipeline, parseType: 1 as const }
  assert.deepEqual(serializeParserDraft(pipeline, builtin, {}), {
    chunk_method: 'naive',
    pipeline_id: '',
  })
  const general = hydrateParserDraft(document({ parser_id: 'general' }))
  assert.deepEqual(
    serializeParserDraft(general, structuredClone(general), {}),
    {},
  )
  assert.throws(
    () =>
      serializeParserDraft(initial, { ...initial, parser_id: 'general' }, {}),
    APIError,
  )
  assert.equal(hydrateParserDraft(document({ parser_id: null })).parser_id, '')
})

test('explicit context, child disable and partial metadata intents serialize only owned edits', () => {
  const initial = hydrateParserDraft(document())
  const current = structuredClone(initial)
  current.parser_config.image_table_context_window = 30
  assert.deepEqual(
    serializeParserDraft(initial, current, {
      parser_config: { image_table_context_window: true },
    }),
    { parser_config: { image_context_size: 30, table_context_size: 30 } },
  )
  current.parser_config.enable_children = false
  assert.deepEqual(
    serializeParserDraft(initial, current, {
      parser_config: { enable_children: true },
    }),
    { parser_config: { enable_children: false, children_delimiter: '' } },
  )
  current.parser_config.metadata = []
  assert.deepEqual(
    serializeParserDraft(initial, current, {
      parser_config: { metadata: true },
    }),
    { parser_config: { metadata: [] } },
  )
  const schema = hydrateParserDraft(
    document({
      parser_config: {
        metadata: {
          type: 'object',
          properties: {
            author: { description: 'old' },
            title: { description: 'preserve' },
          },
        },
      },
    }),
  )
  const edited = structuredClone(schema)
  ;(edited.parser_config.metadata as any).properties.author.description = 'new'
  assert.deepEqual(
    serializeParserDraft(schema, edited, {
      parser_config: {
        metadata: { properties: { author: { description: true } } },
      },
    }),
    {
      parser_config: {
        metadata: { properties: { author: { description: 'new' } } },
      },
    },
  )
})

test('strict configuration accepts actual document bounds and refuses invalid or conflicting intention', () => {
  for (const config of [
    { chunk_token_num: 8192, auto_keywords: 32 },
    { enable_children: false, children_delimiter: '' },
    { mineru_lang: 'Turkish' },
    { pages: [[1, 5]] },
    { overlapped_percent: 90 },
    { image_context_size: 5000 },
  ])
    assert.doesNotThrow(() => validateParserConfigPatch(config))
  for (const config of [
    { chunk_token_num: 8193 },
    { chunk_token_num: '512' },
    { auto_questions: 11 },
    { html4excel: 'false' },
    { delimiter: '' },
    { children_delimiter: '' },
    { enable_children: null },
    { overlapped_percent: Infinity },
    { parent_child: { use_parent_child: true }, enable_children: false },
    { pages: [[1, 1]] },
    { field_map: {} },
    { unknown: null },
    { image_context_size: -1 },
    { mineru_lang: 'unlisted' },
  ])
    assert.throws(() => validateParserConfigPatch(config), APIError)
})

test('source hints use actual automatic types and do not rewrite their names', () => {
  for (const [name, type, expected] of [
    ['x.txt', 'visual', 'picture'],
    ['x.png', 'doc', 'picture'],
    ['x.wav', 'doc', 'audio'],
    ['x.txt', 'aural', 'audio'],
    ['x.pptx', 'doc', 'presentation'],
    ['x.eml', 'doc', 'email'],
  ])
    assert.equal(requiredSourceParser({ name, type }), expected)
  assert.equal(requiredSourceParser({ name: 'x.pdf', type: 'doc' }), undefined)
})

test('catalog filters actual tenant_id and category, rather than user_id or visible foreign teams', () => {
  const a = 'a'.repeat(32)
  const b = 'b'.repeat(32)
  const result = normalizeParserPipelinePage(
    {
      total: 4,
      canvas: [
        {
          id: a,
          title: { zh: '目录', en: 'Catalog' },
          tenant_id: 'owner',
          user_id: 'unrelated',
          canvas_category: 'dataflow_canvas',
        },
        {
          id: b,
          title: 'Foreign',
          tenant_id: 'foreign',
          user_id: 'owner',
          canvas_category: 'dataflow_canvas',
        },
        {
          id: b,
          title: 'Wrong category',
          tenant_id: 'owner',
          canvas_category: 'agent_canvas',
        },
        {
          id: b,
          title: 'Missing owner',
          user_id: 'owner',
          canvas_category: 'dataflow_canvas',
        },
      ],
    },
    'owner',
    2,
    50,
  )
  assert.deepEqual(
    result.rows.map((row) => row.id),
    [a],
  )
  assert.equal(result.total, 4)
  assert.throws(
    () =>
      normalizeParserPipelinePage({ canvas: [], total: -1 }, 'owner', 1, 50),
    APIError,
  )
})
