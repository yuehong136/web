import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import type { AgentTraceItem } from '@/types/agent'

const HIDDEN_TOOL_COMPONENT_IDS = new Set(['add_memory', 'gen_citations'])

interface ToolTimelineItemProps {
  item: AgentTraceItem
  depth?: number
}

export function ToolTimelineItem({ item, depth = 0 }: ToolTimelineItemProps) {
  if (HIDDEN_TOOL_COMPONENT_IDS.has(item.component_id)) {
    return null
  }

  const status = String(item.status || '').toLowerCase()
  const failed = status === 'fail' || status === 'failed' || status === 'error'
  const inputs = item.inputs ?? {}
  const outputs = item.outputs ?? {}
  const subTraces = Array.isArray(item.traces) ? item.traces : []

  return (
    <div
      className={cn(
        'rounded-radius-md border border-border-subtle bg-surface-secondary px-space-sm py-space-xs',
        depth > 0 && 'mt-space-xs',
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value={item.component_id || `tool-${depth}`} className="border-none">
          <AccordionTrigger className="py-space-xs hover:no-underline">
            <div className="flex items-center gap-space-xs">
              <span
                className={cn(
                  'size-2 rounded-full',
                  failed ? 'bg-status-error' : 'bg-status-success',
                )}
              />
              <span className="font-medium text-text-primary">
                {item.component_name || item.component_id || '工具节点'}
              </span>
              {typeof item.elapsed_time === 'number' && item.elapsed_time > 0 ? (
                <span className="text-xs text-text-secondary">
                  {item.elapsed_time.toFixed(3)}s
                </span>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-space-sm">
              <div>
                <div className="mb-space-xs text-xs text-text-secondary">输入</div>
                <pre className="max-h-40 overflow-auto rounded-radius-sm bg-surface-primary p-space-sm text-xs">
                  {JSON.stringify(inputs, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-space-xs text-xs text-text-secondary">输出</div>
                <pre className="max-h-40 overflow-auto rounded-radius-sm bg-surface-primary p-space-sm text-xs">
                  {JSON.stringify(outputs, null, 2)}
                </pre>
              </div>
              {subTraces.length > 0 ? (
                <div className="space-y-space-xs">
                  <div className="text-xs text-text-secondary">子任务</div>
                  {subTraces.map((sub, index) => (
                    <ToolTimelineItem
                      key={`${sub.component_id || 'sub'}-${index}`}
                      item={sub}
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
