import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  RunningStatus,
  RunningStatusI18nKey,
  StatusClassConfig,
} from './constants'

interface FileStatusBadgeProps {
  status: RunningStatus | string
  name?: string
  className?: string
  showDot?: boolean
}

const FileStatusBadge: FC<FileStatusBadgeProps> = ({
  status,
  name,
  className,
  showDot = true,
}) => {
  const { t } = useTranslation()
  const statusKey = status as RunningStatus
  const classes = StatusClassConfig[statusKey] || {
    root: 'bg-background-subtle text-text-secondary',
    dot: 'bg-text-secondary',
  }
  const displayName =
    name ||
    (RunningStatusI18nKey[statusKey]
      ? t(RunningStatusI18nKey[statusKey])
      : t('knowledge.logs.status.unknown'))
  const isRunning = status === RunningStatus.RUNNING

  return (
    <span
      className={cn(
        'inline-flex items-center gap-space-xs rounded-radius-sm px-space-xs py-space-2xs text-xs leading-4 font-medium whitespace-nowrap',
        classes.root,
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 shrink-0 rounded-radius-full',
            classes.dot,
            isRunning && 'animate-pulse',
          )}
        />
      )}
      <span className="max-w-24 truncate">{displayName}</span>
    </span>
  )
}

export { FileStatusBadge }
