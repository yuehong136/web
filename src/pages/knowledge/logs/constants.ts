import type { LogFilterValue } from './types'

export enum RunningStatus {
  UNSTART = '0',
  RUNNING = '1',
  CANCEL = '2',
  DONE = '3',
  FAIL = '4',
  SCHEDULE = '5',
}

export const RunningStatusI18nKey: Record<RunningStatus, string> = {
  [RunningStatus.UNSTART]: 'knowledge.logs.status.unstart',
  [RunningStatus.RUNNING]: 'knowledge.logs.status.running',
  [RunningStatus.CANCEL]: 'knowledge.logs.status.cancel',
  [RunningStatus.DONE]: 'knowledge.logs.status.done',
  [RunningStatus.FAIL]: 'knowledge.logs.status.fail',
  [RunningStatus.SCHEDULE]: 'knowledge.logs.status.schedule',
}

export enum LogTabType {
  FILE_LOGS = 'fileLogs',
  DATASET_LOGS = 'datasetLogs',
}

export const LogTabOptions = [
  { key: LogTabType.FILE_LOGS, labelKey: 'knowledge.logs.tabs.fileLogs' },
  { key: LogTabType.DATASET_LOGS, labelKey: 'knowledge.logs.tabs.datasetLogs' },
]

export enum ProcessingType {
  KNOWLEDGE_GRAPH = 'GraphRAG',
  LEGACY_KNOWLEDGE_GRAPH = 'Graph',
  RAPTOR = 'RAPTOR',
}

export const ProcessingTypeI18nKey: Record<ProcessingType, string> = {
  [ProcessingType.LEGACY_KNOWLEDGE_GRAPH]:
    'knowledge.logs.processingType.knowledgeGraph',
  [ProcessingType.KNOWLEDGE_GRAPH]:
    'knowledge.logs.processingType.knowledgeGraph',
  [ProcessingType.RAPTOR]: 'knowledge.logs.processingType.raptor',
}

export const StatusClassConfig = {
  [RunningStatus.DONE]: {
    root: 'bg-success-soft text-success-fg',
    dot: 'bg-success-fg',
  },
  [RunningStatus.FAIL]: {
    root: 'bg-danger-soft text-danger-fg',
    dot: 'bg-danger-fg',
  },
  [RunningStatus.RUNNING]: {
    root: 'bg-info-soft text-info-fg',
    dot: 'bg-info-fg',
  },
  [RunningStatus.UNSTART]: {
    root: 'bg-warning-soft text-warning-fg',
    dot: 'bg-warning-fg',
  },
  [RunningStatus.CANCEL]: {
    root: 'bg-sunken text-fg-subtle',
    dot: 'bg-fg-subtle',
  },
  [RunningStatus.SCHEDULE]: {
    root: 'bg-info-soft text-info-fg',
    dot: 'bg-info-fg',
  },
} as const

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// knowledge-logs 域 query key 工厂。LogTabType 的枚举值即原内联 key 的
// 'fileLogs' / 'datasetLogs' 前缀，形状沿用原内联数组，不变
export const knowledgeLogKeys = {
  detail: (kbId: string | undefined, logId: string | undefined) =>
    ['ingestionDetail', kbId, logId] as const,
  list: (
    tab: LogTabType,
    kbId: string | undefined,
    page: number,
    pageSize: number,
    keywords: string,
    filter: LogFilterValue,
  ) => [tab, kbId, page, pageSize, keywords, filter] as const,
  stats: (kbId: string | undefined) => ['logStats', kbId] as const,
}
