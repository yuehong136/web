import { Operator } from './constant'
import {
  Bot,
  Code,
  Database,
  FileChartColumn,
  FileCode,
  FileText,
  Filter,
  GitBranch,
  Globe,
  GalleryVerticalEnd,
  HousePlus,
  Infinity as InfinityIcon,
  Layers,
  List,
  ListTree,
  LogOut,
  Mail,
  MessageSquare,
  NotebookPen,
  Repeat,
  Replace,
  Search,
  Settings2,
  StickyNote,
  Type,
  Variable,
  Wrench,
} from 'lucide-react'

export const OperatorIconFontMap: Record<string, string> = {
  [Operator.Retrieval]: 'KR',
  [Operator.Categorize]: 'a-QuestionClassification',
  [Operator.Message]: 'reply',
  [Operator.A2UI]: 'card',
  [Operator.Iteration]: 'loop',
  [Operator.Switch]: 'condition',
  [Operator.Code]: 'code-set',
  [Operator.Agent]: 'agent-ai',
  [Operator.UserFillUp]: 'await',
  [Operator.StringTransform]: 'a-textprocessing',
  [Operator.Note]: 'notebook-pen',
  [Operator.ExeSQL]: 'executesql-0',
  [Operator.Invoke]: 'httprequest-0',
  [Operator.Email]: 'sendemail-0',
  [Operator.ListOperations]: 'a-listoperations',
  [Operator.VariableAssigner]: 'a-ariableassigner',
  [Operator.VariableAggregator]: 'aggregator',
}

export const LucideIconMap: Record<string, typeof Bot> = {
  [Operator.Begin]: HousePlus,
  [Operator.Retrieval]: Database,
  [Operator.Message]: MessageSquare,
  [Operator.A2UI]: GalleryVerticalEnd,
  [Operator.Categorize]: GitBranch,
  [Operator.Switch]: GitBranch,
  [Operator.Relevant]: GitBranch,
  [Operator.RewriteQuestion]: Replace,
  [Operator.KeywordExtract]: Type,
  [Operator.Agent]: Bot,
  [Operator.Tool]: Wrench,
  [Operator.Note]: NotebookPen,
  [Operator.Placeholder]: StickyNote,
  [Operator.Iteration]: Repeat,
  [Operator.IterationStart]: Repeat,
  [Operator.Code]: Code,
  [Operator.DuckDuckGo]: Search,
  [Operator.Wikipedia]: Globe,
  [Operator.PubMed]: FileText,
  [Operator.ArXiv]: FileText,
  [Operator.Google]: Search,
  [Operator.Bing]: Search,
  [Operator.GoogleScholar]: Search,
  [Operator.GitHub]: Code,
  [Operator.SearXNG]: Search,
  [Operator.TavilySearch]: Search,
  [Operator.TavilyExtract]: FileText,
  [Operator.WenCai]: Search,
  [Operator.YahooFinance]: Settings2,
  [Operator.ExeSQL]: Database,
  [Operator.Crawler]: Globe,
  [Operator.Invoke]: Globe,
  [Operator.Email]: Mail,
  [Operator.UserFillUp]: MessageSquare,
  [Operator.StringTransform]: Type,
  [Operator.DocGenerator]: FileText,
  [Operator.Browser]: Globe,
  [Operator.HTMLReport]: FileChartColumn,
  [Operator.DataOperations]: FileCode,
  [Operator.ListOperations]: List,
  [Operator.VariableAssigner]: Variable,
  [Operator.VariableAggregator]: Layers,
  [Operator.Loop]: InfinityIcon,
  [Operator.LoopStart]: InfinityIcon,
  [Operator.ExitLoop]: LogOut,
  [Operator.File]: FileText,
  [Operator.Parser]: FileCode,
  [Operator.Tokenizer]: Type,
  [Operator.TokenChunker]: ListTree,
  [Operator.TitleChunker]: Layers,
  [Operator.Extractor]: Filter,
}

/**
 * Operator families, matching the groups of the add-node menu. Each family
 * keeps one tile colour wherever an operator is shown (nodes, menus, panels,
 * run timelines).
 */
export type OperatorCategory =
  | 'start'
  | 'ai'
  | 'knowledge'
  | 'dialog'
  | 'flow'
  | 'data'
  | 'tool'
  | 'ingestion'
  | 'note'

const CATEGORY_MEMBERS: Record<
  Exclude<OperatorCategory, 'tool'>,
  readonly string[]
> = {
  start: [Operator.Begin, Operator.IterationStart, Operator.LoopStart],
  ai: [
    Operator.Agent,
    Operator.RewriteQuestion,
    Operator.KeywordExtract,
    Operator.Extractor,
  ],
  knowledge: [Operator.Retrieval],
  dialog: [
    Operator.Message,
    Operator.A2UI,
    Operator.UserFillUp,
    Operator.WaitingDialogue,
  ],
  flow: [
    Operator.Categorize,
    Operator.Switch,
    Operator.Relevant,
    Operator.Iteration,
    Operator.Loop,
    Operator.ExitLoop,
  ],
  data: [
    Operator.Code,
    Operator.StringTransform,
    Operator.DataOperations,
    Operator.ListOperations,
    Operator.VariableAssigner,
    Operator.VariableAggregator,
  ],
  ingestion: [
    Operator.File,
    Operator.Parser,
    Operator.Tokenizer,
    Operator.TokenChunker,
    Operator.TitleChunker,
  ],
  note: [Operator.Note, Operator.Placeholder],
}

const OPERATOR_CATEGORY = new Map<string, OperatorCategory>(
  Object.entries(CATEGORY_MEMBERS).flatMap(([category, members]) =>
    members.map((member) => [member, category as OperatorCategory] as const),
  ),
)

/** Anything else is a tool (search engines, HTTP, mail, SQL, MCP…). */
export function getOperatorCategory(
  operator?: string | null,
): OperatorCategory {
  return (operator && OPERATOR_CATEGORY.get(operator)) || 'tool'
}

/**
 * Avatar tints per family (tomato, amber, olive, green, teal, blue, violet,
 * pink): Agent and knowledge nodes share the Agent and knowledge-base kind
 * colours. Static strings so Tailwind sees every class.
 */
export const OPERATOR_CATEGORY_TONE: Record<OperatorCategory, string> = {
  start: 'bg-components-avatar-4-bg text-components-avatar-4-text',
  ai: 'bg-components-avatar-7-bg text-components-avatar-7-text',
  knowledge: 'bg-components-avatar-5-bg text-components-avatar-5-text',
  dialog: 'bg-components-avatar-6-bg text-components-avatar-6-text',
  flow: 'bg-components-avatar-2-bg text-components-avatar-2-text',
  data: 'bg-components-avatar-3-bg text-components-avatar-3-text',
  tool: 'bg-components-avatar-1-bg text-components-avatar-1-text',
  ingestion: 'bg-components-avatar-8-bg text-components-avatar-8-text',
  note: 'bg-background-subtle text-text-secondary',
}
