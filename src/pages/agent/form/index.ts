import type { ComponentType } from 'react'
import { Operator } from '../constant'
import type { INextOperatorForm } from '../types'
import { AgentForm } from './agent-form'
import { ArxivForm } from './arxiv-form'
import { BeginForm } from './begin-form'
import { BingForm } from './bing-form'
import { CategorizeForm } from './categorize-form'
import { CodeForm } from './code-form'
import { CrawlerForm } from './crawler-form'
import { DataOperationsForm } from './data-operations-form'
import { DuckDuckGoForm } from './duckduckgo-form'
import { EmailForm } from './email-form'
import { ExtractorForm } from './extractor-form'
import { ExeSQLForm } from './exesql-form'
import { GenerateForm } from './generate-form'
import { GithubForm } from './github-form'
import { GoogleForm } from './google-form'
import { GoogleScholarForm } from './google-scholar-form'
import { HierarchicalMergerForm } from './hierarchical-merger-form'
import { InvokeForm } from './invoke-form'
import { IterationForm } from './iteration-form'
import { IterationStartForm } from './iteration-start-form'
import { KeywordExtractForm } from './keyword-extract-form'
import { ListOperationsForm } from './list-operations-form'
import { LoopForm } from './loop-form'
import { MessageForm } from './message-form'
import { ParserForm } from './parser-form'
import { PDFGeneratorForm } from './pdf-generator-form'
import { PubMedForm } from './pubmed-form'
import { RelevantForm } from './relevant-form'
import { RetrievalForm } from './retrieval-form'
import { RewriteQuestionForm } from './rewrite-question-form'
import { SearXNGForm } from './searxng-form'
import { SplitterForm } from './splitter-form'
import { StringTransformForm } from './string-transform-form'
import { SwitchForm } from './switch-form'
import { TavilyExtractForm } from './tavily-extract-form'
import { TavilyForm } from './tavily-form'
import { ToolForm } from './tool-form'
import { TokenizerForm } from './tokenizer-form'
import { UserFillUpForm } from './user-fill-up-form'
import { VariableAggregatorForm } from './variable-aggregator-form'
import { VariableAssignerForm } from './variable-assigner-form'
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
