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
    text: string
    bgToken: string
    borderToken: string
    textToken: string
    dotToken: string
  }
> = {
  [TaskStatus.UNSTART]: {
    text: '未开始',
    bgToken: 'var(--color-components-task-status-idle-bg)',
    borderToken: 'var(--color-components-task-status-idle-border)',
    textToken: 'var(--color-components-task-status-idle-text)',
    dotToken: 'var(--color-components-task-status-idle-dot)',
  },
  [TaskStatus.RUNNING]: {
    text: '运行中',
    bgToken: 'var(--color-components-task-status-running-bg)',
    borderToken: 'var(--color-components-task-status-running-border)',
    textToken: 'var(--color-components-task-status-running-text)',
    dotToken: 'var(--color-components-task-status-running-dot)',
  },
  [TaskStatus.CANCEL]: {
    text: '已取消',
    bgToken: 'var(--color-components-task-status-cancelled-bg)',
    borderToken: 'var(--color-components-task-status-cancelled-border)',
    textToken: 'var(--color-components-task-status-cancelled-text)',
    dotToken: 'var(--color-components-task-status-cancelled-dot)',
  },
  [TaskStatus.DONE]: {
    text: '已完成',
    bgToken: 'var(--color-components-task-status-completed-bg)',
    borderToken: 'var(--color-components-task-status-completed-border)',
    textToken: 'var(--color-components-task-status-completed-text)',
    dotToken: 'var(--color-components-task-status-completed-dot)',
  },
  [TaskStatus.FAIL]: {
    text: '失败',
    bgToken: 'var(--color-components-task-status-failed-bg)',
    borderToken: 'var(--color-components-task-status-failed-border)',
    textToken: 'var(--color-components-task-status-failed-text)',
    dotToken: 'var(--color-components-task-status-failed-dot)',
  },
}

// 运行状态选项 (用于筛选器)
export const runStatusOptions = [
  { value: '0', label: '未开始' },
  { value: '1', label: '运行中' },
  { value: '2', label: '已取消' },
  { value: '3', label: '已完成' },
  { value: '4', label: '失败' },
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
