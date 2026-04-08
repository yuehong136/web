import type { AgentFlow, AgentWebhookSummary } from '@/types/agent'

export function adaptAgentWebhookSummary(
  flow: AgentFlow | undefined,
  webhookUrl?: string,
): AgentWebhookSummary {
  return {
    canvasId: flow?.id || '',
    url: webhookUrl || '',
    status: webhookUrl ? 'active' : 'inactive',
    title:
      typeof flow?.title === 'string'
        ? flow.title
        : flow?.title?.zh || flow?.title?.en || 'Agent Webhook',
  }
}
