import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentTraceItem } from '@/types/agent'
import OperatorIcon from '../../../operator-icon'
import { JsonViewer } from '../../../form/components/json-viewer'

interface TraceTimelineProps {
  items: AgentTraceItem[]
  unavailableReason?: 'no-message-id' | 'redis-evicted' | 'fetching'
}

const STATUS_VARIANT_MAP: Record<
  string,
  'success' | 'destructive' | 'warning' | 'outline'
> = {
  success: 'success',
  done: 'success',
  finish: 'success',
  finished: 'success',
  fail: 'destructive',
  failed: 'destructive',
  error: 'destructive',
  running: 'warning',
  pending: 'warning',
  unknown: 'outline',
}

function getStatusVariant(status?: string) {
  return STATUS_VARIANT_MAP[String(status || 'unknown').toLowerCase()] || 'outline'
}

function renderTraceMessages(item: AgentTraceItem) {
  const trace = Array.isArray(item.trace) ? item.trace : []
  const messages = trace
    .map((entry) =>
      entry && typeof entry === 'object' && 'message' in entry
        ? entry.message
        : undefined,
    )
    .filter((message): message is string => typeof message === 'string' && Boolean(message))

  if (!messages.length) {
    return null
  }

  return (
    <div>
      <p className="mb-space-xs text-xs text-text-tertiary">Trace Message</p>
      <pre className="max-h-[180px] overflow-auto rounded-radius-sm bg-surface-secondary p-space-sm text-xs text-text-secondary">
        {messages.join('\n')}
      </pre>
    </div>
  )
}

function TraceItem({ item, depth = 0 }: { item: AgentTraceItem; depth?: number }) {
  const children = item.traces || []
  const status = String(item.status || 'unknown')

  return (
    <div className={cn('relative', depth > 0 ? 'pl-space-md' : '')}>
      <Accordion type="single" collapsible>
        <AccordionItem
          value={`${item.component_id || item.component_name}-${depth}`}
          className="border-none"
        >
          <AccordionTrigger className="py-space-sm hover:no-underline">
            <div className="flex min-w-0 items-center gap-space-sm">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-radius-md border border-border-default bg-surface-primary">
                <OperatorIcon
                  name={item.component_name || item.component_id || ''}
                  className="size-4"
                />
              </span>
              <span className="truncate text-sm font-medium text-text-primary">
                {item.component_name || item.component_id || 'Unknown'}
              </span>
              <Badge variant={getStatusVariant(status)}>{status}</Badge>
              {typeof item.elapsed_time === 'number' ? (
                <span className="text-xs text-text-tertiary">
                  {item.elapsed_time.toFixed(3)}s
                </span>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-space-sm">
              {item.inputs ? (
                <div>
                  <p className="mb-space-xs text-xs text-text-tertiary">Inputs</p>
                  <JsonViewer data={item.inputs} />
                </div>
              ) : null}
              {item.outputs ? (
                <div>
                  <p className="mb-space-xs text-xs text-text-tertiary">Outputs</p>
                  <JsonViewer data={item.outputs} />
                </div>
              ) : null}
              {renderTraceMessages(item)}
              {item.message ? (
                <pre className="max-h-[180px] overflow-auto rounded-radius-sm bg-status-error/10 p-space-sm text-xs text-status-error">
                  {item.message}
                </pre>
              ) : null}
              {children.length ? (
                <div className="space-y-space-xs border-l border-border-primary pl-space-sm">
                  {children.map((child, index) => (
                    <TraceItem
                      key={`${child.component_id || child.component_name}-${index}`}
                      item={child}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export function TraceTimeline({ items, unavailableReason }: TraceTimelineProps) {
  if (!items.length) {
    const message =
      unavailableReason === 'fetching'
        ? '正在拉取终态 Trace...'
        : unavailableReason === 'no-message-id'
          ? '当前会话缺少可回查的真实 message_id，无法读取 Redis Trace。'
          : unavailableReason === 'redis-evicted'
            ? 'Redis 中没有返回 Trace，可能已过期或后端未写入。'
            : '暂无 Trace。'

    return <p className="text-sm text-text-secondary">{message}</p>
  }

  return (
    <div className="space-y-space-xs">
      {items.map((item, index) => (
        <TraceItem
          key={`${item.component_id || item.component_name}-${index}`}
          item={item}
        />
      ))}
    </div>
  )
}
