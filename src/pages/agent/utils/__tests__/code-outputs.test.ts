import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CodeTemplateStrMap,
  JsonSchemaDataType,
  ProgrammingLanguage,
  initialCodeValues,
} from '../../constant'
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
import { CodeTemplateId, CodeTemplatePresetMap } from '../code-templates'

test('default CodeExec template returns the declared string output type', () => {
  assert.equal(initialCodeValues.outputs.result.type, JsonSchemaDataType.String)
  assert.match(
    CodeTemplateStrMap[ProgrammingLanguage.Python],
    /return "success"/,
  )
  assert.doesNotMatch(
    CodeTemplateStrMap[ProgrammingLanguage.Python],
    /return\s+\{/,
  )
})

test('default JavaScript CodeExec template matches main(args) runtime', () => {
  const script = CodeTemplateStrMap[ProgrammingLanguage.JavaScript]

  assert.match(script, /function main\(args\)/)
  assert.match(script, /module\.exports\s*=\s*\{\s*main\s*\}/)
  assert.doesNotMatch(script, /function main\(arg1,\s*arg2\)/)
  assert.doesNotMatch(script, /process\.argv/)
})

test('CodeExec template presets declare matching output types', () => {
  assert.equal(
    CodeTemplatePresetMap[CodeTemplateId.StringResult].outputType,
    JsonSchemaDataType.String,
  )
  assert.equal(
    CodeTemplatePresetMap[CodeTemplateId.ObjectResult].outputType,
    JsonSchemaDataType.Object,
  )
  assert.equal(
    CodeTemplatePresetMap[CodeTemplateId.CsvArtifact].language,
    ProgrammingLanguage.Python,
  )
})

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
