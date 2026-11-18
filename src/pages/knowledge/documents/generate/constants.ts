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
    bgClass: 'bg-neutral-soft',
    borderClass: 'border-neutral-line',
    textClass: 'text-neutral-fg',
    dotClass: 'bg-run-queued',
  },
  [GenerateTaskStatus.Running]: {
    textKey: 'knowledge.documents.generate.status.running',
    actionTextKey: 'knowledge.documents.generate.action.running',
    bgClass: 'bg-ai-soft',
    borderClass: 'border-ai-line',
    textClass: 'text-ai-fg',
    dotClass: 'bg-run-running',
  },
  [GenerateTaskStatus.Completed]: {
    textKey: 'knowledge.documents.generate.status.completed',
    actionTextKey: 'knowledge.documents.generate.action.completed',
    bgClass: 'bg-success-soft',
    borderClass: 'border-success-line',
    textClass: 'text-success-fg',
    dotClass: 'bg-run-succeeded',
  },
  [GenerateTaskStatus.Failed]: {
    textKey: 'knowledge.documents.generate.status.failed',
    actionTextKey: 'knowledge.documents.generate.action.failed',
    bgClass: 'bg-danger-soft',
    borderClass: 'border-danger-line',
    textClass: 'text-danger-fg',
    dotClass: 'bg-run-failed',
  },
} as const
