import {
  AgentRuntimeStatus,
  type RuntimeWorkbenchSummary,
} from '../features/runtime-workbench'
import type { PipelineWorkbenchSummary } from '../features/pipeline-workbench'

export type EmbedRuntimeSummary =
  | RuntimeWorkbenchSummary
  | PipelineWorkbenchSummary

export const EMBED_STATUS_VARIANT_MAP: Record<
  AgentRuntimeStatus,
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  [AgentRuntimeStatus.IDLE]: 'secondary',
  [AgentRuntimeStatus.PREPARING]: 'warning',
  [AgentRuntimeStatus.RUNNING]: 'warning',
  [AgentRuntimeStatus.SUCCESS]: 'success',
  [AgentRuntimeStatus.ERROR]: 'destructive',
  [AgentRuntimeStatus.STOPPED]: 'outline',
}

export const isPipelineSummary = (
  summary: EmbedRuntimeSummary,
): summary is PipelineWorkbenchSummary => 'outputAvailable' in summary
