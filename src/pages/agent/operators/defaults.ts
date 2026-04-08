import merge from 'lodash/merge'
import type { AgentOperator } from '@/types/agent'
import {
  Operator,
  initialAgentValues,
  initialArXivValues,
  initialBeginValues,
  initialBingValues,
  initialCategorizeValues,
  initialCodeValues,
  initialCrawlerValues,
  initialDataOperationsValues,
  initialDuckValues,
  initialEmailValues,
  initialExcelProcessorValues,
  initialExtractorValues,
  initialExeSqlValues,
  initialFileValues,
  initialGenerateValues,
  initialGithubValues,
  initialGoogleScholarValues,
  initialGoogleValues,
  initialHierarchicalMergerValues,
  initialIterationStartValues,
  initialIterationValues,
  initialKeywordExtractValues,
  initialListOperationsValues,
  initialLoopValues,
  initialMessageValues,
  initialNoteValues,
  initialParserValues,
  initialPDFGeneratorValues,
  initialPlaceholderValues,
  initialPubMedValues,
  initialRelevantValues,
  initialRetrievalValues,
  initialRewriteQuestionValues,
  initialSearXNGValues,
  initialSplitterValues,
  initialStringTransformValues,
  initialSwitchValues,
  initialTavilyExtractValues,
  initialTavilyValues,
  initialTokenizerValues,
  initialUserFillUpValues,
  initialVariableAggregatorValues,
  initialVariableAssignerValues,
  initialWaitingDialogueValues,
  initialWenCaiValues,
  initialWikipediaValues,
  initialYahooFinanceValues,
  type Operator as OperatorType,
} from '../constant'

const operatorDefaultValues: Record<OperatorType, Record<string, unknown>> = {
  [Operator.Begin]: initialBeginValues,
  [Operator.Retrieval]: initialRetrievalValues,
  [Operator.Generate]: initialGenerateValues,
  [Operator.Message]: initialMessageValues,
  [Operator.Categorize]: initialCategorizeValues,
  [Operator.Switch]: initialSwitchValues,
  [Operator.Relevant]: initialRelevantValues,
  [Operator.RewriteQuestion]: initialRewriteQuestionValues,
  [Operator.KeywordExtract]: initialKeywordExtractValues,
  [Operator.Agent]: initialAgentValues,
  [Operator.Tool]: {},
  [Operator.WaitingDialogue]: initialWaitingDialogueValues,
  [Operator.Note]: initialNoteValues,
  [Operator.Placeholder]: initialPlaceholderValues,
  [Operator.Iteration]: initialIterationValues,
  [Operator.IterationStart]: initialIterationStartValues,
  [Operator.Code]: initialCodeValues,
  [Operator.DuckDuckGo]: initialDuckValues,
  [Operator.Wikipedia]: initialWikipediaValues,
  [Operator.PubMed]: initialPubMedValues,
  [Operator.ArXiv]: initialArXivValues,
  [Operator.Google]: initialGoogleValues,
  [Operator.Bing]: initialBingValues,
  [Operator.GoogleScholar]: initialGoogleScholarValues,
  [Operator.GitHub]: initialGithubValues,
  [Operator.SearXNG]: initialSearXNGValues,
  [Operator.TavilySearch]: initialTavilyValues,
  [Operator.TavilyExtract]: initialTavilyExtractValues,
  [Operator.WenCai]: initialWenCaiValues,
  [Operator.YahooFinance]: initialYahooFinanceValues,
  [Operator.ExeSQL]: initialExeSqlValues,
  [Operator.Crawler]: initialCrawlerValues,
  [Operator.Invoke]: {
    url: '',
    method: 'GET',
    timeout: 60,
    headers: `{
  "Accept": "*/*",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
}`,
    proxy: '',
    clean_html: false,
    variables: [],
    outputs: {
      result: {
        value: '',
        type: 'string',
      },
    },
  },
  [Operator.Email]: initialEmailValues,
  [Operator.UserFillUp]: initialUserFillUpValues,
  [Operator.StringTransform]: initialStringTransformValues,
  [Operator.PDFGenerator]: initialPDFGeneratorValues,
  [Operator.ExcelProcessor]: initialExcelProcessorValues,
  [Operator.DataOperations]: initialDataOperationsValues,
  [Operator.ListOperations]: initialListOperationsValues,
  [Operator.VariableAssigner]: initialVariableAssignerValues,
  [Operator.VariableAggregator]: initialVariableAggregatorValues,
  [Operator.Loop]: initialLoopValues,
  [Operator.LoopStart]: initialLoopValues,
  [Operator.ExitLoop]: {},
  [Operator.File]: initialFileValues,
  [Operator.Parser]: initialParserValues,
  [Operator.Tokenizer]: initialTokenizerValues,
  [Operator.Splitter]: initialSplitterValues,
  [Operator.HierarchicalMerger]: initialHierarchicalMergerValues,
  [Operator.Extractor]: initialExtractorValues,
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

export function getOperatorDefaultForm(
  operator: OperatorType,
): Record<string, unknown> {
  return cloneValue(operatorDefaultValues[operator] || {})
}

export function mergeOperatorFormWithDefaults(
  operator: OperatorType,
  form?: Record<string, unknown>,
): Record<string, unknown> {
  return merge({}, getOperatorDefaultForm(operator), form || {})
}

export function buildDslOperatorParams(
  operator: OperatorType,
  form?: Record<string, unknown>,
): AgentOperator['obj']['params'] {
  return mergeOperatorFormWithDefaults(operator, form)
}

export const operatorDefaultsMap = operatorDefaultValues
