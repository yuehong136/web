import type {
  AgentFlow,
  AgentWebhookSummary,
  AgentWebhookTraceEvent,
  AgentWebhookTraceResponse,
  AgentWebhookTraceSummary,
} from '@/types/agent'
import { BeginId } from '../constant'

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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const findErrorMessage = (events: AgentWebhookTraceEvent[]) => {
  const event = events.find((item) => {
    if (item.event === 'error') {
      return true
    }

    const data = item.data
    if (!isRecord(data)) {
      return false
    }

    return Boolean(data.error || data.message || data.outputs)
  })

  if (!event) {
    return undefined
  }

  const data = event.data
  if (isRecord(data)) {
    const outputs = isRecord(data.outputs) ? data.outputs : undefined
    const outputError = outputs?._ERROR
    if (typeof outputError === 'string') {
      return outputError
    }
    if (typeof data.error === 'string') {
      return data.error
    }
    if (typeof data.message === 'string' && event.event === 'error') {
      return data.message
    }
  }

  return typeof event.message === 'string' ? event.message : undefined
}

const findFirstInput = (events: AgentWebhookTraceEvent[]) => {
  const beginEvent = events.find((event) => {
    const data = event.data
    return (
      event.event === 'node_finished' &&
      isRecord(data) &&
      data.component_id === BeginId
    )
  })

  return isRecord(beginEvent?.data) ? beginEvent.data.inputs : undefined
}

const findLatestOutput = (events: AgentWebhookTraceEvent[]) => {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    const data = event?.data

    if (
      event?.event === 'node_finished' &&
      isRecord(data) &&
      data.component_id !== BeginId
    ) {
      return data.outputs
    }

    if (event?.event === 'workflow_finished' && isRecord(data)) {
      const outputs = isRecord(data.outputs) ? data.outputs : undefined
      if (outputs) {
        return outputs
      }
    }
  }

  return undefined
}

export function adaptAgentWebhookTrace(
  payload: AgentWebhookTraceResponse | undefined,
): AgentWebhookTraceSummary {
  const events = Array.isArray(payload?.events) ? payload.events : []
  const errorMessage = findErrorMessage(events)
  const finished = Boolean(payload?.finished)

  return {
    webhookId:
      typeof payload?.webhook_id === 'string'
        ? payload.webhook_id
        : undefined,
    events,
    nextSinceTs:
      typeof payload?.next_since_ts === 'number'
        ? payload.next_since_ts
        : undefined,
    finished,
    status: errorMessage
      ? 'error'
      : finished
        ? 'success'
        : events.length > 0 || payload?.webhook_id
          ? 'running'
          : 'idle',
    errorMessage,
    firstInput: findFirstInput(events),
    latestOutput: findLatestOutput(events),
  }
}
