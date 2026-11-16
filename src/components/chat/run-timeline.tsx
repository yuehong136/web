import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CodeBlock } from './CodeBlock'
import { ReasoningDisclosure } from './reasoning-disclosure'
import {
  isRunTerminal,
  type AgentTimelineNode,
  type RunPhase,
} from '@/lib/streaming'
import { cn } from '@/lib/utils'
import '@/components/chat/app-chat-message.css'

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

/** Items in a list result, when the tool returned one (or a JSON list as text). */
function resultCount(result: unknown): number | null {
  if (Array.isArray(result)) return result.length
  if (typeof result !== 'string') return null
  try {
    const parsed: unknown = JSON.parse(result)
    return Array.isArray(parsed) ? parsed.length : null
  } catch {
    return null
  }
}

function ToolStep({
  node,
  phase,
}: {
  node: AgentTimelineNode
  phase: RunPhase
}) {
  const { t, i18n } = useTranslation()
  const status = getToolStepStatus(node, phase)
  const payload = isRecord(node.content) ? node.content : null
  if (node.kind === 'reasoning' && typeof node.content === 'string')
    return (
      <li className="run-step" data-step-status={status}>
        <ReasoningDisclosure
          content={node.content}
          thinking={status === 'loading'}
        />
      </li>
    )
  const name =
    node.metadata?.toolName ||
    (node.kind === 'reasoning'
      ? t('chat.runTimeline.reasoningTitle')
      : node.kind === 'system'
        ? t('chat.runTimeline.analysis')
        : node.title || t('chat.runTimeline.step'))
  const count = status === 'success' ? resultCount(payload?.result) : null
  const elapsed = node.metadata?.elapsedMs
  const duration =
    typeof elapsed === 'number' && Number.isFinite(elapsed) && elapsed >= 0
      ? new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, {
          style: 'unit',
          unit: 'second',
          unitDisplay: 'narrow',
          maximumFractionDigits: 1,
        }).format(elapsed / 1000)
      : null
  return (
    <li className="run-step" data-step-status={status}>
      <details>
        <summary className="run-step-heading">
          {node.metadata?.toolName ? (
            <code className="min-w-0 break-all">{name}</code>
          ) : (
            <span className="min-w-0 font-medium text-text-primary">
              {name}
            </span>
          )}
          <span
            className={cn(
              'min-w-0',
              status === 'loading' && 'chat-shimmer',
              status === 'error' && 'text-status-error',
              status === 'success' && count === null && 'sr-only',
            )}
          >
            {count === null
              ? t(`chat.runTimeline.status.${status}`)
              : t('chat.runTimeline.resultCount', { count })}
          </span>
          {duration && <span className="run-step-duration">{duration}</span>}
          <ChevronRight
            aria-hidden="true"
            className={cn(
              'size-icon-xs shrink-0 text-text-tertiary',
              !duration && 'ms-auto',
            )}
          />
        </summary>
        <div className="run-step-content">
          {payload ? (
            <>
              {typeof payload.reasoning === 'string' && payload.reasoning && (
                <ReasoningDisclosure
                  content={payload.reasoning}
                  thinking={status === 'loading'}
                />
              )}
              {(['arguments', 'result', 'error'] as const).map(
                (key) =>
                  hasValue(payload[key]) && (
                    <div key={key} className="space-y-space-xs">
                      <p className="text-xs font-medium text-text-tertiary">
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
            <p className="text-text-tertiary">
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

/**
 * Observed steps only, as one compact timeline: name · result count ·
 * duration, with arguments and results behind each step. There are no
 * predicted steps, percentages or approval buttons: the web backend cannot
 * pause an MCP write for confirmation, so the timeline only reports what ran.
 */
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
  return (
    <section data-run-phase={phase} aria-label={t('chat.runTimeline.title')}>
      <h3 className="sr-only">
        {t('chat.runTimeline.title')} ·{' '}
        {t('chat.runTimeline.count', { count: steps.length })}
      </h3>
      <ol className="run-steps">
        {steps.map((node) => (
          <ToolStep key={node.id} node={node} phase={phase} />
        ))}
      </ol>
    </section>
  )
}
