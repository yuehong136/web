import { AgentRuntimeStatus } from '../features/runtime-workbench/types'

export const isEmptyShareValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  return value === undefined || value === null || value === ''
}

export function runnerStatusFromState(
  isRunning: boolean,
  lastError?: string,
): AgentRuntimeStatus {
  if (isRunning) {
    return AgentRuntimeStatus.RUNNING
  }

  if (lastError) {
    return AgentRuntimeStatus.ERROR
  }

  return AgentRuntimeStatus.IDLE
}
