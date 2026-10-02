import assert from 'node:assert/strict'
import test from 'node:test'
import { getDocumentStatusOutcome } from '../utils/status-result'

test('result accounting requires explicit matching status for each unique requested ID', () => {
  const request = {
    datasetId: 'dataset',
    docIds: ['a', 'a', 'b', 'c'],
    status: 0 as const,
  }
  for (const bad of [
    undefined,
    null,
    {},
    [],
    false,
    { status: 0 },
    { status: '1' },
    { status: '0', error: '' },
    { error: 'unsafe' },
  ]) {
    const result = getDocumentStatusOutcome(
      request,
      { a: { status: '0' }, b: bad, extra: { status: '0' } },
      true,
    )
    assert.deepEqual(result, {
      succeededIds: ['a'],
      failedIds: ['b', 'c'],
      complete: false,
    })
  }
  for (const malformed of [null, [], false, 'anything']) {
    assert.deepEqual(
      getDocumentStatusOutcome(request, malformed, true).failedIds,
      ['a', 'b', 'c'],
    )
  }
  assert.equal(
    getDocumentStatusOutcome(
      request,
      { a: { status: '0' }, b: { status: '0' }, c: { status: '0' } },
      true,
    ).complete,
    true,
  )
  assert.equal(
    getDocumentStatusOutcome(
      request,
      { a: { status: '0' }, b: { status: '0' }, c: { status: '0' } },
      false,
    ).complete,
    false,
  )
  assert.equal(
    getDocumentStatusOutcome({ ...request, docIds: [] }, {}, true).complete,
    false,
  )
  assert.deepEqual(
    getDocumentStatusOutcome({ ...request, docIds: ['toString'] }, {}, true)
      .failedIds,
    ['toString'],
  )
})
