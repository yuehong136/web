import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import type { AgentTraceItem } from '@/types/agent'
import OperatorIcon from '../../../operator-icon'
import { ToolTimelineItem } from './tool-timeline-item'

interface DataflowTimelineProps {
  trace: AgentTraceItem[]
  loading: boolean
}

const STATUS_DOT_CLASS: Record<string, string> = {
  success: 'bg-status-success',
  done: 'bg-status-success',
  ok: 'bg-status-success',
  running: 'bg-status-warning animate-pulse',
  pending: 'bg-status-warning animate-pulse',
  fail: 'bg-status-error',
  failed: 'bg-status-error',
  error: 'bg-status-error',
}

function resolveStatusClass(status: string, fallbackLoading: boolean) {
  const key = String(status || '').toLowerCase()
  if (STATUS_DOT_CLASS[key]) {
    return STATUS_DOT_CLASS[key]
  }
  return fallbackLoading
    ? 'bg-status-warning animate-pulse'
    : 'bg-border-default'
}

function resolveBorderClass(status: string, fallbackLoading: boolean) {
  const key = String(status || '').toLowerCase()
  if (key === 'success' || key === 'done' || key === 'ok') {
    return 'border-status-success bg-surface-primary'
  }
  if (key === 'fail' || key === 'failed' || key === 'error') {
    return 'border-status-error bg-surface-primary'
  }
  if (fallbackLoading || key === 'running' || key === 'pending') {
    return 'border-status-warning bg-surface-primary animate-pulse'
  }
  return 'border-border-default bg-surface-secondary'
}

function isNestedTrace(item: AgentTraceItem) {
  return Boolean(item.component_id || item.component_name || item.tool_name)
}

export function DataflowTimeline({ trace, loading }: DataflowTimelineProps) {
  if (!Array.isArray(trace) || trace.length === 0) {
    return (
      <div className="py-space-xl text-center text-sm text-text-secondary">
        Pipeline 暂未启动或还没有日志，可在运行页填写开始输入并启动。
      </div>
    )
  }

  return (
    <div className="space-y-space-base">
      {trace.map((item, idx) => {
        const status = String(item.status || '').toLowerCase()
        const inputs = item.inputs ?? {}
        const outputs = item.outputs ?? {}
        const traceRows = Array.isArray(item.trace)
          ? (item.trace as Array<Record<string, unknown>>)
          : []
        const latestTraceRow = traceRows[traceRows.length - 1]
        const progress =
          typeof latestTraceRow?.progress === 'number'
            ? Math.max(0, Math.min(100, latestTraceRow.progress * 100))
            : undefined
        const traceMessages = traceRows
          .filter(
            (row) =>
              item.component_id !== 'END' &&
              typeof row.message === 'string' &&
              row.message,
          )
          .slice(-5)
        const subTraces = Array.isArray(item.traces)
          ? item.traces.filter(isNestedTrace)
          : []
        const elapsed =
          typeof item.elapsed_time === 'number' && item.elapsed_time > 0
            ? `${item.elapsed_time.toFixed(3)}s`
            : typeof latestTraceRow?.elapsed_time === 'number' &&
                latestTraceRow.elapsed_time > 0
              ? `${latestTraceRow.elapsed_time.toFixed(3)}s`
              : ''

        return (
          <div
            key={`${item.component_id || idx}-${idx}`}
            className="pl-space-xl relative"
          >
            {idx < trace.length - 1 ? (
              <div className="bg-surface-accent absolute bottom-0 left-[11px] top-8 w-0.5" />
            ) : null}

            <div className="absolute left-0 top-0 flex items-center justify-center">
              <div
                className={cn(
                  'flex size-6 items-center justify-center rounded-full border-2',
                  resolveBorderClass(status, loading),
                )}
              >
                <OperatorIcon
                  className="size-4"
                  name={
                    (item.component_name as string) || item.component_id || ''
                  }
                />
              </div>
            </div>

            <div className="rounded-radius-md bg-surface-primary border border-border-default">
              <Accordion type="single" collapsible className="px-space-sm">
                <AccordionItem
                  value={`${item.component_id || idx}-${idx}`}
                  className="border-none"
                >
                  <AccordionTrigger className="py-space-sm hover:no-underline">
                    <div className="gap-space-sm flex items-center">
                      <span className="font-medium text-text-primary">
                        {item.component_name || item.component_id || '节点'}
                      </span>
                      {elapsed ? (
                        <span className="text-xs text-text-secondary">
                          {elapsed}
                        </span>
                      ) : null}
                      {typeof progress === 'number' ? (
                        <span className="text-xs text-text-secondary">
                          {progress.toFixed(2)}%
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          resolveStatusClass(status, loading),
                        )}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-space-sm">
                      {typeof progress === 'number' ? (
                        <div>
                          <div className="mb-space-xs text-xs text-text-secondary">
                            进度
                          </div>
                          <div className="rounded-radius-full bg-surface-secondary h-1.5 overflow-hidden">
                            <div
                              className="rounded-radius-full bg-surface-accent h-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <div className="mb-space-xs text-xs text-text-secondary">
                          输入
                        </div>
                        <pre className="rounded-radius-sm bg-surface-secondary p-space-sm max-h-40 overflow-auto text-xs">
                          {JSON.stringify(inputs, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-space-xs text-xs text-text-secondary">
                          输出
                        </div>
                        <pre className="rounded-radius-sm bg-surface-secondary p-space-sm max-h-40 overflow-auto text-xs">
                          {JSON.stringify(outputs, null, 2)}
                        </pre>
                      </div>
                      {typeof item.message === 'string' && item.message ? (
                        <div>
                          <div className="mb-space-xs text-xs text-text-secondary">
                            消息
                          </div>
                          <pre className="rounded-radius-sm bg-surface-secondary p-space-sm max-h-40 overflow-auto text-xs">
                            {item.message}
                          </pre>
                        </div>
                      ) : null}
                      {traceMessages.length > 0 ? (
                        <div>
                          <div className="mb-space-xs text-xs text-text-secondary">
                            运行消息
                          </div>
                          <div className="space-y-space-xs">
                            {traceMessages.map((row, rowIdx) => (
                              <div
                                key={`${String(row.timestamp || rowIdx)}-${rowIdx}`}
                                className="rounded-radius-sm bg-surface-secondary p-space-sm text-xs text-text-secondary"
                              >
                                <div>{String(row.message)}</div>
                                {typeof row.elapsed_time === 'number' ? (
                                  <div className="mt-space-xs text-text-tertiary">
                                    {row.elapsed_time.toFixed(3)}s
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {subTraces.length > 0 ? (
                        <div className="space-y-space-xs">
                          <div className="text-xs text-text-secondary">
                            子任务
                          </div>
                          {subTraces.map((sub, subIdx) => (
                            <ToolTimelineItem
                              key={`${sub.component_id || 'sub'}-${subIdx}`}
                              item={sub}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )
      })}
    </div>
  )
}
