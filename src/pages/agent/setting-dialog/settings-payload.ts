import type { UpdateAgentSettingsPayload } from '@/types/agent'

interface BuildAgentSettingsPayloadParams {
  agentId: string
  name: string
  description?: string
}

export function buildAgentSettingsPayload({
  agentId,
  name,
  description,
}: BuildAgentSettingsPayloadParams): UpdateAgentSettingsPayload {
  return {
    id: agentId,
    title: name.trim(),
    description: description?.trim() || '',
  }
}
