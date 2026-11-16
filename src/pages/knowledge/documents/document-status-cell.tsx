/**
 * Document parse status and the enable switch, shared by the table and the
 * document Inspector.
 */

import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui'
import { Switch } from '@/components/ui/switch'
import type { Document } from '@/types/api'
import { TaskStatus, TaskStatusConfig } from './constants'

const STATUS_ICONS: Partial<Record<TaskStatus, typeof X>> = {
  [TaskStatus.CANCEL]: X,
  [TaskStatus.DONE]: CheckCircle,
  [TaskStatus.FAIL]: XCircle,
}

/** Status lozenge; a running parse shows its progress instead. */
export const DocumentStatusBadge: FC<{
  document: Pick<Document, 'run' | 'progress'>
}> = ({ document }) => {
  const { t } = useTranslation()
  const { run, progress } = document

  if (run === TaskStatus.RUNNING) {
    const percent = Math.round((progress || 0) * 100)
    return (
      <span
        data-status={run}
        className="inline-flex items-center gap-space-xs text-xs font-medium whitespace-nowrap text-components-task-status-running-text"
      >
        <span
          aria-hidden="true"
          className="relative h-1.5 w-12 overflow-hidden rounded-radius-full bg-components-task-status-running-progress-bg"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-radius-full bg-components-task-status-running-progress-fill transition-all"
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className="tabular-nums">
          {t('knowledge.documents.taskStatus.runningPercent', { percent })}
        </span>
      </span>
    )
  }

  const config =
    TaskStatusConfig[run as TaskStatus] || TaskStatusConfig[TaskStatus.UNSTART]
  const Icon = STATUS_ICONS[run as TaskStatus]
  return (
    <span
      data-status={run}
      className={cn(
        'inline-flex items-center gap-space-xs rounded-radius-sm border px-space-xs py-space-2xs text-xs leading-4 font-medium whitespace-nowrap',
        config.bgClass,
        config.borderClass,
        config.textClass,
      )}
    >
      {Icon ? (
        <Icon className="size-icon-xs" aria-hidden="true" />
      ) : (
        <span
          aria-hidden="true"
          className={cn('size-1.5 rounded-radius-full', config.dotClass)}
        />
      )}
      {t(config.textKey)}
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
