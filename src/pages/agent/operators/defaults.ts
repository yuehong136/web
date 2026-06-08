import merge from 'lodash/merge'
import type { AgentOperator } from '@/types/agent'
import { normalizeMessageFormForStore } from '../utils/message-content'
import {
  normalizeOperatorFormForDsl,
  normalizeOperatorFormForStore,
} from './normalizers'
import {
  AgentGlobals,
  Operator,
  initialA2UIValues,
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
  initialGithubValues,
  initialGoogleScholarValues,
  initialGoogleValues,
  initialHierarchicalMergerValues,
  initialIterationStartValues,
  initialIterationValues,
  initialInvokeValues,
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
import { initialHTMLReportValues } from '../form/html-report/constants'

const operatorDefaultValues: Record<OperatorType, Record<string, unknown>> = {
  [Operator.Begin]: initialBeginValues,
  [Operator.Retrieval]: initialRetrievalValues,
  [Operator.Message]: initialMessageValues,
  [Operator.A2UI]: initialA2UIValues,
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
  [Operator.Invoke]: initialInvokeValues,
  [Operator.Email]: initialEmailValues,
  [Operator.UserFillUp]: initialUserFillUpValues,
  [Operator.StringTransform]: initialStringTransformValues,
  [Operator.PDFGenerator]: initialPDFGeneratorValues,
  [Operator.HTMLReport]: initialHTMLReportValues,
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
  const nextForm =
    operator === Operator.Message
      ? normalizeMessageFormForStore(form)
      : form || {}
  const mergedForm = merge({}, getOperatorDefaultForm(operator), nextForm)

  if (operator === Operator.Parser && 'setups' in nextForm) {
    mergedForm.setups = nextForm.setups
  }

  return normalizeOperatorFormForStore(operator, mergedForm)
}

export function buildDslOperatorParams(
  operator: OperatorType,
  form?: Record<string, unknown>,
): AgentOperator['obj']['params'] {
  return normalizeOperatorFormForDsl(
    operator,
    mergeOperatorFormWithDefaults(operator, form),
  )
}

export const operatorDefaultsMap = operatorDefaultValues

export function buildDefaultDslGlobals(): Record<string, unknown> {
  return {
    [AgentGlobals.SysQuery]: '',
    [AgentGlobals.SysUserId]: '',
    [AgentGlobals.SysConversationTurns]: 0,
    [AgentGlobals.SysFiles]: [],
    [AgentGlobals.SysHistory]: [],
    [AgentGlobals.SysDate]: '',
  }
}
