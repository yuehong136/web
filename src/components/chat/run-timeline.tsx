import type { ReactNode } from 'react'
import {
  Check,
  ChevronRight,
  LoaderCircle,
  Minus,
  Plug,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
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

export type StepStatus = ReturnType<typeof getToolStepStatus>

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

const STATUS_ICON: Record<StepStatus, ReactNode> = {
  success: <Check aria-hidden strokeWidth={2.5} className="size-icon-xs" />,
  loading: (
    <LoaderCircle
      aria-hidden
      strokeWidth={2.5}
      className="size-icon-xs animate-spin motion-reduce:animate-none"
    />
  ),
  error: <X aria-hidden strokeWidth={2.5} className="size-icon-xs" />,
  unconfirmed: <Minus aria-hidden strokeWidth={2.5} className="size-icon-xs" />,
}

/** Check, spinner, cross or dash in a small tinted dot; the status is also written out. */
function StepDot({ status }: { status: StepStatus }) {
  return (
    <span
      className={cn(
        'grid size-4.5 shrink-0 place-items-center rounded-radius-full',
        status === 'success' && 'bg-success-soft text-success-fg',
        status === 'loading' && 'bg-ai-soft text-ai-fg',
        status === 'error' && 'bg-danger-soft text-danger-fg',
        status === 'unconfirmed' && 'bg-sunken text-fg-subtle',
      )}
    >
      {STATUS_ICON[status]}
    </span>
  )
}

/** One step line: dot, what ran, then quieter facts (count, status, duration). */
function StepSummary({
  status,
  label,
  tool,
  meta,
  duration,
}: {
  status: StepStatus
  label: ReactNode
  tool?: ReactNode
  meta?: ReactNode
  duration?: string | null
}) {
  return (
    <summary className="run-step-heading">
      <StepDot status={status} />
      <span
        className={cn(
          'min-w-0 shrink-0',
          status === 'loading' && !tool && 'text-shimmer',
        )}
      >
        {label}
      </span>
      {tool}
      {meta}
      {duration && <span className="run-step-duration">{duration}</span>}
      <ChevronRight
        aria-hidden="true"
        className="run-step-chevron size-icon-xs shrink-0 text-fg-subtle"
      />
    </summary>
  )
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
  const toolName = node.metadata?.toolName
  const label = toolName
    ? t(node.kind === 'skill' ? 'chat.steps.skill' : 'chat.steps.tool')
    : node.kind === 'reasoning'
      ? t('chat.runTimeline.reasoningTitle')
      : node.kind === 'system'
        ? t('chat.runTimeline.analysis')
        : node.title || t('chat.runTimeline.step')
  const ToolIcon =
    node.kind === 'mcp' ? Plug : node.kind === 'skill' ? Zap : Wrench
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
        <StepSummary
          status={status}
          label={label}
          tool={
            toolName && (
              <code className="run-step-tool">
                <ToolIcon aria-hidden className="size-icon-xs shrink-0" />
                <span className="min-w-0 truncate">{toolName}</span>
              </code>
            )
          }
          meta={
            <span
              className={cn(
                'run-step-meta',
                status === 'loading' && 'text-shimmer',
                status === 'error' && 'text-danger-fg',
                status === 'success' && count === null && 'sr-only',
              )}
            >
              {count === null
                ? t(`chat.runTimeline.status.${status}`)
                : t('chat.runTimeline.resultCount', { count })}
            </span>
          }
          duration={duration}
        />
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
                      <p className="text-xs font-medium text-fg-subtle">
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
            <p className="text-fg-subtle">
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

export interface RetrievalStepData {
  status: 'loading' | 'complete' | 'interrupted'
  /** The retrieval log the answer stream carried, as plain text. */
  content: string
  /** Chunks retrieved for the answer, once they are known. */
  hits?: number
}

/** Knowledge retrieval as the first step: running, how many passages it found, its log. */
function RetrievalStep({ status, content, hits }: RetrievalStepData) {
  const { t } = useTranslation()
  const stepStatus: StepStatus =
    status === 'loading'
      ? 'loading'
      : status === 'complete'
        ? 'success'
        : 'unconfirmed'
  return (
    <li
      className="run-step"
      data-step-status={stepStatus}
      data-step-kind="retrieval"
      aria-busy={status === 'loading' || undefined}
    >
      <details>
        <StepSummary
          status={stepStatus}
          label={
            <span aria-live="polite">
              {t(
                status === 'loading'
                  ? 'chat.retrieving.inProgress'
                  : status === 'complete'
                    ? 'chat.steps.retrieval'
                    : 'chat.retrieving.interrupted',
              )}
            </span>
          }
          meta={
            status === 'complete' && hits ? (
              <span className="run-step-meta">
                {t('chat.steps.hits', { count: hits })}
              </span>
            ) : undefined
          }
        />
        <div className="run-step-content max-h-64 overflow-y-auto overscroll-contain whitespace-pre-wrap">
          {content || t('chat.runTimeline.noToolDetail')}
        </div>
      </details>
    </li>
  )
}

/**
 * Observed steps only, as one compact list: retrieval, then each tool, MCP or
 * skill call with its name · result count · duration, arguments and results
 * behind the line. There are no predicted steps, percentages or approval
 * buttons: the web backend cannot pause an MCP write for confirmation, so the
 * list only reports what ran.
 */
export function RunTimeline({
  nodes,
  phase,
  retrieval,
}: {
  nodes: AgentTimelineNode[]
  /** Tool steps need the run phase to tell unfinished from unconfirmed. */
  phase?: RunPhase
  retrieval?: RetrievalStepData | null
}) {
  const { t } = useTranslation()
  const steps = phase
    ? nodes.filter((node) => node.kind !== 'answer' && node.kind !== 'error')
    : []
  const count = steps.length + (retrieval ? 1 : 0)
  if (!count) return null
  return (
    <section
      data-run-phase={phase}
      data-run-timeline
      aria-label={t('chat.runTimeline.title')}
    >
      <h3 className="sr-only">
        {t('chat.runTimeline.title')} · {t('chat.runTimeline.count', { count })}
      </h3>
      <ol className="run-steps">
        {retrieval && <RetrievalStep {...retrieval} />}
        {phase &&
          steps.map((node) => (
            <ToolStep key={node.id} node={node} phase={phase} />
          ))}
      </ol>
    </section>
  )
}
