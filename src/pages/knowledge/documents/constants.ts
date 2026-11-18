/**
 * 文档列表页面常量定义
 */

// 文档运行状态 - 匹配后端 TaskStatus 枚举
export const TaskStatus = {
  UNSTART: '0', // 未开始
  RUNNING: '1', // 运行中
  CANCEL: '2', // 已取消
  DONE: '3', // 已完成
  FAIL: '4', // 失败
} as const

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

// 运行状态显示配置
export const TaskStatusConfig: Record<
  TaskStatus,
  {
    textKey: string
    bgClass: string
    borderClass: string
    textClass: string
    dotClass: string
  }
> = {
  [TaskStatus.UNSTART]: {
    textKey: 'knowledge.documents.taskStatus.unstart',
    bgClass: 'bg-neutral-soft',
    borderClass: 'border-neutral-line',
    textClass: 'text-neutral-fg',
    dotClass: 'bg-run-queued',
  },
  [TaskStatus.RUNNING]: {
    textKey: 'knowledge.documents.taskStatus.running',
    bgClass: 'bg-ai-soft',
    borderClass: 'border-ai-line',
    textClass: 'text-ai-fg',
    dotClass: 'bg-run-running',
  },
  [TaskStatus.CANCEL]: {
    textKey: 'knowledge.documents.taskStatus.cancel',
    bgClass: 'bg-neutral-soft',
    borderClass: 'border-neutral-line',
    textClass: 'text-neutral-fg',
    dotClass: 'bg-run-cancelled',
  },
  [TaskStatus.DONE]: {
    textKey: 'knowledge.documents.taskStatus.done',
    bgClass: 'bg-success-soft',
    borderClass: 'border-success-line',
    textClass: 'text-success-fg',
    dotClass: 'bg-run-succeeded',
  },
  [TaskStatus.FAIL]: {
    textKey: 'knowledge.documents.taskStatus.fail',
    bgClass: 'bg-danger-soft',
    borderClass: 'border-danger-line',
    textClass: 'text-danger-fg',
    dotClass: 'bg-run-failed',
  },
}

// 运行状态选项 (用于筛选器)
export const runStatusOptions = [
  { value: '0', labelKey: 'knowledge.documents.taskStatus.unstart' },
  { value: '1', labelKey: 'knowledge.documents.taskStatus.running' },
  { value: '2', labelKey: 'knowledge.documents.taskStatus.cancel' },
  { value: '3', labelKey: 'knowledge.documents.taskStatus.done' },
  { value: '4', labelKey: 'knowledge.documents.taskStatus.fail' },
]

// 特殊筛选字段：无元数据
export const EMPTY_METADATA_FIELD = 'empty_metadata'

// 默认分页配置
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 搜索防抖延迟（毫秒）
export const SEARCH_DEBOUNCE_MS = 500

// 轮询间隔（毫秒）
export const POLLING_INTERVAL_MS = 5000
