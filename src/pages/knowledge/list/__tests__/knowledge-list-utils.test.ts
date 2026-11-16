import assert from 'node:assert/strict'
import test from 'node:test'
import type { KnowledgeBase } from '@/types/api'
import { getKnowledgePageStats, groupKnowledgeBases } from '../utils'

const base = (
  id: string,
  overrides: Partial<KnowledgeBase> = {},
): KnowledgeBase =>
  ({
    id,
    name: id,
    tenant_id: 'tenant',
    permission: 'me',
    doc_num: 0,
    chunk_num: 0,
    token_num: 0,
    parser_id: 'naive',
    embd_id: 'bge-m3',
    update_time: 0,
    ...overrides,
  }) as KnowledgeBase

const page = [
  base('filled', { doc_num: 3, chunk_num: 40, permission: 'team' }),
  base('empty'),
  base('also-filled', { doc_num: 2, chunk_num: 9 }),
]

test('groups by document content with empty bases first, keeping server order', () => {
  assert.deepEqual(
    groupKnowledgeBases(page, 'content').map((group) => [
      group.key,
      group.items.map((item) => item.id),
    ]),
    [
      ['empty', ['empty']],
      ['hasDocuments', ['filled', 'also-filled']],
    ],
  )
})

test('groups by visibility and drops groups with no bases', () => {
  assert.deepEqual(
    groupKnowledgeBases(page, 'permission').map((group) => group.key),
    ['me', 'team'],
  )
  assert.deepEqual(
    groupKnowledgeBases(
      [base('solo', { permission: 'team' })],
      'permission',
    ).map((group) => group.key),
    ['team'],
  )
})

test('no grouping returns one group and an empty page returns none', () => {
  assert.deepEqual(groupKnowledgeBases(page, 'none'), [
    { key: 'all', items: page },
  ])
  assert.deepEqual(groupKnowledgeBases([], 'content'), [])
})

test('page stats only sum the loaded page', () => {
  assert.deepEqual(getKnowledgePageStats(page), {
    knowledgeBases: 3,
    documents: 5,
    chunks: 49,
  })
  assert.deepEqual(getKnowledgePageStats([]), {
    knowledgeBases: 0,
    documents: 0,
    chunks: 0,
  })
})
