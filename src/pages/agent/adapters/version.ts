import type { AgentVersionSummary } from '@/types/agent'

export function adaptAgentVersionSummary(
  payload: AgentVersionSummary | undefined,
  index = 0,
): AgentVersionSummary {
  return {
    ...payload,
    id:
      payload?.id ||
      payload?.version_id ||
      `version-${index}`,
    title:
      payload?.title ||
      payload?.description ||
      payload?.version_id ||
      `版本 ${index + 1}`,
  }
}

export function adaptAgentVersionSummaries(
  payload: AgentVersionSummary[] | undefined,
): AgentVersionSummary[] {
  return (payload || []).map((item, index) =>
    adaptAgentVersionSummary(item, index),
  )
}
