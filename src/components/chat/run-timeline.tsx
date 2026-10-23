import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CircleX,
  LoaderCircle,
  Wrench,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CodeBlock } from './CodeBlock'
import { ThinkWrapper } from './ThinkWrapper'
import {
  isRunTerminal,
  type AgentTimelineNode,
  type RunPhase,
} from '@/lib/streaming'
import { cn } from '@/lib/utils'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const stringify = (value: unknown): string => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2) ?? String(value)
  } catch {
    return String(value)
  }
}
const hasValue = (value: unknown) =>
  value !== undefined && value !== null && value !== ''

export const getToolStepStatus = (node: AgentTimelineNode, phase: RunPhase) =>
  node.status === 'loading' && isRunTerminal(phase)
    ? 'unconfirmed'
    : node.status === 'abort'
      ? 'unconfirmed'
      : node.status

function ToolStep({
  node,
  phase,
}: {
  node: AgentTimelineNode
  phase: RunPhase
}) {
  const { t } = useTranslation()
  const status = getToolStepStatus(node, phase)
  const payload = isRecord(node.content) ? node.content : null
  const Icon =
    status === 'loading'
      ? LoaderCircle
      : status === 'success'
        ? CheckCircle2
        : status === 'error'
          ? CircleX
          : CircleHelp
  const title =
    node.metadata?.toolName ||
    (node.kind === 'reasoning'
      ? t('chat.runTimeline.reasoningTitle')
      : node.kind === 'system'
        ? t('chat.runTimeline.analysis')
        : node.title || t('chat.runTimeline.step'))
  return (
    <li className="run-timeline-step" data-step-status={status}>
      <details>
        <summary className="run-step-heading">
          <Icon
            aria-hidden="true"
            className={cn(
              'size-icon-sm shrink-0',
              status === 'loading' && 'animate-spin',
              status === 'success'
                ? 'text-status-success'
                : status === 'error'
                  ? 'text-status-error'
                  : 'text-text-secondary',
            )}
          />
          <span className="min-w-0 flex-1 font-medium break-words">
            {title}
          </span>
          <span className="text-xs text-text-secondary">
            {t(`chat.runTimeline.status.${status}`)}
          </span>
          <ChevronDown className="size-icon-xs shrink-0" aria-hidden="true" />
        </summary>
        <div className="run-step-content">
          {payload ? (
            <>
              {typeof payload.reasoning === 'string' && payload.reasoning && (
                <ThinkWrapper
                  status={status === 'loading' ? 'thinking' : 'complete'}
                  titles={{ complete: t('chat.thinking.details') }}
                >
                  <p className="whitespace-pre-wrap">{payload.reasoning}</p>
                </ThinkWrapper>
              )}
              {(['arguments', 'result', 'error'] as const).map(
                (key) =>
                  hasValue(payload[key]) && (
                    <div key={key} className="space-y-space-xs">
                      <p className="text-xs font-medium text-text-secondary">
                        {t(`chat.runTimeline.${key}`)}
                      </p>
                      <CodeBlock
                        code={stringify(payload[key])}
                        language="json"
                        showHeader={false}
                        className="max-h-72 overflow-auto"
                      />
                    </div>
                  ),
              )}
            </>
          ) : hasValue(node.content) ? (
            <p className="whitespace-pre-wrap">{stringify(node.content)}</p>
          ) : (
            <p>
              {t(
                status === 'loading'
                  ? 'chat.runTimeline.toolRunning'
                  : 'chat.runTimeline.noToolDetail',
              )}
            </p>
          )}
        </div>
      </details>
    </li>
  )
}

/** Only observed events appear here. There are no predicted steps or percentages. */
export function RunTimeline({
  nodes,
  phase,
}: {
  nodes: AgentTimelineNode[]
  phase: RunPhase
}) {
  const { t } = useTranslation()
  const steps = nodes.filter(
    (node) => node.kind !== 'answer' && node.kind !== 'error',
  )
  if (!steps.length) return null
  const active = steps.some(
    (node) => getToolStepStatus(node, phase) === 'loading',
  )
  return (
    <details className="run-timeline" data-run-phase={phase}>
      <summary className="run-timeline-summary">
        {active ? (
          <LoaderCircle
            className="size-icon-sm animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Wrench className="size-icon-sm" aria-hidden="true" />
        )}
        <span>{t('chat.runTimeline.title')}</span>
        <span className="text-xs text-text-tertiary">
          {t('chat.runTimeline.count', { count: steps.length })}
        </span>
        <ChevronDown className="ms-auto size-icon-sm" aria-hidden="true" />
      </summary>
      <ol className="run-timeline-list">
        {steps.map((node) => (
          <ToolStep key={node.id} node={node} phase={phase} />
        ))}
      </ol>
    </details>
  )
}
