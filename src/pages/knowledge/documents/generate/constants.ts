import { GenerateTaskType, GenerateTaskStatus } from '@/hooks/use-generate-task'

export const TASK_TYPE_CONFIG = {
  [GenerateTaskType.GraphRAG]: {
    label: '知识图谱',
    description: '基于文本块构建知识图谱，提升多跳问答能力',
    icon: 'Network' as const,
  },
  [GenerateTaskType.Raptor]: {
    label: 'RAPTOR',
    description: '层次化摘要聚类，增强复杂问题的召回',
    icon: 'TreePine' as const,
  },
} as const

export const TASK_STATUS_CONFIG = {
  [GenerateTaskStatus.Start]: {
    text: '未生成',
    actionText: '开始生成',
    bgToken: 'var(--color-components-task-status-idle-bg)',
    borderToken: 'var(--color-components-task-status-idle-border)',
    textToken: 'var(--color-components-task-status-idle-text)',
    dotToken: 'var(--color-components-task-status-idle-dot)',
  },
  [GenerateTaskStatus.Running]: {
    text: '生成中',
    actionText: '暂停',
    bgToken: 'var(--color-components-task-status-running-bg)',
    borderToken: 'var(--color-components-task-status-running-border)',
    textToken: 'var(--color-components-task-status-running-text)',
    dotToken: 'var(--color-components-task-status-running-dot)',
  },
  [GenerateTaskStatus.Completed]: {
    text: '已完成',
    actionText: '重新生成',
    bgToken: 'var(--color-components-task-status-completed-bg)',
    borderToken: 'var(--color-components-task-status-completed-border)',
    textToken: 'var(--color-components-task-status-completed-text)',
    dotToken: 'var(--color-components-task-status-completed-dot)',
  },
  [GenerateTaskStatus.Failed]: {
    text: '失败',
    actionText: '重试',
    bgToken: 'var(--color-components-task-status-failed-bg)',
    borderToken: 'var(--color-components-task-status-failed-border)',
    textToken: 'var(--color-components-task-status-failed-text)',
    dotToken: 'var(--color-components-task-status-failed-dot)',
  },
} as const
