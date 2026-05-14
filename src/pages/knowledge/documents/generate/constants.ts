import { GenerateTaskType, GenerateTaskStatus } from '@/hooks/use-generate-task'

export const TASK_TYPE_CONFIG = {
  [GenerateTaskType.GraphRAG]: {
    labelKey: 'knowledge.documents.generate.types.graph.label',
    descriptionKey: 'knowledge.documents.generate.types.graph.description',
    icon: 'Network' as const,
  },
  [GenerateTaskType.Raptor]: {
    labelKey: 'knowledge.documents.generate.types.raptor.label',
    descriptionKey: 'knowledge.documents.generate.types.raptor.description',
    icon: 'TreePine' as const,
  },
} as const

export const TASK_STATUS_CONFIG = {
  [GenerateTaskStatus.Start]: {
    textKey: 'knowledge.documents.generate.status.start',
    actionTextKey: 'knowledge.documents.generate.action.start',
    bgToken: 'var(--color-components-task-status-idle-bg)',
    borderToken: 'var(--color-components-task-status-idle-border)',
    textToken: 'var(--color-components-task-status-idle-text)',
    dotToken: 'var(--color-components-task-status-idle-dot)',
  },
  [GenerateTaskStatus.Running]: {
    textKey: 'knowledge.documents.generate.status.running',
    actionTextKey: 'knowledge.documents.generate.action.running',
    bgToken: 'var(--color-components-task-status-running-bg)',
    borderToken: 'var(--color-components-task-status-running-border)',
    textToken: 'var(--color-components-task-status-running-text)',
    dotToken: 'var(--color-components-task-status-running-dot)',
  },
  [GenerateTaskStatus.Completed]: {
    textKey: 'knowledge.documents.generate.status.completed',
    actionTextKey: 'knowledge.documents.generate.action.completed',
    bgToken: 'var(--color-components-task-status-completed-bg)',
    borderToken: 'var(--color-components-task-status-completed-border)',
    textToken: 'var(--color-components-task-status-completed-text)',
    dotToken: 'var(--color-components-task-status-completed-dot)',
  },
  [GenerateTaskStatus.Failed]: {
    textKey: 'knowledge.documents.generate.status.failed',
    actionTextKey: 'knowledge.documents.generate.action.failed',
    bgToken: 'var(--color-components-task-status-failed-bg)',
    borderToken: 'var(--color-components-task-status-failed-border)',
    textToken: 'var(--color-components-task-status-failed-text)',
    dotToken: 'var(--color-components-task-status-failed-dot)',
  },
} as const
