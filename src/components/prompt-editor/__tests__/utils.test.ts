import assert from 'node:assert/strict'
import test from 'node:test'
import { buildVariableOptionLookup, buildVariableOptionSignature, filterVariableOptionGroups } from '../utils'
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
