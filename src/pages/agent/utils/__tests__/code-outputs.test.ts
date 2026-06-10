import assert from 'node:assert/strict'
import test from 'node:test'
import { JsonSchemaDataType } from '../../constant'
import { CodeContentOutputKey, getCodeNodeOutputs } from '../code-outputs'

test('getCodeNodeOutputs adds the system content output', () => {
  const outputs = getCodeNodeOutputs({
    result: {
      type: JsonSchemaDataType.Object,
      value: {},
    },
  })

  assert.deepEqual(Object.keys(outputs), ['result', CodeContentOutputKey])
  assert.deepEqual(outputs[CodeContentOutputKey], {
    type: JsonSchemaDataType.String,
    value: '',
  })
})

test('getCodeNodeOutputs does not override an existing content output', () => {
  const outputs = getCodeNodeOutputs({
    [CodeContentOutputKey]: {
      type: JsonSchemaDataType.Object,
      value: { nested: true },
    },
  })

  assert.deepEqual(outputs[CodeContentOutputKey], {
    type: JsonSchemaDataType.Object,
    value: { nested: true },
  })
})
