/**
 * Document parse status and the enable switch, shared by the table and the
 * document Inspector.
 */

import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Tooltip } from '@/components/ui'
import { Switch } from '@/components/ui/switch'
import type { Document } from '@/types/api'
import { TaskStatus, TaskStatusConfig } from './constants'

/** Dot colour per status; the label always names the state too. */
const STATUS_DOT: Record<TaskStatus, string> = {
  [TaskStatus.UNSTART]: 'bg-fg-subtle',
  [TaskStatus.RUNNING]: 'bg-info-fg',
  [TaskStatus.CANCEL]: 'bg-warning-fg',
  [TaskStatus.DONE]: 'bg-success-fg',
  [TaskStatus.FAIL]: 'bg-danger-fg',
}

const STATUS_TEXT: Record<TaskStatus, string> = {
  [TaskStatus.UNSTART]: 'text-fg-subtle',
  [TaskStatus.RUNNING]: 'text-fg-muted',
  [TaskStatus.CANCEL]: 'text-fg-muted',
  [TaskStatus.DONE]: 'text-fg-muted',
  [TaskStatus.FAIL]: 'text-danger-fg',
}

const knownStatus = (run: string): TaskStatus =>
  run in TaskStatusConfig ? (run as TaskStatus) : TaskStatus.UNSTART

export function StatusDot({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-1.5 shrink-0 rounded-radius-full',
        STATUS_DOT[status],
        className,
      )}
    />
  )
}

/**
 * Status dot and label. A running parse shimmers with its percentage over a
 * thin tide bar (an AI moment); a failed one can offer a retry.
 */
export const DocumentStatusBadge: FC<{
  document: Pick<Document, 'run' | 'progress' | 'name'>
  /** Shown next to a failed status; usually starts the parse again. */
  onRetry?: () => void
}> = ({ document, onRetry }) => {
  const { t } = useTranslation()
  const status = knownStatus(document.run)

  if (status === TaskStatus.RUNNING) {
    const percent = Math.round((document.progress || 0) * 100)
    return (
      <span
        data-status={status}
        className="inline-flex min-w-0 flex-col gap-space-2xs"
      >
        <span className="inline-flex items-center gap-space-xs text-xs font-medium whitespace-nowrap">
          <StatusDot status={status} />
          <span className="text-shimmer tabular-nums">
            {t('knowledge.documents.taskStatus.runningPercent', { percent })}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="block h-0.5 w-full max-w-28 overflow-hidden rounded-radius-full bg-sunken"
        >
          <span
            className="block h-full rounded-radius-full bg-ai-tide transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </span>
      </span>
    )
  }

  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center gap-space-xs text-xs font-medium whitespace-nowrap',
        STATUS_TEXT[status],
      )}
    >
      <StatusDot status={status} />
      {t(TaskStatusConfig[status].textKey)}
      {status === TaskStatus.FAIL && onRetry ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto min-h-0 p-0 text-xs"
          onClick={onRetry}
          aria-label={t('knowledge.documents.actions.withName', {
            action: t('knowledge.documents.actions.retryParse'),
            name: document.name,
          })}
        >
          <RotateCw className="size-icon-xs" aria-hidden="true" />
          {t('knowledge.documents.actions.retryParse')}
        </Button>
      ) : null}
    </span>
  )
}

interface DocumentEnableSwitchProps {
  document: Document
  onToggle: () => void
}

export const DocumentEnableSwitch: FC<DocumentEnableSwitchProps> = ({
  document,
  onToggle,
}) => {
  const { t } = useTranslation()
  const isEnabled = document.status === '1'
  const label = isEnabled
    ? t('knowledge.documents.actions.disableDocument')
    : t('knowledge.documents.actions.enableDocument')

  return (
    <Tooltip content={label}>
      <Switch
        size="sm"
        checked={isEnabled}
        onCheckedChange={onToggle}
        aria-label={label}
      />
    </Tooltip>
  )
}
