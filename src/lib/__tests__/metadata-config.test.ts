import assert from 'node:assert/strict'
import test from 'node:test'
import {
  InvalidMetadataNumberError,
  metadataNumbers,
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

test('numeric list constraints and time types survive edit, save and reload', () => {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['scores'],
    properties: {
      count: { type: 'integer', minimum: 0, maximum: 10, enum: [0, 2] },
      scores: {
        type: 'array',
        minItems: 1,
        items: { type: 'number', minimum: 0, enum: [0, 1.5] },
      },
      timestamp: { type: 'time', description: 'When', enum: ['2026-10-28'] },
    },
  }
  const rows = settingsToTableData(metadataConfigToFields(schema))
  assert.deepEqual(
    rows.map((row) => row.valueType),
    ['number', 'list', 'time'],
  )
  rows[0].description = 'Edited count'
  rows[1].values = ['0', '2.5']
  const saved = metadataFieldsToConfig(tableDataToSettings(rows), schema)
  assert.deepEqual(saved, {
    ...schema,
    properties: {
      count: { ...schema.properties.count, description: 'Edited count' },
      scores: {
        ...schema.properties.scores,
        description: '',
        items: { type: 'number', minimum: 0, enum: [0, 2.5] },
      },
      timestamp: schema.properties.timestamp,
    },
  })
  assert.deepEqual(
    settingsToTableData(metadataConfigToFields(saved)).map(
      (row) => row.valueType,
    ),
    ['number', 'list', 'time'],
  )
})

test('numeric schema saves reject malformed, empty, non-finite and fractional integer values before JSON serialization', () => {
  for (const value of [
    'abc',
    '',
    '   ',
    'Infinity',
    '-Infinity',
    'NaN',
    '1e309',
    '0x10',
    NaN,
    Infinity,
  ]) {
    assert.throws(() => metadataNumbers([value]), InvalidMetadataNumberError)
    const schema = {
      type: 'object',
      properties: { scores: { type: 'array', items: { type: 'number' } } },
    }
    assert.throws(
      () =>
        metadataFieldsToConfig(
          [{ key: 'scores', type: 'list', enum: [value] }],
          schema,
        ),
      InvalidMetadataNumberError,
    )
    assert.throws(
      () =>
        tableDataToSettings([
          {
            field: 'scores',
            description: '',
            valueType: 'list',
            definition: {
              key: 'scores',
              type: 'list',
              items: { type: 'number' },
            },
            values: [String(value)],
          },
        ]),
      InvalidMetadataNumberError,
    )
  }
  assert.deepEqual(
    metadataNumbers(['0', 0, '-0', ' 1.5 ', '1e2']),
    [0, 0, -0, 1.5, 100],
  )
  assert.throws(
    () => metadataNumbers(['1.5'], true),
    InvalidMetadataNumberError,
  )
  const schema = {
    type: 'object',
    properties: { scores: { type: 'array', items: { type: 'integer' } } },
  }
  assert.throws(
    () =>
      metadataFieldsToConfig(
        [{ key: 'scores', type: 'list', enum: ['1.5'] }],
        schema,
      ),
    InvalidMetadataNumberError,
  )
  assert.deepEqual(
    metadataFieldsToConfig(
      [{ key: 'scores', type: 'list', enum: ['0', '2'] }],
      schema,
    ),
    {
      ...schema,
      properties: {
        scores: {
          description: '',
          type: 'array',
          items: { type: 'integer', enum: [0, 2] },
        },
      },
    },
  )
})
