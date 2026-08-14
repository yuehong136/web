import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  Operator,
  NodeMap,
  initialA2UIValues,
  initialMessageValues,
} from '../constant'
import {
  A2UI_AGENT_PROMPT_TEMPLATE,
  A2UI_BASIC_COMPONENTS,
} from '../form/a2ui/catalog'

test('A2UI operator is registered across canvas and form registries', () => {
  assert.equal(Operator.A2UI, 'A2UI')
  assert.equal(NodeMap[Operator.A2UI], 'a2uiNode')
  assert.ok(initialA2UIValues.commands[0].includes('"version": "v0.9"'))

  const agentDir = fileURLToPath(new URL('..', import.meta.url))
  const formRendererRegistry = readFileSync(
    `${agentDir}/features/form-sheet/components/form-renderer-registry.ts`,
    'utf8',
  )
  assert.match(formRendererRegistry, /\[Operator\.A2UI\]: A2UIForm/)
})

test('Message initial values no longer expose structured A2UI toggle', () => {
  assert.equal('structured_a2ui_enabled' in initialMessageValues, false)
})

test('A2UI agent prompt constrains output to official Basic Catalog', () => {
  assert.ok(A2UI_BASIC_COMPONENTS.includes('ChoicePicker'))
  assert.ok(A2UI_BASIC_COMPONENTS.includes('TextField'))
  assert.equal(
    (A2UI_BASIC_COMPONENTS as readonly string[]).includes('Form'),
    false,
  )
  assert.match(A2UI_AGENT_PROMPT_TEMPLATE, /只输出一个 JSON array/)
  assert.match(A2UI_AGENT_PROMPT_TEMPLATE, /```json/)
  assert.match(A2UI_AGENT_PROMPT_TEMPLATE, /```a2ui/)
  assert.match(A2UI_AGENT_PROMPT_TEMPLATE, /MultiSelect -> ChoicePicker/)
})
