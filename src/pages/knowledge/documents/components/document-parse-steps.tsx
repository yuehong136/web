import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DocumentParseLog } from './document-parse-log'

export interface ParseStep {
  text: string
  /** Clock time the backend stamped on the line, e.g. "14:02:11". */
  time?: string
  /** Seconds the backend reported for the step, e.g. "(12.3s)". */
  duration?: string
  state: 'done' | 'running' | 'error'
}

const TIME = /^(\d{1,2}:\d{2}:\d{2})\s+/
const DURATION = /\((\d+(?:\.\d+)?)\s*s\)/

/**
 * One step per line of the backend's `progress_msg`; error lines fail, and
 * the last line of a running parse is the step in progress.
 */
export function parseSteps(message: string, running: boolean): ParseStep[] {
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.map((line, index) => {
    const time = line.match(TIME)?.[1]
    const text = time ? line.replace(TIME, '') : line
    const duration = text.match(DURATION)?.[1]
    const state: ParseStep['state'] = text.includes('[ERROR]')
      ? 'error'
      : running && index === lines.length - 1
        ? 'running'
        : 'done'
    return {
      text,
      time,
      duration: duration ? `${duration}s` : undefined,
      state,
    }
  })
}

const VISIBLE_STEPS = 6

function StepIcon({ state }: { state: ParseStep['state'] }) {
  if (state === 'running')
    return (
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded-radius-full bg-info-soft"
      >
        <span className="size-1.5 rounded-radius-full bg-info-fg motion-safe:animate-pulse" />
      </span>
    )
  const Icon = state === 'error' ? X : Check
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-radius-full',
        state === 'error'
          ? 'bg-danger-soft text-danger-fg'
          : 'bg-success-soft text-success-fg',
      )}
    >
      <Icon className="size-2.5" strokeWidth={3} />
    </span>
  )
}

/**
 * The parse log as one-line steps (latest last), with the full raw log a
 * click away. Steps come only from the log the backend already returns.
 */
export function DocumentParseSteps({
  message,
  running,
}: {
  message?: string | null
  running: boolean
}) {
  const { t } = useTranslation()
  if (!message?.trim())
    return (
      <p className="text-sm text-fg-subtle">
        {t('knowledge.documents.inspector.noLog')}
      </p>
    )
  const steps = parseSteps(message, running)
  const visible = steps.slice(-VISIBLE_STEPS)
  return (
    <div className="flex flex-col gap-space-sm">
      {steps.length > visible.length ? (
        <p className="text-xs text-fg-subtle">
          {t('knowledge.documents.inspector.earlierSteps', {
            count: steps.length - visible.length,
          })}
        </p>
      ) : null}
      <ol
        data-slot="document-parse-steps"
        className="ml-space-sm flex flex-col gap-space-2xs border-l border-line-subtle"
      >
        {visible.map((step, index) => (
          <li
            key={`${index}-${step.text}`}
            data-state={step.state}
            className="flex min-h-6 items-center gap-space-sm pl-space-sm text-xs"
          >
            <StepIcon state={step.state} />
            <span
              title={step.text}
              className={cn(
                'min-w-0 flex-1 truncate',
                step.state === 'error'
                  ? 'text-danger-fg'
                  : step.state === 'running'
                    ? 'text-shimmer'
                    : 'text-fg-muted',
              )}
            >
              {step.text}
            </span>
            {step.duration || step.time ? (
              <span className="shrink-0 font-mono text-fg-subtle">
                {step.duration ?? step.time}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <details className="group text-xs">
        <summary className="cursor-pointer rounded-radius-sm text-fg-subtle outline-hidden select-none hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus">
          {t('knowledge.documents.inspector.fullLog')}
        </summary>
        <div className="mt-space-sm">
          <DocumentParseLog message={message} />
        </div>
      </details>
    </div>
  )
}
