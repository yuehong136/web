import { Badge } from '@/components/ui/badge'
import { JsonViewer } from '../form/components/json-viewer'
import { formatTimestampDetailed } from '@/lib/utils'
import type { AgentWebhookTraceEvent } from '@/types/agent'

interface WebhookTimelineProps {
  events: AgentWebhookTraceEvent[]
}

const getEventTitle = (event: AgentWebhookTraceEvent) => {
  const data = event.data
  if (data?.component_name) {
    return `${event.event || 'event'} · ${String(data.component_name)}`
  }
  if (data?.component_id) {
    return `${event.event || 'event'} · ${String(data.component_id)}`
  }
  return event.event || 'event'
}

export function WebhookTimeline({ events }: WebhookTimelineProps) {
  if (!events.length) {
    return (
      <div className="rounded-radius-lg border border-border-subtle bg-surface-secondary p-space-lg text-center text-sm text-text-secondary">
        暂无 trace 事件。点击测试后会从 webhook_trace 轮询事件。
      </div>
    )
  }

  return (
    <div className="space-y-space-base">
      {events.map((event, index) => {
        const failed = event.event === 'error' || Boolean(event.data?.error)
        const timestamp =
          typeof event.timestamp === 'number'
            ? event.timestamp
            : typeof event.time === 'number'
              ? event.time
              : undefined

        return (
          <div
            key={`${event.event}-${event.message_id || index}-${index}`}
            className="rounded-radius-lg border border-border-default bg-surface-secondary p-space-base"
          >
            <div className="mb-space-sm flex flex-wrap items-center justify-between gap-space-sm">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {getEventTitle(event)}
                </p>
                {timestamp ? (
                  <p className="mt-space-xs text-xs text-text-tertiary">
                    {formatTimestampDetailed(timestamp)}
                  </p>
                ) : null}
              </div>
              <Badge variant={failed ? 'destructive' : 'secondary'}>
                {failed ? 'error' : event.event || 'event'}
              </Badge>
            </div>
            <JsonViewer data={event.data || event} />
          </div>
        )
      })}
    </div>
  )
}
