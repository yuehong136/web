import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildVariableOptionLookup,
  buildVariableOptionSignature,
  extractMissingVariableReferences,
  filterVariableOptionGroups,
  parsePromptVariableReferences,
  parseStructuredOutputReference,
} from '../utils'
import type { VariableOptionGroup } from '../types'

const optionGroups: VariableOptionGroup[] = [
  {
    label: 'Retrieval',
    title: 'Retrieval',
    options: [
      {
        label: 'json',
        value: 'retrieval@json',
        type: 'Array<Object>',
      },
    ],
  },
  {
    label: 'Generate',
    title: 'Generate',
    options: [
      {
        label: 'text',
        value: 'generate@text',
        parentLabel: 'Generate',
        type: 'string',
      },
    ],
  },
  {
    label: 'Agent',
    title: 'Agent',
    options: [
      {
        label: 'structured',
        value: 'Agent:demo@structured',
        type: 'object',
      },
    ],
  },
]

test('filterVariableOptionGroups filters by node and variable metadata', () => {
  const byNode = filterVariableOptionGroups(optionGroups, 'retrieval')
  const byType = filterVariableOptionGroups(optionGroups, 'array<object>')

  assert.equal(byNode.length, 1)
  assert.equal(byNode[0]?.options[0]?.parentLabel, 'Retrieval')
  assert.equal(byType.length, 1)
  assert.equal(byType[0]?.options[0]?.value, 'retrieval@json')
})

test('buildVariableOptionLookup and signature include parent labels', () => {
  const lookup = buildVariableOptionLookup(optionGroups)
  const signature = buildVariableOptionSignature(optionGroups)

  assert.deepEqual(lookup['retrieval@json'], {
    label: 'json',
    value: 'retrieval@json',
    parentLabel: 'Retrieval',
    type: 'Array<Object>',
  })
  assert.match(signature, /retrieval@json:json:Retrieval:Array<Object>/)
})

test('parsePromptVariableReferences normalizes braces and deduplicates values', () => {
  assert.deepEqual(
    parsePromptVariableReferences('{begin@query} and {{retrieval@json}} {begin@query}'),
    ['begin@query', 'retrieval@json'],
  )
})

test('parseStructuredOutputReference exposes base value and sub path', () => {
  assert.deepEqual(parseStructuredOutputReference('{Agent:demo@structured.answer}'), {
    nodeId: 'Agent:demo',
    field: 'structured.answer',
    baseValue: 'Agent:demo@structured',
    path: 'answer',
  })
})

test('extractMissingVariableReferences treats structured sub paths as present when base output exists', () => {
  assert.deepEqual(
    extractMissingVariableReferences(
      '{Agent:demo@structured.answer} {missing@value}',
      optionGroups,
    ),
    ['missing@value'],
  )
})
