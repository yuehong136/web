import assert from 'node:assert/strict'
import test from 'node:test'
import {
  convertMessageContentToObjectArray,
  convertMessageContentToStringArray,
  getMessagePreviewText,
  normalizeMessageFormForStore,
} from '../message-content'

test('message content converts between editor objects and persisted strings', () => {
  assert.deepEqual(convertMessageContentToObjectArray(['hello', 'world']), [
    { value: 'hello' },
    { value: 'world' },
  ])
  assert.deepEqual(
    convertMessageContentToStringArray([{ value: 'hello' }, { value: 'world' }]),
    ['hello', 'world'],
  )
})

test('message preview text and store normalization tolerate legacy object content', () => {
  assert.equal(getMessagePreviewText([{ value: 'preview' }]), 'preview')
  assert.deepEqual(
    normalizeMessageFormForStore({
      content: [{ value: 'stored' }],
    }),
    {
      content: ['stored'],
    },
  )
})
