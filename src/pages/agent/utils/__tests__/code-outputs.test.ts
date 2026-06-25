import assert from 'node:assert/strict'
import test from 'node:test'
import { JsonSchemaDataType } from '../../constant'
import {
  CodeActualTypeOutputKey,
  CodeAttachmentsOutputKey,
  CodeContentOutputKey,
  CodeRawResultOutputKey,
  buildDefaultCodeOutput,
  deserializeCodeOutputContract,
  getBusinessOutputs,
  getCodeNodeOutputs,
  isValidCodeOutputName,
  serializeCodeOutputContract,
} from '../code-outputs'

test('getCodeNodeOutputs adds CodeExec panel system outputs', () => {
  const outputs = getCodeNodeOutputs({
    result: {
      type: JsonSchemaDataType.Object,
      value: {},
    },
  })

  assert.deepEqual(Object.keys(outputs), [
    'result',
    CodeContentOutputKey,
    CodeActualTypeOutputKey,
    CodeRawResultOutputKey,
    CodeAttachmentsOutputKey,
  ])
  assert.deepEqual(outputs[CodeContentOutputKey], {
    type: JsonSchemaDataType.String,
    value: '',
  })
  assert.deepEqual(outputs[CodeActualTypeOutputKey], {
    type: JsonSchemaDataType.String,
    value: '',
  })
  assert.deepEqual(outputs[CodeRawResultOutputKey], {
    type: JsonSchemaDataType.Object,
    value: null,
  })
  assert.deepEqual(outputs[CodeAttachmentsOutputKey], {
    type: 'array<string>',
    value: [],
  })
})

test('getCodeNodeOutputs does not override existing system outputs', () => {
  const outputs = getCodeNodeOutputs({
    [CodeContentOutputKey]: {
      type: JsonSchemaDataType.Object,
      value: { nested: true },
    },
    [CodeAttachmentsOutputKey]: {
      type: JsonSchemaDataType.Array,
      value: ['doc'],
    },
  })

  assert.deepEqual(outputs[CodeContentOutputKey], {
    type: JsonSchemaDataType.Object,
    value: { nested: true },
  })
  assert.deepEqual(outputs[CodeAttachmentsOutputKey], {
    type: JsonSchemaDataType.Array,
    value: ['doc'],
  })
})

test('CodeExec output names reject reserved keys and path-like names', () => {
  assert.equal(isValidCodeOutputName('answer'), true)
  assert.equal(isValidCodeOutputName(' content '), false)
  assert.equal(isValidCodeOutputName('raw_result'), false)
  assert.equal(isValidCodeOutputName('answer.text'), false)
  assert.equal(isValidCodeOutputName(''), false)
})

test('serialize and deserialize preserve the single business output contract', () => {
  const outputs = serializeCodeOutputContract({
    name: 'answer',
    type: JsonSchemaDataType.Object,
  })

  assert.deepEqual(outputs, {
    answer: {
      type: JsonSchemaDataType.Object,
      value: null,
    },
  })
  assert.deepEqual(deserializeCodeOutputContract({ outputs }), {
    contract: {
      name: 'answer',
      type: JsonSchemaDataType.Object,
    },
  })
})

test('deserializeCodeOutputContract defaults missing business output to result string', () => {
  assert.deepEqual(deserializeCodeOutputContract({ outputs: {} }), {
    contract: buildDefaultCodeOutput(),
  })
})

test('multiple business outputs are not treated as a valid single-output contract', () => {
  const outputs = {
    first: {
      type: JsonSchemaDataType.String,
      value: '',
    },
    second: {
      type: JsonSchemaDataType.Number,
      value: 0,
    },
    [CodeContentOutputKey]: {
      type: JsonSchemaDataType.String,
      value: 'log',
    },
  }

  assert.deepEqual(Object.keys(getBusinessOutputs(outputs)), [
    'first',
    'second',
  ])
  assert.deepEqual(deserializeCodeOutputContract({ outputs }), {
    contract: buildDefaultCodeOutput(),
  })
})

test('serializeCodeOutputContract drops invalid contracts', () => {
  assert.deepEqual(
    serializeCodeOutputContract({
      name: 'actual_type',
      type: JsonSchemaDataType.String,
    }),
    {},
  )
  assert.deepEqual(
    serializeCodeOutputContract({
      name: 'answer.value',
      type: JsonSchemaDataType.String,
    }),
    {},
  )
})
