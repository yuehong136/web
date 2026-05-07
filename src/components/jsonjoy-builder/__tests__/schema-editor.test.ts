import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createFieldSchema,
  getArrayItemsSchema,
  getSchemaProperties,
  renameObjectProperty,
  removeObjectProperty,
  updateObjectProperty,
  updatePropertyRequired,
  validateFieldName,
} from '../lib/schema-editor'
import type { JSONSchema, ObjectJSONSchema } from '../types/json-schema'
import { isObjectSchema } from '../types/json-schema'

function getObjectSchema(schema: JSONSchema | null | undefined) {
  return isObjectSchema(schema ?? false)
    ? (schema as ObjectJSONSchema)
    : undefined
}

test('schema editor creates fields with type and description', () => {
  assert.deepEqual(
    createFieldSchema({
      name: 'answer',
      type: 'string',
      description: 'Final answer',
      required: true,
    }),
    {
      type: 'string',
      description: 'Final answer',
    },
  )
})

test('schema editor adds, renames, removes, and tracks required properties', () => {
  let schema: ObjectJSONSchema = { type: 'object', properties: {} }

  schema = updateObjectProperty(schema, 'answer', {
    type: 'string',
    description: 'Final answer',
  })
  schema = updatePropertyRequired(schema, 'answer', true)

  assert.deepEqual(getSchemaProperties(schema), [
    {
      name: 'answer',
      schema: {
        type: 'string',
        description: 'Final answer',
      },
      required: true,
    },
  ])

  const answerSchema = schema.properties?.answer ?? false
  schema = updateObjectProperty(schema, 'finalAnswer', answerSchema)
  schema = removeObjectProperty(schema, 'answer')
  schema = updatePropertyRequired(schema, 'finalAnswer', true)

  assert.equal(schema.properties?.answer, undefined)
  const finalAnswerSchema = schema.properties?.finalAnswer
  const finalAnswerObject = getObjectSchema(finalAnswerSchema)
  assert.equal(
    finalAnswerObject?.type,
    'string',
  )
  assert.deepEqual(schema.required, ['finalAnswer'])

  schema = removeObjectProperty(schema, 'finalAnswer')
  assert.deepEqual(schema.properties, {})
  assert.deepEqual(schema.required, [])
})

test('schema editor validates field names', () => {
  assert.equal(validateFieldName('answer'), true)
  assert.equal(validateFieldName('_answer'), true)
  assert.equal(validateFieldName('answer_1'), true)
  assert.equal(validateFieldName('1answer'), false)
  assert.equal(validateFieldName('answer-text'), false)
  assert.equal(validateFieldName(''), false)
})

test('schema editor removes stale required keys after rename', () => {
  let schema: ObjectJSONSchema = {
    type: 'object',
    properties: {
      answer: { type: 'string' },
    },
    required: ['answer'],
  }

  const answerSchema = schema.properties?.answer ?? false
  schema = updateObjectProperty(schema, 'finalAnswer', answerSchema)
  schema = updatePropertyRequired(schema, 'finalAnswer', true)
  schema = removeObjectProperty(schema, 'answer')

  assert.deepEqual(schema.required, ['finalAnswer'])
})

test('schema editor keeps required order stable after rename', () => {
  const schema: ObjectJSONSchema = {
    type: 'object',
    properties: {
      answer: { type: 'string' },
      score: { type: 'number' },
      meta: { type: 'object', properties: {} },
    },
    required: ['answer', 'score', 'meta'],
  }

  const nextSchema = renameObjectProperty(
    schema,
    'answer',
    'finalAnswer',
    schema.properties?.answer ?? false,
    true,
  )

  assert.deepEqual(Object.keys(nextSchema.properties || {}), [
    'finalAnswer',
    'score',
    'meta',
  ])
  assert.deepEqual(nextSchema.required, ['finalAnswer', 'score', 'meta'])
})

test('schema editor represents nested array object schemas', () => {
  const schema: ObjectJSONSchema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            score: { type: 'number', description: 'Confidence score' },
          },
          required: ['score'],
        },
      },
    },
  }

  const itemsSchema = schema.properties?.items
  const itemSchema = getArrayItemsSchema(itemsSchema ?? false)
  const itemsObject = getObjectSchema(itemsSchema)
  const itemObject = getObjectSchema(itemSchema)

  assert.equal(itemsObject?.type, 'array')
  assert.equal(itemObject?.type, 'object')
  assert.deepEqual(getSchemaProperties(itemSchema ?? false), [
    {
      name: 'score',
      schema: {
        type: 'number',
        description: 'Confidence score',
      },
      required: true,
    },
  ])
})
