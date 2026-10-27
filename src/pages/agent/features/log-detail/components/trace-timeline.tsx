import { useTranslation } from 'react-i18next'
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

const UNAVAILABLE_MESSAGE_KEYS: Record<
  NonNullable<TraceTimelineProps['unavailableReason']> | 'empty',
  string
> = {
  fetching: 'agent.logDetail.timeline.fetching',
  'no-message-id': 'agent.logDetail.timeline.noMessageId',
  'redis-evicted': 'agent.logDetail.timeline.redisEvicted',
  empty: 'agent.logDetail.timeline.empty',
}

function getStatusVariant(status?: string) {
  return (
    STATUS_VARIANT_MAP[String(status || 'unknown').toLowerCase()] || 'outline'
  )
}

function TraceMessages({ item }: { item: AgentTraceItem }) {
  const { t } = useTranslation()
  const trace = Array.isArray(item.trace) ? item.trace : []
  const messages = trace
    .map((entry) =>
      entry && typeof entry === 'object' && 'message' in entry
        ? entry.message
        : undefined,
    )
    .filter(
      (message): message is string =>
        typeof message === 'string' && Boolean(message),
    )

  if (!messages.length) {
    return null
  }

  return (
    <div>
      <p className="mb-space-xs text-xs text-text-tertiary">
        {t('agent.logDetail.timeline.traceMessage')}
      </p>
      <pre className="max-h-[180px] overflow-auto rounded-radius-sm bg-surface-secondary p-space-sm text-xs text-text-secondary">
        {messages.join('\n')}
      </pre>
    </div>
  )
}

function TraceItem({
  item,
  depth = 0,
}: {
  item: AgentTraceItem
  depth?: number
}) {
  const { t } = useTranslation()
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
                {item.component_name ||
                  item.component_id ||
                  t('agent.logDetail.timeline.unknownNode')}
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
                  <p className="mb-space-xs text-xs text-text-tertiary">
                    {t('agent.logDetail.timeline.inputs')}
                  </p>
                  <JsonViewer data={item.inputs} />
                </div>
              ) : null}
              {item.outputs ? (
                <div>
                  <p className="mb-space-xs text-xs text-text-tertiary">
                    {t('agent.logDetail.timeline.outputs')}
                  </p>
                  <JsonViewer data={item.outputs} />
                </div>
              ) : null}
              <TraceMessages item={item} />
              {item.message ? (
                <pre className="max-h-[180px] overflow-auto rounded-radius-sm bg-status-error-subtle p-space-sm text-xs text-status-error">
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

export function TraceTimeline({
  items,
  unavailableReason,
}: TraceTimelineProps) {
  const { t } = useTranslation()
  if (!items.length) {
    return (
      <p className="text-sm text-text-secondary">
        {t(UNAVAILABLE_MESSAGE_KEYS[unavailableReason ?? 'empty'])}
      </p>
    )
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
