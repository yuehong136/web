import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildVariableOptionLookup,
  buildVariableOptionSignature,
  appendPromptVariablePath,
  extractMissingVariableReferences,
  extractLeadingPromptVariablePath,
  filterVariableOptionGroups,
  parsePromptVariableReferences,
  parseStructuredOutputReference,
  resolvePromptVariableOption,
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
    parsePromptVariableReferences(
      '{begin@query} and {{retrieval@json}} {begin@query}',
    ),
    ['begin@query', 'retrieval@json'],
  )
})

test('parseStructuredOutputReference exposes base value and sub path', () => {
  assert.deepEqual(
    parseStructuredOutputReference('{Agent:demo@structured.answer}'),
    {
      nodeId: 'Agent:demo',
      field: 'structured.answer',
      baseValue: 'Agent:demo@structured',
      path: 'answer',
    },
  )
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

test('extractLeadingPromptVariablePath reads a leading dot path suffix', () => {
  assert.deepEqual(extractLeadingPromptVariablePath('.answer.text rest'), {
    pathSuffix: '.answer.text',
    remainingText: ' rest',
  })
  assert.deepEqual(extractLeadingPromptVariablePath('[0].answer'), undefined)
})

test('appendPromptVariablePath extends the value and display label', () => {
  assert.deepEqual(
    appendPromptVariablePath(
      {
        label: 'json',
        value: 'retrieval@json',
        parentLabel: 'Retrieval',
        type: 'object',
      },
      '.answer',
    ),
    {
      label: 'json.answer',
      value: 'retrieval@json.answer',
      parentLabel: 'Retrieval',
      type: 'object',
    },
  )
})

test('resolvePromptVariableOption resolves a path reference from its base output', () => {
  assert.deepEqual(
    resolvePromptVariableOption('retrieval@json.answer', flattenOptions()),
    {
      label: 'json.answer',
      value: 'retrieval@json.answer',
      parentLabel: 'Retrieval',
      type: 'Array<Object>',
    },
  )
})

test('extractMissingVariableReferences accepts path references when the base output exists', () => {
  assert.deepEqual(
    extractMissingVariableReferences(
      '{retrieval@json.answer} {generate@text} {missing@value.name}',
      optionGroups,
    ),
    ['missing@value.name'],
  )
})

function flattenOptions() {
  return optionGroups.flatMap((group) =>
    group.options.map((option) => ({
      ...option,
      parentLabel: option.parentLabel ?? group.title,
    })),
  )
}
