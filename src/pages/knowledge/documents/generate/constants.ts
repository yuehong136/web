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
    bgClass: 'bg-components-task-status-idle-bg',
    borderClass: 'border-components-task-status-idle-border',
    textClass: 'text-components-task-status-idle-text',
    dotClass: 'bg-components-task-status-idle-dot',
  },
  [GenerateTaskStatus.Running]: {
    textKey: 'knowledge.documents.generate.status.running',
    actionTextKey: 'knowledge.documents.generate.action.running',
    bgClass: 'bg-components-task-status-running-bg',
    borderClass: 'border-components-task-status-running-border',
    textClass: 'text-components-task-status-running-text',
    dotClass: 'bg-components-task-status-running-dot',
  },
  [GenerateTaskStatus.Completed]: {
    textKey: 'knowledge.documents.generate.status.completed',
    actionTextKey: 'knowledge.documents.generate.action.completed',
    bgClass: 'bg-components-task-status-completed-bg',
    borderClass: 'border-components-task-status-completed-border',
    textClass: 'text-components-task-status-completed-text',
    dotClass: 'bg-components-task-status-completed-dot',
  },
  [GenerateTaskStatus.Failed]: {
    textKey: 'knowledge.documents.generate.status.failed',
    actionTextKey: 'knowledge.documents.generate.action.failed',
    bgClass: 'bg-components-task-status-failed-bg',
    borderClass: 'border-components-task-status-failed-border',
    textClass: 'text-components-task-status-failed-text',
    dotClass: 'bg-components-task-status-failed-dot',
  },
} as const
