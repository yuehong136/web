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
  RAPTOR = 'RAPTOR',
}

export const ProcessingTypeI18nKey: Record<ProcessingType, string> = {
  [ProcessingType.KNOWLEDGE_GRAPH]:
    'knowledge.logs.processingType.knowledgeGraph',
  [ProcessingType.RAPTOR]: 'knowledge.logs.processingType.raptor',
}

export const StatusClassConfig = {
  [RunningStatus.DONE]: {
    root: 'bg-status-success-10 text-status-success',
    dot: 'bg-status-success',
  },
  [RunningStatus.FAIL]: {
    root: 'bg-status-error-10 text-status-error',
    dot: 'bg-status-error',
  },
  [RunningStatus.RUNNING]: {
    root: 'bg-state-focus-10 text-state-focus',
    dot: 'bg-state-focus',
  },
  [RunningStatus.UNSTART]: {
    root: 'bg-status-warning-10 text-status-warning',
    dot: 'bg-status-warning',
  },
  [RunningStatus.CANCEL]: {
    root: 'bg-state-neutral-10 text-text-tertiary',
    dot: 'bg-text-tertiary',
  },
  [RunningStatus.SCHEDULE]: {
    root: 'bg-state-focus-10 text-state-focus',
    dot: 'bg-state-focus',
  },
} as const

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// knowledge-logs 域 query key 工厂。LogTabType 的枚举值即原内联 key 的
// 'fileLogs' / 'datasetLogs' 前缀，形状沿用原内联数组，不变
export const knowledgeLogKeys = {
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
