// 知识库日志页面常量定义

// 日志运行状态
export const RunningStatus = {
  UNSTART: '0', // 待处理
  RUNNING: '1', // 运行中
  CANCEL: '2', // 已取消
  DONE: '3', // 成功
  FAIL: '4', // 失败
  SCHEDULE: '5', // 已调度
} as const

export type RunningStatus = (typeof RunningStatus)[keyof typeof RunningStatus]

export const RunningStatusI18nKey: Record<RunningStatus, string> = {
  [RunningStatus.UNSTART]: 'knowledge.logs.status.unstart',
  [RunningStatus.RUNNING]: 'knowledge.logs.status.running',
  [RunningStatus.CANCEL]: 'knowledge.logs.status.cancel',
  [RunningStatus.DONE]: 'knowledge.logs.status.done',
  [RunningStatus.FAIL]: 'knowledge.logs.status.fail',
  [RunningStatus.SCHEDULE]: 'knowledge.logs.status.schedule',
}

// 日志Tab类型
export const LogTabType = {
  FILE_LOGS: 'fileLogs',
  DATASET_LOGS: 'datasetLogs',
} as const

export type LogTabType = (typeof LogTabType)[keyof typeof LogTabType]

// Tab选项配置
export const LogTabOptions = [
  { key: LogTabType.FILE_LOGS, labelKey: 'knowledge.logs.tabs.fileLogs' },
  { key: LogTabType.DATASET_LOGS, labelKey: 'knowledge.logs.tabs.datasetLogs' },
]

// 处理类型
export const ProcessingType = {
  KNOWLEDGE_GRAPH: 'GraphRAG',
  RAPTOR: 'RAPTOR',
} as const

export type ProcessingType =
  (typeof ProcessingType)[keyof typeof ProcessingType]

export const ProcessingTypeI18nKey: Record<ProcessingType, string> = {
  [ProcessingType.KNOWLEDGE_GRAPH]:
    'knowledge.logs.processingType.knowledgeGraph',
  [ProcessingType.RAPTOR]: 'knowledge.logs.processingType.raptor',
}

// 状态颜色配置 - 使用语义化设计令牌
export const StatusColorConfig = {
  [RunningStatus.DONE]: {
    bg: 'var(--color-state-success-10)',
    text: 'var(--color-state-success)',
    dot: 'var(--color-state-success)',
  },
  [RunningStatus.FAIL]: {
    bg: 'var(--color-state-error-10)',
    text: 'var(--color-state-error)',
    dot: 'var(--color-state-error)',
  },
  [RunningStatus.RUNNING]: {
    bg: 'var(--color-state-focus-10)',
    text: 'var(--color-state-focus)',
    dot: 'var(--color-state-focus)',
  },
  [RunningStatus.UNSTART]: {
    bg: 'var(--color-state-warning-10)',
    text: 'var(--color-state-warning)',
    dot: 'var(--color-state-warning)',
  },
  [RunningStatus.CANCEL]: {
    bg: 'var(--color-state-neutral-10)',
    text: 'var(--color-text-tertiary)',
    dot: 'var(--color-text-tertiary)',
  },
  [RunningStatus.SCHEDULE]: {
    bg: 'var(--color-state-focus-10)',
    text: 'var(--color-state-focus)',
    dot: 'var(--color-state-focus)',
  },
} as const

// 默认分页配置
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
