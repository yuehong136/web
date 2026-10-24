import assert from 'node:assert/strict'
import test from 'node:test'
import { Operator, NodeHandleId } from '../../constant'
import { browserFormSchema } from '../../form/browser-use/schema'
import { initialBrowserValues } from '../../form/browser-use/constants'
import { agentOperatorRegistry } from '../registry'
import { getOperatorDefaultForm } from '../defaults'
import {
  buildGraphNode,
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../serializers'

test('Browser is an agent tool with fresh defaults, debug and both outputs', () => {
  const definition = agentOperatorRegistry[Operator.Browser]
  assert.equal(definition.category, 'tool')
  assert.equal(definition.mode, 'agent')
  assert.equal(definition.allowSingleStepDebug, true)
  const first = getOperatorDefaultForm(Operator.Browser)
  assert.equal(first.temperature, 0)
  assert.equal(first.max_steps, 30)
  assert.equal(first.headless, true)
  assert.equal(first.enable_default_extensions, false)
  assert.equal(first.chromium_sandbox, false)
  assert.equal(first.persist_session, true)
  assert.deepEqual(first.upload_sources, [])
  assert.deepEqual(first.outputs, initialBrowserValues.outputs)
  ;(first.upload_sources as string[]).push('changed')
  assert.deepEqual(getOperatorDefaultForm(Operator.Browser).upload_sources, [])
})

test('Browser graph and component-only DSL preserve exact zero, booleans, inputs and output references', () => {
  const form = {
    ...initialBrowserValues,
    llm_id: 'controlled@OpenAI-API-Compatible',
    prompts: 'Inspect {sys.query} with {Begin:begin@request}',
    temperature: 0,
    headless: false,
    enable_default_extensions: true,
    chromium_sandbox: true,
    persist_session: false,
    upload_sources: [
      '{sys.files}',
      '{Begin:begin@files}',
      'scoped-file',
      'https://example.test/file.pdf',
      { id: 'runtime-upload' },
    ],
  }
  const browser = buildGraphNode(Operator.Browser, { id: 'Browser:one', form })
  const message = buildGraphNode(Operator.Message, {
    id: 'Message:answer',
    form: {
      content: ['{Browser:one@content}', '{Browser:one@downloaded_files}'],
    },
  })
  const dsl = serializeGraphToDsl({
    graph: {
      nodes: [browser, message],
      edges: [
        {
          id: 'next',
          source: browser.id,
          target: message.id,
          sourceHandle: NodeHandleId.Start,
          targetHandle: NodeHandleId.End,
        },
      ],
    },
  })
  assert.deepEqual(dsl.components[browser.id]!.obj.params, form)
  for (const input of [dsl, { ...dsl, graph: undefined }]) {
    const restored = deserializeDslToGraph(input)
    const again = serializeGraphToDsl({ graph: restored.graph })
    assert.deepEqual(again.components[browser.id]!.obj.params, form)
    assert.deepEqual(again.components[message.id]!.obj.params.content, [
      '{Browser:one@content}',
      '{Browser:one@downloaded_files}',
    ])
  }
})

test('Browser schema rejects coercion, fractional steps and nonfinite numbers while accepting legal zero and false', () => {
  const valid = { ...initialBrowserValues, llm_id: 'controlled@OpenAI' }
  assert.equal(browserFormSchema.safeParse(valid).success, true)
  for (const value of ['', '   '])
    assert.equal(
      browserFormSchema.safeParse({ ...valid, llm_id: value }).success,
      false,
    )
  for (const value of [0, -1, 1.5, '', false, '30', Number.NaN, Infinity]) {
    assert.equal(
      browserFormSchema.safeParse({ ...valid, max_steps: value }).success,
      false,
    )
  }
  for (const name of [
    'headless',
    'enable_default_extensions',
    'chromium_sandbox',
    'persist_session',
  ]) {
    assert.equal(
      browserFormSchema.safeParse({ ...valid, [name]: 'false' }).success,
      false,
    )
    assert.equal(
      browserFormSchema.safeParse({ ...valid, [name]: false }).success,
      true,
    )
  }
  assert.equal(
    browserFormSchema.safeParse({
      ...valid,
      temperature: Number.NaN,
    }).success,
    false,
  )
  assert.equal(
    browserFormSchema.safeParse({ ...valid, prompts: '   ' }).success,
    false,
  )
  assert.equal(
    browserFormSchema.safeParse({
      ...valid,
      upload_sources: '{sys.files}',
    }).success,
    false,
  )
})
