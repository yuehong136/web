import type { ComponentType } from 'react'
import { Operator } from '../constant'
import type { INextOperatorForm } from '../types'
import { AgentForm } from './agent'
import { ArxivForm } from './arxiv-form'
import { BeginForm } from './begin'
import { BingForm } from './bing-form'
import { CategorizeForm } from './categorize'
import { CodeForm } from './code-form'
import { CrawlerForm } from './crawler-form'
import { DataOperationsForm } from './data-operations'
import { DuckDuckGoForm } from './duckduckgo-form'
import { EmailForm } from './email-form'
import { ExtractorForm } from './extractor'
import { ExeSQLForm } from './exesql'
import { GenerateForm } from './generate'
import { GithubForm } from './github-form'
import { GoogleForm } from './google-form'
import { GoogleScholarForm } from './google-scholar-form'
import { HierarchicalMergerForm } from './hierarchical-merger'
import { InvokeForm } from './invoke'
import { IterationForm } from './iteration'
import { IterationStartForm } from './iteration-start'
import { KeywordExtractForm } from './keyword-extract-form'
import { ListOperationsForm } from './list-operations'
import { LoopForm } from './loop'
import { MessageForm } from './message'
import { ParserForm } from './parser'
import { PDFGeneratorForm } from './pdf-generator'
import { PubMedForm } from './pubmed-form'
import { RelevantForm } from './relevant-form'
import { RetrievalForm } from './retrieval'
import { RewriteQuestionForm } from './rewrite-question'
import { SearXNGForm } from './searxng-form'
import { SplitterForm } from './splitter'
import { StringTransformForm } from './string-transform'
import { SwitchForm } from './switch'
import { TavilyExtractForm } from './tavily-extract-form'
import { TavilyForm } from './tavily-form'
import { ToolForm } from './tool'
import { TokenizerForm } from './tokenizer'
import { UserFillUpForm } from './user-fill-up'
import { VariableAggregatorForm } from './variable-aggregator'
import { VariableAssignerForm } from './variable-assigner'
import { WenCaiForm } from './wencai-form'
import { WikipediaForm } from './wikipedia-form'
import { YahooFinanceForm } from './yahoo-finance-form'

const EmptyForm: ComponentType<INextOperatorForm> = () => null

export const FormConfigMap: Record<
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
  // Search tool nodes
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
  // Simple tool forms
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
}
