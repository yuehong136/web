import type { StatusDotTone } from '@/components/studio/collection-identity'
import { AgentRuntimeStatus } from '../features/runtime-workbench/types'

/** Run status as a status dot: running and preparing are the AI moment. */
export const RUNTIME_STATUS_TONE: Record<AgentRuntimeStatus, StatusDotTone> = {
  [AgentRuntimeStatus.IDLE]: 'neutral',
  [AgentRuntimeStatus.PREPARING]: 'running',
  [AgentRuntimeStatus.RUNNING]: 'running',
  [AgentRuntimeStatus.SUCCESS]: 'success',
  [AgentRuntimeStatus.ERROR]: 'error',
  [AgentRuntimeStatus.STOPPED]: 'warning',
}

export const RUNTIME_STATUS_LABEL = {
  [AgentRuntimeStatus.IDLE]: 'agent.runtime.idle',
  [AgentRuntimeStatus.PREPARING]: 'agent.runtime.preparing',
  [AgentRuntimeStatus.RUNNING]: 'agent.runtime.running',
  [AgentRuntimeStatus.SUCCESS]: 'agent.runtime.success',
  [AgentRuntimeStatus.ERROR]: 'agent.runtime.error',
  [AgentRuntimeStatus.STOPPED]: 'agent.runtime.outputDetached',
} as const satisfies Record<AgentRuntimeStatus, string>
