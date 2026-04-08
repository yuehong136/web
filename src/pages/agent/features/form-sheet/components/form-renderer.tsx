import type { ComponentType } from 'react'
import { Operator } from '../../../constant'
import { AgentForm } from '../../../form/agent-form'
import { ArxivForm } from '../../../form/arxiv-form'
import { BeginForm } from '../../../form/begin-form'
import { BingForm } from '../../../form/bing-form'
import { CategorizeForm } from '../../../form/categorize-form'
import { CodeForm } from '../../../form/code-form'
import { CrawlerForm } from '../../../form/crawler-form'
import { DataOperationsForm } from '../../../form/data-operations-form'
import { DuckDuckGoForm } from '../../../form/duckduckgo-form'
import { EmailForm } from '../../../form/email-form'
import { ExtractorForm } from '../../../form/extractor-form'
import { ExeSQLForm } from '../../../form/exesql-form'
import { GenerateForm } from '../../../form/generate-form'
import { GithubForm } from '../../../form/github-form'
import { GoogleForm } from '../../../form/google-form'
import { GoogleScholarForm } from '../../../form/google-scholar-form'
import { HierarchicalMergerForm } from '../../../form/hierarchical-merger-form'
import { InvokeForm } from '../../../form/invoke-form'
import { IterationForm } from '../../../form/iteration-form'
import { IterationStartForm } from '../../../form/iteration-start-form'
import { KeywordExtractForm } from '../../../form/keyword-extract-form'
import { ListOperationsForm } from '../../../form/list-operations-form'
import { LoopForm } from '../../../form/loop-form'
import { McpForm } from '../../../form/mcp-form'
import { MessageForm } from '../../../form/message-form'
import { ParserForm } from '../../../form/parser-form'
import { PDFGeneratorForm } from '../../../form/pdf-generator-form'
import { PubMedForm } from '../../../form/pubmed-form'
import { RelevantForm } from '../../../form/relevant-form'
import { RetrievalForm } from '../../../form/retrieval-form'
import { RewriteQuestionForm } from '../../../form/rewrite-question-form'
import { SearXNGForm } from '../../../form/searxng-form'
import { SplitterForm } from '../../../form/splitter-form'
import { StringTransformForm } from '../../../form/string-transform-form'
import { SwitchForm } from '../../../form/switch-form'
import { TavilyExtractForm } from '../../../form/tavily-extract-form'
import { TavilyForm } from '../../../form/tavily-form'
import { ToolForm } from '../../../form/tool-form'
import { TokenizerForm } from '../../../form/tokenizer-form'
import { UserFillUpForm } from '../../../form/user-fill-up-form'
import { VariableAggregatorForm } from '../../../form/variable-aggregator-form'
import { VariableAssignerForm } from '../../../form/variable-assigner-form'
import { WenCaiForm } from '../../../form/wencai-form'
import { WikipediaForm } from '../../../form/wikipedia-form'
import { YahooFinanceForm } from '../../../form/yahoo-finance-form'
import type { INextOperatorForm, RAGFlowNodeType } from '../../../types'
import { MCP_FORM_RENDERER_KEY } from '../utils'

interface FormRendererProps {
  node?: RAGFlowNodeType
  rendererKey?: string
  operatorType?: string
}

const EmptyForm: ComponentType<INextOperatorForm> = () => null

const legacyFormRenderers: Record<string, ComponentType<INextOperatorForm>> = {
  [Operator.Begin]: BeginForm,
  [Operator.Generate]: GenerateForm,
  [Operator.Retrieval]: RetrievalForm,
  [Operator.Message]: MessageForm,
  [Operator.Categorize]: CategorizeForm,
  [Operator.Switch]: SwitchForm,
  [Operator.Agent]: AgentForm,
  [Operator.Tool]: ToolForm,
  [Operator.Code]: CodeForm,
  [Operator.RewriteQuestion]: RewriteQuestionForm,
  [Operator.KeywordExtract]: KeywordExtractForm,
  [Operator.Relevant]: RelevantForm,
  [Operator.Iteration]: IterationForm,
  [Operator.IterationStart]: IterationStartForm,
  [Operator.Loop]: LoopForm,
  [Operator.ExitLoop]: EmptyForm,
  [Operator.DataOperations]: DataOperationsForm,
  [Operator.ListOperations]: ListOperationsForm,
  [Operator.VariableAggregator]: VariableAggregatorForm,
  [Operator.VariableAssigner]: VariableAssignerForm,
  [Operator.Crawler]: CrawlerForm,
  [Operator.ExeSQL]: ExeSQLForm,
  [Operator.Invoke]: InvokeForm,
  [Operator.DuckDuckGo]: DuckDuckGoForm,
  [Operator.Wikipedia]: WikipediaForm,
  [Operator.PubMed]: PubMedForm,
  [Operator.ArXiv]: ArxivForm,
  [Operator.Google]: GoogleForm,
  [Operator.Bing]: BingForm,
  [Operator.GoogleScholar]: GoogleScholarForm,
  [Operator.GitHub]: GithubForm,
  [Operator.SearXNG]: SearXNGForm,
  [Operator.TavilySearch]: TavilyForm,
  [Operator.TavilyExtract]: TavilyExtractForm,
  [Operator.WenCai]: WenCaiForm,
  [Operator.YahooFinance]: YahooFinanceForm,
  [Operator.Email]: EmailForm,
  [Operator.UserFillUp]: UserFillUpForm,
  [Operator.StringTransform]: StringTransformForm,
  [Operator.PDFGenerator]: PDFGeneratorForm,
  [Operator.ExcelProcessor]: ToolForm,
  [Operator.WaitingDialogue]: CodeForm,
  [Operator.Parser]: ParserForm,
  [Operator.Tokenizer]: TokenizerForm,
  [Operator.Splitter]: SplitterForm,
  [Operator.HierarchicalMerger]: HierarchicalMergerForm,
  [Operator.Extractor]: ExtractorForm,
  [Operator.File]: EmptyForm,
  [Operator.Note]: EmptyForm,
  [Operator.Placeholder]: EmptyForm,
  [MCP_FORM_RENDERER_KEY]: McpForm,
}

export function FormRenderer({
  node,
  rendererKey,
  operatorType,
}: FormRendererProps) {
  if (!node) {
    return null
  }

  const FormComponent = rendererKey ? legacyFormRenderers[rendererKey] : null

  if (!FormComponent) {
    return (
      <div className="space-y-space-md p-space-base">
        <div className="rounded-radius-md border border-border-primary bg-surface-secondary p-space-base">
          <div className="text-sm font-medium text-text-primary">
            该节点尚未接入 T2 表单装配映射
          </div>
          <p className="mt-space-xs text-sm text-text-secondary">
            当前节点类型为 {operatorType || 'unknown'}，后续可在 T3 中继续迁移内容层。
          </p>
        </div>
        <pre className="max-h-[24rem] overflow-auto rounded-radius-md border border-border-primary bg-surface-secondary p-space-base text-xs text-text-secondary">
          {JSON.stringify(node.data?.form || {}, null, 2)}
        </pre>
      </div>
    )
  }

  return <FormComponent node={node} nodeId={node.id} />
}
