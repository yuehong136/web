import assert from 'node:assert/strict'
import test from 'node:test'
import { Operator } from '../../../constant'
import { AgentForm } from '../../../form/agent'
import { BeginForm } from '../../../form/begin'
import { CodeForm } from '../../../form/code-form'
import { DataOperationsForm } from '../../../form/data-operations'
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
import { ParserForm } from '../../../form/parser'
import { DocGeneratorForm } from '../../../form/doc-generator'
import { TitleChunkerForm } from '../../../form/title-chunker'
import { TokenChunkerForm } from '../../../form/token-chunker'
import { TokenizerForm } from '../../../form/tokenizer'
import { ArxivForm } from '../../../form/arxiv'
import { BingForm } from '../../../form/bing'
import { CrawlerForm } from '../../../form/crawler'
import { DuckDuckGoForm } from '../../../form/duckduckgo'
import { EmailForm } from '../../../form/email'
import { GithubForm } from '../../../form/github'
import { GoogleForm } from '../../../form/google'
import { GoogleScholarForm } from '../../../form/google-scholar'
import { McpForm } from '../../../form/mcp-form'
import { PubMedForm } from '../../../form/pubmed'
import { SearXNGForm } from '../../../form/searxng'
import { TavilyExtractForm } from '../../../form/tavily-extract'
import { TavilyForm } from '../../../form/tavily'
import { WenCaiForm } from '../../../form/wencai'
import { WikipediaForm } from '../../../form/wikipedia'
import { YahooFinanceForm } from '../../../form/yahoo-finance'
import {
  legacyFormRenderers,
  migratedFormRenderers,
  resolveFormRendererComponent,
} from '../components/form-renderer-registry'
import { MCP_FORM_RENDERER_KEY } from '../utils'

test('migrated operators resolve to directory modules in the form renderer', () => {
  assert.equal(resolveFormRendererComponent(Operator.Begin), BeginForm)
  assert.equal(resolveFormRendererComponent(Operator.Retrieval), RetrievalForm)
  assert.equal(resolveFormRendererComponent(Operator.Message), MessageForm)
  assert.equal(resolveFormRendererComponent(Operator.Agent), AgentForm)
  assert.equal(resolveFormRendererComponent(Operator.Tool), ToolForm)
  assert.equal(resolveFormRendererComponent(Operator.Switch), SwitchForm)
  assert.equal(resolveFormRendererComponent(Operator.Iteration), IterationForm)
  assert.equal(
    resolveFormRendererComponent(Operator.IterationStart),
    IterationStartForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.Loop), LoopForm)
  assert.equal(resolveFormRendererComponent(Operator.Invoke), InvokeForm)
  assert.equal(
    resolveFormRendererComponent(Operator.DataOperations),
    DataOperationsForm,
  )
  assert.equal(
    resolveFormRendererComponent(Operator.ListOperations),
    ListOperationsForm,
  )
  assert.equal(
    resolveFormRendererComponent(Operator.VariableAggregator),
    VariableAggregatorForm,
  )
  assert.equal(
    resolveFormRendererComponent(Operator.VariableAssigner),
    VariableAssignerForm,
  )
  assert.equal(
    resolveFormRendererComponent(Operator.UserFillUp),
    UserFillUpForm,
  )
  assert.equal(
    resolveFormRendererComponent(Operator.StringTransform),
    StringTransformForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.Parser), ParserForm)
  assert.equal(resolveFormRendererComponent(Operator.Tokenizer), TokenizerForm)
  assert.equal(
    resolveFormRendererComponent(Operator.TokenChunker),
    TokenChunkerForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.Extractor), ExtractorForm)
  assert.equal(
    resolveFormRendererComponent(Operator.TitleChunker),
    TitleChunkerForm,
  )
  assert.equal(
    resolveFormRendererComponent(Operator.DocGenerator),
    DocGeneratorForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.ExeSQL), ExeSQLForm)
  assert.equal(resolveFormRendererComponent(Operator.Crawler), CrawlerForm)
  assert.equal(
    resolveFormRendererComponent(Operator.DuckDuckGo),
    DuckDuckGoForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.Wikipedia), WikipediaForm)
  assert.equal(resolveFormRendererComponent(Operator.PubMed), PubMedForm)
  assert.equal(resolveFormRendererComponent(Operator.ArXiv), ArxivForm)
  assert.equal(resolveFormRendererComponent(Operator.Google), GoogleForm)
  assert.equal(resolveFormRendererComponent(Operator.Bing), BingForm)
  assert.equal(
    resolveFormRendererComponent(Operator.GoogleScholar),
    GoogleScholarForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.GitHub), GithubForm)
  assert.equal(resolveFormRendererComponent(Operator.SearXNG), SearXNGForm)
  assert.equal(resolveFormRendererComponent(Operator.TavilySearch), TavilyForm)
  assert.equal(
    resolveFormRendererComponent(Operator.TavilyExtract),
    TavilyExtractForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.WenCai), WenCaiForm)
  assert.equal(
    resolveFormRendererComponent(Operator.YahooFinance),
    YahooFinanceForm,
  )
  assert.equal(resolveFormRendererComponent(Operator.Email), EmailForm)
  assert.equal(migratedFormRenderers[Operator.Begin], BeginForm)
  assert.equal(migratedFormRenderers[Operator.Agent], AgentForm)
  assert.equal(migratedFormRenderers[Operator.Iteration], IterationForm)
  assert.equal(migratedFormRenderers[Operator.Invoke], InvokeForm)
  assert.equal(
    migratedFormRenderers[Operator.DataOperations],
    DataOperationsForm,
  )
  assert.equal(
    migratedFormRenderers[Operator.ListOperations],
    ListOperationsForm,
  )
  assert.equal(
    migratedFormRenderers[Operator.VariableAggregator],
    VariableAggregatorForm,
  )
  assert.equal(
    migratedFormRenderers[Operator.VariableAssigner],
    VariableAssignerForm,
  )
  assert.equal(migratedFormRenderers[Operator.UserFillUp], UserFillUpForm)
  assert.equal(
    migratedFormRenderers[Operator.StringTransform],
    StringTransformForm,
  )
  assert.equal(migratedFormRenderers[Operator.Parser], ParserForm)
  assert.equal(migratedFormRenderers[Operator.Tokenizer], TokenizerForm)
  assert.equal(migratedFormRenderers[Operator.TokenChunker], TokenChunkerForm)
  assert.equal(migratedFormRenderers[Operator.Extractor], ExtractorForm)
  assert.equal(migratedFormRenderers[Operator.TitleChunker], TitleChunkerForm)
  assert.equal(migratedFormRenderers[Operator.DocGenerator], DocGeneratorForm)
  assert.equal(migratedFormRenderers[Operator.ExeSQL], ExeSQLForm)
  assert.equal(migratedFormRenderers[Operator.Crawler], CrawlerForm)
  assert.equal(migratedFormRenderers[Operator.DuckDuckGo], DuckDuckGoForm)
  assert.equal(migratedFormRenderers[Operator.Wikipedia], WikipediaForm)
  assert.equal(migratedFormRenderers[Operator.PubMed], PubMedForm)
  assert.equal(migratedFormRenderers[Operator.ArXiv], ArxivForm)
  assert.equal(migratedFormRenderers[Operator.Google], GoogleForm)
  assert.equal(migratedFormRenderers[Operator.Bing], BingForm)
  assert.equal(migratedFormRenderers[Operator.GoogleScholar], GoogleScholarForm)
  assert.equal(migratedFormRenderers[Operator.GitHub], GithubForm)
  assert.equal(migratedFormRenderers[Operator.SearXNG], SearXNGForm)
  assert.equal(migratedFormRenderers[Operator.TavilySearch], TavilyForm)
  assert.equal(migratedFormRenderers[Operator.TavilyExtract], TavilyExtractForm)
  assert.equal(migratedFormRenderers[Operator.WenCai], WenCaiForm)
  assert.equal(migratedFormRenderers[Operator.YahooFinance], YahooFinanceForm)
  assert.equal(migratedFormRenderers[Operator.Email], EmailForm)
})

test('legacy operators and the MCP renderer stay on compatibility bridges', () => {
  assert.equal(resolveFormRendererComponent(Operator.Code), CodeForm)
  assert.equal(resolveFormRendererComponent(Operator.WaitingDialogue), CodeForm)
  assert.equal(resolveFormRendererComponent(Operator.Bing), BingForm)
  assert.equal(resolveFormRendererComponent(Operator.Email), EmailForm)
  assert.equal(resolveFormRendererComponent(MCP_FORM_RENDERER_KEY), McpForm)
  assert.equal(legacyFormRenderers[Operator.Bing], undefined)
  assert.equal(legacyFormRenderers[Operator.Email], undefined)
  assert.equal(legacyFormRenderers[MCP_FORM_RENDERER_KEY], McpForm)
  assert.equal(resolveFormRendererComponent(undefined), null)
})

test('every operator in the renderer registry resolves to a real form component', () => {
  const allRenderers: Record<string, unknown> = {
    ...migratedFormRenderers,
    ...legacyFormRenderers,
  }

  for (const [key, value] of Object.entries(allRenderers)) {
    assert.ok(
      typeof value === 'function' || (typeof value === 'object' && value),
      `Operator "${key}" must register a renderer`,
    )
    assert.equal(
      resolveFormRendererComponent(key),
      value,
      `Operator "${key}" must resolve through resolveFormRendererComponent`,
    )
  }
})
