import type { ComponentType } from 'react'
import { Operator } from '../../../constant'
import { AgentForm } from '../../../form/agent'
import { ArxivForm } from '../../../form/arxiv-form'
import { BeginForm } from '../../../form/begin'
import { BingForm } from '../../../form/bing-form'
import { CategorizeForm } from '../../../form/categorize'
import { CodeForm } from '../../../form/code-form'
import { CrawlerForm } from '../../../form/crawler-form'
import { DataOperationsForm } from '../../../form/data-operations'
import { DuckDuckGoForm } from '../../../form/duckduckgo-form'
import { EmailForm } from '../../../form/email-form'
import { ExtractorForm } from '../../../form/extractor-form'
import { ExeSQLForm } from '../../../form/exesql-form'
import { GenerateForm } from '../../../form/generate'
import { GithubForm } from '../../../form/github-form'
import { GoogleForm } from '../../../form/google-form'
import { GoogleScholarForm } from '../../../form/google-scholar-form'
import { HierarchicalMergerForm } from '../../../form/hierarchical-merger-form'
import { InvokeForm } from '../../../form/invoke'
import { IterationForm } from '../../../form/iteration'
import { IterationStartForm } from '../../../form/iteration-start'
import { KeywordExtractForm } from '../../../form/keyword-extract-form'
import { ListOperationsForm } from '../../../form/list-operations'
import { LoopForm } from '../../../form/loop'
import { McpForm } from '../../../form/mcp-form'
import { MessageForm } from '../../../form/message'
import { ParserForm } from '../../../form/parser-form'
import { PDFGeneratorForm } from '../../../form/pdf-generator-form'
import { PubMedForm } from '../../../form/pubmed-form'
import { RelevantForm } from '../../../form/relevant-form'
import { RetrievalForm } from '../../../form/retrieval'
import { RewriteQuestionForm } from '../../../form/rewrite-question'
import { SearXNGForm } from '../../../form/searxng-form'
import { SplitterForm } from '../../../form/splitter-form'
import { StringTransformForm } from '../../../form/string-transform'
import { SwitchForm } from '../../../form/switch'
import { TavilyExtractForm } from '../../../form/tavily-extract-form'
import { TavilyForm } from '../../../form/tavily-form'
import { ToolForm } from '../../../form/tool'
import { TokenizerForm } from '../../../form/tokenizer-form'
import { UserFillUpForm } from '../../../form/user-fill-up'
import { VariableAggregatorForm } from '../../../form/variable-aggregator'
import { VariableAssignerForm } from '../../../form/variable-assigner'
import { WenCaiForm } from '../../../form/wencai-form'
import { WikipediaForm } from '../../../form/wikipedia-form'
import { YahooFinanceForm } from '../../../form/yahoo-finance-form'
import type { INextOperatorForm } from '../../../types'
import { MCP_FORM_RENDERER_KEY } from '../utils'

const EmptyForm: ComponentType<INextOperatorForm> = () => null

export const migratedFormRenderers: Record<
  string,
  ComponentType<INextOperatorForm>
> = {
  [Operator.Begin]: BeginForm,
  [Operator.Generate]: GenerateForm,
  [Operator.Retrieval]: RetrievalForm,
  [Operator.Message]: MessageForm,
  [Operator.Categorize]: CategorizeForm,
  [Operator.Switch]: SwitchForm,
  [Operator.Agent]: AgentForm,
  [Operator.Tool]: ToolForm,
  [Operator.RewriteQuestion]: RewriteQuestionForm,
  [Operator.Iteration]: IterationForm,
  [Operator.IterationStart]: IterationStartForm,
  [Operator.Loop]: LoopForm,
  [Operator.Invoke]: InvokeForm,
  [Operator.DataOperations]: DataOperationsForm,
  [Operator.ListOperations]: ListOperationsForm,
  [Operator.VariableAggregator]: VariableAggregatorForm,
  [Operator.VariableAssigner]: VariableAssignerForm,
  [Operator.UserFillUp]: UserFillUpForm,
  [Operator.StringTransform]: StringTransformForm,
}

export const legacyFormRenderers: Record<
  string,
  ComponentType<INextOperatorForm>
> = {
  [Operator.Code]: CodeForm,
  [Operator.KeywordExtract]: KeywordExtractForm,
  [Operator.Relevant]: RelevantForm,
  [Operator.ExitLoop]: EmptyForm,
  [Operator.Crawler]: CrawlerForm,
  [Operator.ExeSQL]: ExeSQLForm,
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

export function resolveFormRendererComponent(rendererKey?: string) {
  if (!rendererKey) {
    return null
  }

  return (
    migratedFormRenderers[rendererKey] ||
    legacyFormRenderers[rendererKey] ||
    null
  )
}
