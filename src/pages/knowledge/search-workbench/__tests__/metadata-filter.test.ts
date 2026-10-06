import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createActiveMetaDataFilter,
  getMetadataFilterIssue,
} from '../adapters/metadata-filter'
import { knowledgeAPI } from '@/api/knowledge'

const empty = {
  metadataCondition: { conditions: [] },
  metadataSemiAutoFields: [],
}

test('manual request operators match retrieval, preserving zero, false, logic and valueless conditions', () => {
  const pairs = [
    ['is', '='],
    ['not is', '≠'],
    ['!=', '≠'],
    ['>=', '≥'],
    ['<=', '≤'],
    ['>', '>'],
    ['<', '<'],
    ['≥', '≥'],
    ['≤', '≤'],
    ['contains', 'contains'],
    ['not contains', 'not contains'],
    ['start with', 'start with'],
    ['end with', 'end with'],
  ]
  for (const [ui, wire] of pairs) {
    const filter = createActiveMetaDataFilter({
      ...empty,
      metadataMode: 'manual',
      metadataCondition: {
        logic: 'or',
        conditions: [
          { name: ' version ', comparison_operator: ui, value: ' v2 ' },
        ],
      },
    })
    assert.deepEqual(filter, {
      method: 'manual',
      logic: 'or',
      manual: [{ key: 'version', op: wire, value: 'v2' }],
    })
  }
  for (const value of [0, false]) {
    assert.equal(
      createActiveMetaDataFilter({
        ...empty,
        metadataMode: 'manual',
        metadataCondition: {
          conditions: [{ name: 'field', comparison_operator: '', value }],
        },
      })?.manual?.[0].value,
      String(value),
    )
  }
  for (const op of ['empty', 'not empty']) {
    assert.deepEqual(
      createActiveMetaDataFilter({
        ...empty,
        metadataMode: 'manual',
        metadataCondition: {
          conditions: [
            {
              name: 'field',
              comparison_operator: op,
              value: 'old hidden value',
            },
          ],
        },
      })?.manual,
      [{ key: 'field', op, value: '' }],
    )
  }
})

test('enabled incomplete filters cannot silently become an unfiltered or partial query', () => {
  for (const options of [
    { ...empty, metadataMode: 'manual' as const },
    { ...empty, metadataMode: 'semi_auto' as const },
    {
      ...empty,
      metadataMode: 'manual' as const,
      metadataCondition: {
        conditions: [
          { name: 'version', comparison_operator: 'is', value: 'v2' },
          { name: 'author', comparison_operator: 'is', value: ' ' },
        ],
      },
    },
    {
      ...empty,
      metadataMode: 'manual' as const,
      metadataCondition: {
        conditions: [{ name: ' ', comparison_operator: 'empty' }],
      },
    },
    {
      ...empty,
      metadataMode: 'semi_auto' as const,
      metadataSemiAutoFields: [{ key: 'version', op: 'unknown' }],
    },
  ]) {
    assert.ok(getMetadataFilterIssue(options))
    assert.throws(() => createActiveMetaDataFilter(options))
  }
  assert.equal(
    createActiveMetaDataFilter({ ...empty, metadataMode: 'disabled' }),
    undefined,
  )
  assert.deepEqual(
    createActiveMetaDataFilter({ ...empty, metadataMode: 'auto' }),
    { method: 'auto' },
  )
})

test('real domain requests combine document scope and normalized manual/semi-auto filters without changing pagination', async (t) => {
  const calls: Array<{ url: URL; body: Record<string, unknown> }> = []
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url: new URL(url), body: JSON.parse(String(init.body)) })
    return new Response(
      JSON.stringify({
        code: 0,
        data: { total: 0, chunks: [], doc_aggs: [], labels: {} },
      }),
      { headers: { 'content-type': 'application/json' } },
    )
  })
  for (const meta_data_filter of [
    createActiveMetaDataFilter({
      ...empty,
      metadataMode: 'manual',
      metadataCondition: {
        conditions: [
          { name: 'version', comparison_operator: 'is', value: 'v2' },
        ],
      },
    }),
    createActiveMetaDataFilter({
      ...empty,
      metadataMode: 'semi_auto',
      metadataSemiAutoFields: [
        { key: ' version ', op: 'not is' },
        { key: 'author' },
      ],
    }),
    createActiveMetaDataFilter({ ...empty, metadataMode: 'auto' }),
  ]) {
    const result = await knowledgeAPI.retrievalTest.test({
      kb_ids: ['kb/1'],
      question: 'q',
      doc_ids: ['a'],
      meta_data_filter,
      page: 2,
      size: 10,
    })
    assert.equal(result.total, 0)
    assert.deepEqual(calls.at(-1)?.body, {
      dataset_ids: ['kb/1'],
      question: 'q',
      doc_ids: ['a'],
      meta_data_filter,
      page: 2,
      size: 10,
    })
    assert.equal(calls.at(-1)?.url.pathname, '/api/v1/datasets/kb%2F1/search')
  }
  assert.deepEqual(calls[1].body.meta_data_filter, {
    method: 'semi_auto',
    semi_auto: [{ key: 'version', op: '≠' }, 'author'],
  })
})
