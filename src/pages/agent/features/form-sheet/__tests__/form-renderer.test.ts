import assert from 'node:assert/strict'
import test from 'node:test'
import { Operator } from '../../../constant'
import { AgentForm } from '../../../form/agent'
import { BeginForm } from '../../../form/begin'
import { GenerateForm } from '../../../form/generate'
import { MessageForm } from '../../../form/message'
import { RetrievalForm } from '../../../form/retrieval'
import { SwitchForm } from '../../../form/switch'
import { ToolForm } from '../../../form/tool'
import { BingForm } from '../../../form/bing-form'
import { McpForm } from '../../../form/mcp-form'
import { FormConfigMap } from '../../../form/index'
import {
  legacyFormRenderers,
  migratedFormRenderers,
  resolveFormRendererComponent,
} from '../components/form-renderer-registry'
import { MCP_FORM_RENDERER_KEY } from '../utils'

test('migrated operators resolve to directory modules in the form renderer', () => {
  assert.equal(resolveFormRendererComponent(Operator.Begin), BeginForm)
  assert.equal(resolveFormRendererComponent(Operator.Retrieval), RetrievalForm)
  assert.equal(resolveFormRendererComponent(Operator.Generate), GenerateForm)
  assert.equal(resolveFormRendererComponent(Operator.Message), MessageForm)
  assert.equal(resolveFormRendererComponent(Operator.Agent), AgentForm)
  assert.equal(resolveFormRendererComponent(Operator.Tool), ToolForm)
  assert.equal(resolveFormRendererComponent(Operator.Switch), SwitchForm)
  assert.equal(migratedFormRenderers[Operator.Begin], BeginForm)
  assert.equal(migratedFormRenderers[Operator.Agent], AgentForm)
})

test('legacy operators and the MCP renderer stay on compatibility bridges', () => {
  assert.equal(resolveFormRendererComponent(Operator.Bing), BingForm)
  assert.equal(resolveFormRendererComponent(MCP_FORM_RENDERER_KEY), McpForm)
  assert.equal(legacyFormRenderers[Operator.Bing], BingForm)
  assert.equal(legacyFormRenderers[MCP_FORM_RENDERER_KEY], McpForm)
  assert.equal(resolveFormRendererComponent(undefined), null)
})

test('form config map keeps migrated operators available through the compatibility export', () => {
  assert.equal(FormConfigMap[Operator.Begin], BeginForm)
  assert.equal(FormConfigMap[Operator.Generate], GenerateForm)
  assert.equal(FormConfigMap[Operator.Tool], ToolForm)
  assert.equal(FormConfigMap[Operator.Bing], BingForm)
})
