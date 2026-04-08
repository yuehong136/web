import type { Operator } from '../constant'
import { NodeMap, Operator as LegacyOperator } from '../constant'
import { resolveOperatorDescription } from './descriptions'
import {
  AgentOperatorCategory,
  AgentOperatorMode,
  type AgentOperatorDefinition,
  type OperatorRegistry,
} from './types'

function defineOperator(
  type: Operator,
  overrides: Omit<AgentOperatorDefinition, 'type' | 'nodeType' | 'description' | 'iconKey'> &
    Partial<Pick<AgentOperatorDefinition, 'nodeType' | 'description' | 'iconKey'>>,
): AgentOperatorDefinition {
  return {
    type,
    nodeType: overrides.nodeType || NodeMap[type] || 'ragNode',
    description: overrides.description || resolveOperatorDescription(type, overrides.defaultName),
    iconKey: overrides.iconKey || type,
    ...overrides,
  }
}

export const agentOperatorRegistry: OperatorRegistry = {
  [LegacyOperator.Begin]: defineOperator(LegacyOperator.Begin, { category: AgentOperatorCategory.CORE, mode: AgentOperatorMode.AGENT, defaultName: 'Begin', consumesBeginInputs: true, supportsGlobalVariables: true, isRootNode: true }),
  [LegacyOperator.Retrieval]: defineOperator(LegacyOperator.Retrieval, { category: AgentOperatorCategory.CORE, mode: AgentOperatorMode.AGENT, defaultName: 'Retrieval', consumesBeginInputs: true, supportsGlobalVariables: true }),
  [LegacyOperator.Generate]: defineOperator(LegacyOperator.Generate, { category: AgentOperatorCategory.CORE, mode: AgentOperatorMode.AGENT, defaultName: 'Generate', consumesBeginInputs: true, supportsGlobalVariables: true }),
  [LegacyOperator.Message]: defineOperator(LegacyOperator.Message, { category: AgentOperatorCategory.CORE, mode: AgentOperatorMode.SHARED, defaultName: 'Message', consumesBeginInputs: true }),
  [LegacyOperator.Categorize]: defineOperator(LegacyOperator.Categorize, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.AGENT, defaultName: 'Categorize', consumesBeginInputs: true }),
  [LegacyOperator.Switch]: defineOperator(LegacyOperator.Switch, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.SHARED, defaultName: 'Switch' }),
  [LegacyOperator.Relevant]: defineOperator(LegacyOperator.Relevant, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.AGENT, defaultName: 'Relevant' }),
  [LegacyOperator.RewriteQuestion]: defineOperator(LegacyOperator.RewriteQuestion, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.AGENT, defaultName: 'Rewrite Question', consumesBeginInputs: true }),
  [LegacyOperator.KeywordExtract]: defineOperator(LegacyOperator.KeywordExtract, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.AGENT, defaultName: 'Keyword Extract', consumesBeginInputs: true }),
  [LegacyOperator.Agent]: defineOperator(LegacyOperator.Agent, { category: AgentOperatorCategory.AGENT, mode: AgentOperatorMode.AGENT, defaultName: 'Agent', allowSingleStepDebug: true, consumesBeginInputs: true, supportsStructuredOutput: true, supportsGlobalVariables: true }),
  [LegacyOperator.Tool]: defineOperator(LegacyOperator.Tool, { category: AgentOperatorCategory.AGENT, mode: AgentOperatorMode.AGENT, defaultName: 'Tool', excludeFromDsl: true }),
  [LegacyOperator.WaitingDialogue]: defineOperator(LegacyOperator.WaitingDialogue, { category: AgentOperatorCategory.AGENT, mode: AgentOperatorMode.AGENT, defaultName: 'Waiting Dialogue', consumesBeginInputs: true }),
  [LegacyOperator.Note]: defineOperator(LegacyOperator.Note, { category: AgentOperatorCategory.UTILITY, mode: AgentOperatorMode.SHARED, defaultName: 'Note', excludeFromDsl: true }),
  [LegacyOperator.Placeholder]: defineOperator(LegacyOperator.Placeholder, { category: AgentOperatorCategory.UTILITY, mode: AgentOperatorMode.SHARED, defaultName: 'Placeholder', excludeFromDsl: true }),
  [LegacyOperator.Iteration]: defineOperator(LegacyOperator.Iteration, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.SHARED, defaultName: 'Iteration' }),
  [LegacyOperator.IterationStart]: defineOperator(LegacyOperator.IterationStart, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.SHARED, defaultName: 'Iteration Item' }),
  [LegacyOperator.Code]: defineOperator(LegacyOperator.Code, { category: AgentOperatorCategory.AGENT, mode: AgentOperatorMode.AGENT, defaultName: 'Code Exec', allowSingleStepDebug: true }),
  [LegacyOperator.DuckDuckGo]: defineOperator(LegacyOperator.DuckDuckGo, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'DuckDuckGo', consumesBeginInputs: true }),
  [LegacyOperator.Wikipedia]: defineOperator(LegacyOperator.Wikipedia, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Wikipedia', consumesBeginInputs: true }),
  [LegacyOperator.PubMed]: defineOperator(LegacyOperator.PubMed, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'PubMed', consumesBeginInputs: true }),
  [LegacyOperator.ArXiv]: defineOperator(LegacyOperator.ArXiv, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'ArXiv', consumesBeginInputs: true }),
  [LegacyOperator.Google]: defineOperator(LegacyOperator.Google, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Google', consumesBeginInputs: true }),
  [LegacyOperator.Bing]: defineOperator(LegacyOperator.Bing, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Bing', consumesBeginInputs: true }),
  [LegacyOperator.GoogleScholar]: defineOperator(LegacyOperator.GoogleScholar, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Google Scholar', consumesBeginInputs: true }),
  [LegacyOperator.GitHub]: defineOperator(LegacyOperator.GitHub, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'GitHub', consumesBeginInputs: true }),
  [LegacyOperator.SearXNG]: defineOperator(LegacyOperator.SearXNG, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'SearXNG', consumesBeginInputs: true }),
  [LegacyOperator.TavilySearch]: defineOperator(LegacyOperator.TavilySearch, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Tavily Search', consumesBeginInputs: true }),
  [LegacyOperator.TavilyExtract]: defineOperator(LegacyOperator.TavilyExtract, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Tavily Extract' }),
  [LegacyOperator.WenCai]: defineOperator(LegacyOperator.WenCai, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'WenCai', consumesBeginInputs: true }),
  [LegacyOperator.YahooFinance]: defineOperator(LegacyOperator.YahooFinance, { category: AgentOperatorCategory.TOOL, mode: AgentOperatorMode.AGENT, defaultName: 'Yahoo Finance' }),
  [LegacyOperator.ExeSQL]: defineOperator(LegacyOperator.ExeSQL, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'Execute SQL' }),
  [LegacyOperator.Crawler]: defineOperator(LegacyOperator.Crawler, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'Crawler' }),
  [LegacyOperator.Invoke]: defineOperator(LegacyOperator.Invoke, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'HTTP Request' }),
  [LegacyOperator.Email]: defineOperator(LegacyOperator.Email, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'Email' }),
  [LegacyOperator.UserFillUp]: defineOperator(LegacyOperator.UserFillUp, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.AGENT, defaultName: 'User Fill Up', consumesBeginInputs: true }),
  [LegacyOperator.StringTransform]: defineOperator(LegacyOperator.StringTransform, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'String Transform' }),
  [LegacyOperator.PDFGenerator]: defineOperator(LegacyOperator.PDFGenerator, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'PDF Generator' }),
  [LegacyOperator.ExcelProcessor]: defineOperator(LegacyOperator.ExcelProcessor, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.PIPELINE, defaultName: 'Excel Processor' }),
  [LegacyOperator.DataOperations]: defineOperator(LegacyOperator.DataOperations, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'Data Operations' }),
  [LegacyOperator.ListOperations]: defineOperator(LegacyOperator.ListOperations, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'List Operations' }),
  [LegacyOperator.VariableAssigner]: defineOperator(LegacyOperator.VariableAssigner, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'Variable Assigner', supportsGlobalVariables: true }),
  [LegacyOperator.VariableAggregator]: defineOperator(LegacyOperator.VariableAggregator, { category: AgentOperatorCategory.DATA, mode: AgentOperatorMode.SHARED, defaultName: 'Variable Aggregator', supportsGlobalVariables: true }),
  [LegacyOperator.Loop]: defineOperator(LegacyOperator.Loop, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.SHARED, defaultName: 'Loop' }),
  [LegacyOperator.LoopStart]: defineOperator(LegacyOperator.LoopStart, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.SHARED, defaultName: 'Loop Item' }),
  [LegacyOperator.ExitLoop]: defineOperator(LegacyOperator.ExitLoop, { category: AgentOperatorCategory.CONTROL, mode: AgentOperatorMode.SHARED, defaultName: 'Exit Loop' }),
  [LegacyOperator.File]: defineOperator(LegacyOperator.File, { category: AgentOperatorCategory.PIPELINE, mode: AgentOperatorMode.PIPELINE, defaultName: 'File', isRootNode: true }),
  [LegacyOperator.Parser]: defineOperator(LegacyOperator.Parser, { category: AgentOperatorCategory.PIPELINE, mode: AgentOperatorMode.PIPELINE, defaultName: 'Parser' }),
  [LegacyOperator.Tokenizer]: defineOperator(LegacyOperator.Tokenizer, { category: AgentOperatorCategory.PIPELINE, mode: AgentOperatorMode.PIPELINE, defaultName: 'Tokenizer' }),
  [LegacyOperator.Splitter]: defineOperator(LegacyOperator.Splitter, { category: AgentOperatorCategory.PIPELINE, mode: AgentOperatorMode.PIPELINE, defaultName: 'Splitter' }),
  [LegacyOperator.HierarchicalMerger]: defineOperator(LegacyOperator.HierarchicalMerger, { category: AgentOperatorCategory.PIPELINE, mode: AgentOperatorMode.PIPELINE, defaultName: 'Hierarchical Merger' }),
  [LegacyOperator.Extractor]: defineOperator(LegacyOperator.Extractor, { category: AgentOperatorCategory.PIPELINE, mode: AgentOperatorMode.PIPELINE, defaultName: 'Extractor', allowSingleStepDebug: true }),
}

export function getOperatorDefinition(type?: string | null) {
  if (!type) {
    return undefined
  }

  return agentOperatorRegistry[type as Operator]
}

export function isDslOperator(type?: string | null): boolean {
  return !getOperatorDefinition(type)?.excludeFromDsl
}
