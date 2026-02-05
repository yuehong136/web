import { IconFontFill } from '@/components/ui/icon-font'
import { cn } from '@/lib/utils'
import {
  Bot,
  Code,
  Database,
  FileCode,
  FileText,
  Filter,
  GitBranch,
  Globe,
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
  Sparkles,
  StickyNote,
  Type,
  Variable,
  Wrench,
} from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Operator } from './constant'

interface IProps {
  name: Operator | string
  className?: string
}

// IconFont 图标映射（如果项目有对应的 iconfont）
export const OperatorIconFontMap: Record<string, string> = {
  [Operator.Retrieval]: 'KR',
  [Operator.Categorize]: 'a-QuestionClassification',
  [Operator.Message]: 'reply',
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

// Lucide 图标映射（备用方案）
export const LucideIconMap: Record<string, typeof Bot> = {
  [Operator.Begin]: HousePlus,
  [Operator.Retrieval]: Database,
  [Operator.Generate]: Sparkles,
  [Operator.Message]: MessageSquare,
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
  [Operator.PDFGenerator]: FileText,
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
  [Operator.Splitter]: ListTree,
  [Operator.HierarchicalMerger]: Layers,
  [Operator.Extractor]: Filter,
}

const Empty = () => {
  return <div className="hidden"></div>
}

class IconErrorBoundary extends Component<{
  children: ReactNode
  fallback?: ReactNode
}> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <Empty />
    }

    return this.props.children
  }
}

const OperatorIcon = ({ name, className }: IProps) => {
  const iconFontName = OperatorIconFontMap[name as keyof typeof OperatorIconFontMap]
  const LucideIcon = LucideIconMap[name as keyof typeof LucideIconMap]

  // Begin 节点特殊样式
  if (name === Operator.Begin) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center p-1 bg-surface-accent rounded-radius-sm',
          className,
        )}
      >
        <HousePlus className="size-3 text-text-on-accent" />
      </div>
    )
  }

  // 优先使用 IconFont（如果存在）
  if (iconFontName) {
    return (
      <IconErrorBoundary fallback={LucideIcon ? <LucideIcon className={cn('size-5', className)} /> : <Empty />}>
        <IconFontFill name={iconFontName} className={cn('size-5', className)} />
      </IconErrorBoundary>
    )
  }

  // 使用 Lucide 图标
  if (LucideIcon) {
    return (
      <IconErrorBoundary fallback={<Empty />}>
        <LucideIcon className={cn('size-5', className)} />
      </IconErrorBoundary>
    )
  }

  return <Empty />
}

export default OperatorIcon
