import type { TFunction } from 'i18next'
import { Operator } from '../../constant'

const OPERATOR_LABEL_KEYS: Partial<Record<Operator, string>> = {
  [Operator.Begin]: 'flow.begin',
  [Operator.Retrieval]: 'flow.retrieval',
  [Operator.Message]: 'flow.message',
  [Operator.A2UI]: 'flow.a2uiCard',
  [Operator.Categorize]: 'flow.categorize',
  [Operator.Switch]: 'flow.switch',
  [Operator.Relevant]: 'flow.relevant',
  [Operator.RewriteQuestion]: 'flow.rewriteQuestion',
  [Operator.KeywordExtract]: 'flow.keywordExtract',
  [Operator.Agent]: 'flow.agent',
  [Operator.Tool]: 'flow.tool',
  [Operator.WaitingDialogue]: 'flow.userFillUp',
  [Operator.Iteration]: 'flow.iteration',
  [Operator.IterationStart]: 'flow.iterationItem',
  [Operator.Code]: 'flow.code',
  [Operator.ExeSQL]: 'flow.exeSQL',
  [Operator.UserFillUp]: 'flow.userFillUp',
  [Operator.VariableAssigner]: 'flow.variableAssigner',
  [Operator.VariableAggregator]: 'flow.variableAggregator',
  [Operator.Loop]: 'flow.loop',
  [Operator.LoopStart]: 'flow.loopItem',
  [Operator.ExitLoop]: 'flow.exitLoop',
  [Operator.File]: 'flow.file',
  [Operator.Parser]: 'flow.parser',
  [Operator.Tokenizer]: 'flow.tokenizer',
  [Operator.Splitter]: 'flow.splitter',
  [Operator.Extractor]: 'flow.extractor',
}

const DEFAULT_NAME_ALIASES: Partial<Record<Operator, string[]>> = {
  [Operator.Begin]: ['Begin', '开始'],
  [Operator.Retrieval]: ['Retrieval', '知识检索', '检索'],
  [Operator.Message]: ['Message', '回复', '回复消息'],
  [Operator.A2UI]: ['A2UI', 'A2UI 卡片'],
  [Operator.Categorize]: ['Categorize', '分类', '问题分类'],
  [Operator.Switch]: ['Switch', '条件分支'],
  [Operator.Relevant]: ['Relevant', '是否相关'],
  [Operator.RewriteQuestion]: [
    'RewriteQuestion',
    'Rewrite Question',
    '问题优化',
  ],
  [Operator.KeywordExtract]: ['KeywordExtract', 'Keyword Extract', '关键词'],
  [Operator.Agent]: ['Agent', '智能体'],
  [Operator.Tool]: ['Tool', '工具'],
  [Operator.ExeSQL]: ['ExeSQL', 'Execute SQL', '执行 SQL'],
  [Operator.UserFillUp]: ['UserFillUp', 'Waiting Dialogue', '等待输入'],
  [Operator.VariableAssigner]: [
    'VariableAssigner',
    'Variable assigner',
    '变量赋值器',
  ],
  [Operator.VariableAggregator]: [
    'VariableAggregator',
    'Variable aggregator',
    '变量聚合',
  ],
  [Operator.Iteration]: ['Iteration', '迭代'],
  [Operator.IterationStart]: ['IterationItem', 'Iteration Item', '迭代项'],
  [Operator.Loop]: ['Loop', '循环'],
  [Operator.LoopStart]: ['LoopItem', 'Loop Item', '循环项'],
  [Operator.ExitLoop]: ['ExitLoop', 'Exit loop', '退出循环'],
  [Operator.Code]: ['CodeExec', 'Code', '代码'],
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function getOperatorLabel(t: TFunction, label?: string) {
  if (!label) return t('flow.node', 'Node')

  const key = OPERATOR_LABEL_KEYS[label as Operator]
  return key ? t(key, label) : label
}

export function getNodeDisplayName(t: TFunction, label: string, name?: string) {
  const operatorLabel = getOperatorLabel(t, label)
  const rawName = typeof name === 'string' ? name.trim() : ''
  if (!rawName) return operatorLabel

  const aliases = Array.from(
    new Set([
      label,
      operatorLabel,
      ...(DEFAULT_NAME_ALIASES[label as Operator] ?? []),
    ]),
  ).filter(Boolean)

  if (aliases.includes(rawName)) return operatorLabel

  for (const alias of aliases) {
    const match = rawName.match(new RegExp(`^${escapeRegExp(alias)}_(\\d+)$`))
    if (match) {
      return `${operatorLabel}_${match[1]}`
    }
  }

  return rawName
}
