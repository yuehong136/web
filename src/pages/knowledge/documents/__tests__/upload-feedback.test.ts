import assert from 'node:assert/strict'
import test from 'node:test'
import { reconcileDocumentUploads } from '../upload-feedback'

const file = (name: string) => new File(['bytes'], name)

test('partial upload confirms only matched files and keeps native pending files', () => {
  const first = file('first.txt')
  const second = file('second.txt')
  const result = reconcileDocumentUploads(
    [first, second],
    [{ id: 'created', name: 'second.txt' }],
  )
  assert.equal(result.valid, true)
  assert.equal(result.confirmed[0].file, second)
  assert.deepEqual(result.unconfirmed, [first])
})

test('malformed, duplicate and unrelated acknowledgements cannot turn HTTP 200 into success', () => {
  const files = [file('first.txt'), file('second.txt')]
  for (const response of [
    undefined,
    {},
    [{ id: 'created' }],
    [{ id: '', name: 'first.txt' }],
    [{ id: 'created', name: 'other.txt' }],
    [
      { id: 'same', name: 'first.txt' },
      { id: 'same', name: 'second.txt' },
    ],
  ]) {
    const result = reconcileDocumentUploads(files, response)
    assert.equal(result.valid, false)
    assert.equal(result.confirmed.length, 0)
    assert.deepEqual(result.unconfirmed, files)
  }
})

test('equal filenames require complete distinct acknowledgements before file mapping is confirmed', () => {
  const files = [file('same.txt'), file('same.txt')]
  assert.equal(
    reconcileDocumentUploads(files, [{ id: 'one', name: 'same.txt' }]).valid,
    false,
  )
  const result = reconcileDocumentUploads(files, [
    { id: 'one', name: 'same.txt' },
    { id: 'two', name: 'same.txt' },
  ])
  assert.equal(result.confirmed.length, 2)
  assert.deepEqual(result.unconfirmed, [])
})
