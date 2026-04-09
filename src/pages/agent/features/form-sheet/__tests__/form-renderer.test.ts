import assert from 'node:assert/strict'
import test from 'node:test'
import { Operator } from '../../../constant'
import { AgentForm } from '../../../form/agent'
import { BeginForm } from '../../../form/begin'
import { DataOperationsForm } from '../../../form/data-operations'
import { GenerateForm } from '../../../form/generate'
import { InvokeForm } from '../../../form/invoke'
import { IterationForm } from '../../../form/iteration'
import { IterationStartForm } from '../../../form/iteration-start'
import { ListOperationsForm } from '../../../form/list-operations'
import { LoopForm } from '../../../form/loop'
import { MessageForm } from '../../../form/message'
import { RetrievalForm } from '../../../form/retrieval'
import { StringTransformForm } from '../../../form/string-transform'
import { SwitchForm } from '../../../form/switch'
import { ToolForm } from '../../../form/tool'
import { UserFillUpForm } from '../../../form/user-fill-up'
import { VariableAggregatorForm } from '../../../form/variable-aggregator'
import { VariableAssignerForm } from '../../../form/variable-assigner'
import { ExtractorForm } from '../../../form/extractor'
import { ExeSQLForm } from '../../../form/exesql'
import { HierarchicalMergerForm } from '../../../form/hierarchical-merger'
import { ParserForm } from '../../../form/parser'
import { PDFGeneratorForm } from '../../../form/pdf-generator'
import { SplitterForm } from '../../../form/splitter'
import { TokenizerForm } from '../../../form/tokenizer'
import { BingForm } from '../../../form/bing-form'
import { EmailForm } from '../../../form/email-form'
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
  assert.equal(resolveFormRendererComponent(Operator.Iteration), IterationForm)
  assert.equal(resolveFormRendererComponent(Operator.IterationStart), IterationStartForm)
  assert.equal(resolveFormRendererComponent(Operator.Loop), LoopForm)
  assert.equal(resolveFormRendererComponent(Operator.Invoke), InvokeForm)
  assert.equal(resolveFormRendererComponent(Operator.DataOperations), DataOperationsForm)
  assert.equal(resolveFormRendererComponent(Operator.ListOperations), ListOperationsForm)
  assert.equal(resolveFormRendererComponent(Operator.VariableAggregator), VariableAggregatorForm)
  assert.equal(resolveFormRendererComponent(Operator.VariableAssigner), VariableAssignerForm)
  assert.equal(resolveFormRendererComponent(Operator.UserFillUp), UserFillUpForm)
  assert.equal(resolveFormRendererComponent(Operator.StringTransform), StringTransformForm)
  assert.equal(resolveFormRendererComponent(Operator.Parser), ParserForm)
  assert.equal(resolveFormRendererComponent(Operator.Tokenizer), TokenizerForm)
  assert.equal(resolveFormRendererComponent(Operator.Splitter), SplitterForm)
  assert.equal(resolveFormRendererComponent(Operator.Extractor), ExtractorForm)
  assert.equal(resolveFormRendererComponent(Operator.HierarchicalMerger), HierarchicalMergerForm)
  assert.equal(resolveFormRendererComponent(Operator.PDFGenerator), PDFGeneratorForm)
  assert.equal(resolveFormRendererComponent(Operator.ExeSQL), ExeSQLForm)
  assert.equal(migratedFormRenderers[Operator.Begin], BeginForm)
  assert.equal(migratedFormRenderers[Operator.Agent], AgentForm)
  assert.equal(migratedFormRenderers[Operator.Iteration], IterationForm)
  assert.equal(migratedFormRenderers[Operator.Invoke], InvokeForm)
  assert.equal(migratedFormRenderers[Operator.DataOperations], DataOperationsForm)
  assert.equal(migratedFormRenderers[Operator.ListOperations], ListOperationsForm)
  assert.equal(migratedFormRenderers[Operator.VariableAggregator], VariableAggregatorForm)
  assert.equal(migratedFormRenderers[Operator.VariableAssigner], VariableAssignerForm)
  assert.equal(migratedFormRenderers[Operator.UserFillUp], UserFillUpForm)
  assert.equal(migratedFormRenderers[Operator.StringTransform], StringTransformForm)
  assert.equal(migratedFormRenderers[Operator.Parser], ParserForm)
  assert.equal(migratedFormRenderers[Operator.Tokenizer], TokenizerForm)
  assert.equal(migratedFormRenderers[Operator.Splitter], SplitterForm)
  assert.equal(migratedFormRenderers[Operator.Extractor], ExtractorForm)
  assert.equal(migratedFormRenderers[Operator.HierarchicalMerger], HierarchicalMergerForm)
  assert.equal(migratedFormRenderers[Operator.PDFGenerator], PDFGeneratorForm)
  assert.equal(migratedFormRenderers[Operator.ExeSQL], ExeSQLForm)
})

test('legacy operators and the MCP renderer stay on compatibility bridges', () => {
  assert.equal(resolveFormRendererComponent(Operator.Bing), BingForm)
  assert.equal(resolveFormRendererComponent(Operator.Email), EmailForm)
  assert.equal(resolveFormRendererComponent(MCP_FORM_RENDERER_KEY), McpForm)
  assert.equal(legacyFormRenderers[Operator.Bing], BingForm)
  assert.equal(legacyFormRenderers[Operator.Email], EmailForm)
  assert.equal(legacyFormRenderers[MCP_FORM_RENDERER_KEY], McpForm)
  assert.equal(resolveFormRendererComponent(undefined), null)
})

test('form config map keeps migrated operators available through the compatibility export', () => {
  assert.equal(FormConfigMap[Operator.Begin], BeginForm)
  assert.equal(FormConfigMap[Operator.Generate], GenerateForm)
  assert.equal(FormConfigMap[Operator.Tool], ToolForm)
  assert.equal(FormConfigMap[Operator.Iteration], IterationForm)
  assert.equal(FormConfigMap[Operator.IterationStart], IterationStartForm)
  assert.equal(FormConfigMap[Operator.Loop], LoopForm)
  assert.equal(FormConfigMap[Operator.Invoke], InvokeForm)
  assert.equal(FormConfigMap[Operator.DataOperations], DataOperationsForm)
  assert.equal(FormConfigMap[Operator.ListOperations], ListOperationsForm)
  assert.equal(FormConfigMap[Operator.VariableAggregator], VariableAggregatorForm)
  assert.equal(FormConfigMap[Operator.VariableAssigner], VariableAssignerForm)
  assert.equal(FormConfigMap[Operator.UserFillUp], UserFillUpForm)
  assert.equal(FormConfigMap[Operator.StringTransform], StringTransformForm)
  assert.equal(FormConfigMap[Operator.Bing], BingForm)
  assert.equal(FormConfigMap[Operator.Parser], ParserForm)
  assert.equal(FormConfigMap[Operator.Tokenizer], TokenizerForm)
  assert.equal(FormConfigMap[Operator.Splitter], SplitterForm)
  assert.equal(FormConfigMap[Operator.Extractor], ExtractorForm)
  assert.equal(FormConfigMap[Operator.HierarchicalMerger], HierarchicalMergerForm)
  assert.equal(FormConfigMap[Operator.PDFGenerator], PDFGeneratorForm)
  assert.equal(FormConfigMap[Operator.ExeSQL], ExeSQLForm)
})
