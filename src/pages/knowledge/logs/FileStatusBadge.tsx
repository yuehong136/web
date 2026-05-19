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
    root: 'bg-state-neutral-10 text-text-secondary',
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200',
        classes.root,
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 flex-shrink-0 rounded-full',
            classes.dot,
            isRunning && 'animate-pulse',
          )}
        />
      )}
      <span className="max-w-[80px] truncate">{displayName}</span>
    </span>
  )
}

export { FileStatusBadge }
