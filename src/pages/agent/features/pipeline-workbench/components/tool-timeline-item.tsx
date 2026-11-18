import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        'rounded-radius-md border border-line-subtle bg-sunken px-space-sm py-space-xs',
        depth > 0 && 'mt-space-xs',
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem
          value={item.component_id || `tool-${depth}`}
          className="border-none"
        >
          <AccordionTrigger className="py-space-xs hover:no-underline">
            <div className="flex items-center gap-space-xs">
              <span
                className={cn(
                  'size-2 rounded-full',
                  failed ? 'bg-danger-fg' : 'bg-success-fg',
                )}
              />
              <span className="font-medium text-fg">
                {item.component_name ||
                  item.component_id ||
                  t('agent.pipelineRun.timeline.toolNode')}
              </span>
              {typeof item.elapsed_time === 'number' &&
              item.elapsed_time > 0 ? (
                <span className="text-xs text-fg-muted">
                  {/* i18n-ignore: seconds unit suffix */}
                  {item.elapsed_time.toFixed(3)}s
                </span>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-space-sm">
              <div>
                <div className="mb-space-xs text-xs text-fg-muted">
                  {t('agent.runtime.input')}
                </div>
                <pre className="max-h-40 overflow-auto rounded-radius-sm bg-surface p-space-sm text-xs">
                  {JSON.stringify(inputs, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-space-xs text-xs text-fg-muted">
                  {t('agent.runtime.output')}
                </div>
                <pre className="max-h-40 overflow-auto rounded-radius-sm bg-surface p-space-sm text-xs">
                  {JSON.stringify(outputs, null, 2)}
                </pre>
              </div>
              {subTraces.length > 0 ? (
                <div className="space-y-space-xs">
                  <div className="text-xs text-fg-muted">
                    {t('agent.pipelineRun.timeline.subtasks')}
                  </div>
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
