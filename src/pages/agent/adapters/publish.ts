import type { AgentFlow, AgentPublishSummary } from '@/types/agent'
import { resolveLocalizedText } from '@/lib/agent'

export function adaptAgentPublishSummary(
  flow: AgentFlow | undefined,
): AgentPublishSummary {
  return {
    id: flow?.id || '',
    title: resolveLocalizedText(flow?.title, '未命名资产'),
    avatar: flow?.avatar,
    isPublished: Boolean(flow?.release),
    lastPublishedAt:
      flow?.last_publish_time || flow?.release_time || undefined,
    datasets: flow?.datasets || [],
  }
}
