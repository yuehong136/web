import assert from 'node:assert/strict'
import test from 'node:test'
import {
  metadataConfigToFields,
  metadataFieldsToConfig,
  settingsToTableData,
  tableDataToSettings,
} from '../metadata-config'

test('types survive array and schema editing and unknown field options survive', () => {
  const fields = [
    {
      key: 'year',
      type: 'number' as const,
      enum: ['2026'],
      future: { keep: true },
    },
    { key: 'tags', type: 'list' as const, enum: ['A'] },
  ]
  const rows = settingsToTableData(fields)
  assert.equal(rows[0].valueType, 'number')
  const saved = tableDataToSettings(rows)
  assert.equal(saved[0].type, 'number')
  assert.deepEqual(saved[0].future, { keep: true })
  assert.equal(settingsToTableData(saved)[1].valueType, 'list')
  const schema = {
    type: 'object',
    properties: {
      year: { type: 'integer', minimum: 1900, enum: [2026] },
      tags: { type: 'array', items: { type: 'string', enum: ['A'] } },
    },
    required: ['year'],
    additionalProperties: false,
    future: true,
  }
  const converted = metadataConfigToFields(schema)
  assert.deepEqual(
    converted.map((field) => field.type),
    ['number', 'list'],
  )
  const reloaded = metadataFieldsToConfig(
    tableDataToSettings(settingsToTableData(converted)),
    schema,
  )
  assert.deepEqual(reloaded, {
    ...schema,
    properties: {
      year: { ...schema.properties.year, description: '' },
      tags: { ...schema.properties.tags, description: '' },
    },
  })
})

test('legacy names and examples remain distinguishable from enum constraints', () => {
  const original = [
    {
      key: '',
      name: 'year',
      type: 'time' as const,
      examples: ['2026'],
      restrict_values: false,
    },
  ]
  const rows = settingsToTableData(original)
  assert.equal(rows[0].field, 'year')
  assert.equal(rows[0].restrictDefinedValues, false)
  let saved = tableDataToSettings(rows)
  assert.deepEqual(saved[0].examples, ['2026'])
  assert.equal(saved[0].enum, undefined)
  rows[0].restrictDefinedValues = true
  saved = tableDataToSettings(rows)
  assert.deepEqual(saved[0].enum, ['2026'])
  assert.equal(saved[0].examples, undefined)
  rows[0].restrictDefinedValues = false
  assert.equal(tableDataToSettings(rows)[0].enum, undefined)
})

test('editing schema fields clears removed definitions without losing unrelated constraints', () => {
  const schema = {
    type: 'object',
    properties: { x: { type: 'number', minimum: 0 } },
    required: ['x'],
    additionalProperties: false,
  }
  assert.deepEqual(metadataFieldsToConfig([], schema), {
    ...schema,
    properties: {},
    required: [],
  })
  assert.deepEqual(schema.properties.x, { type: 'number', minimum: 0 })
})
