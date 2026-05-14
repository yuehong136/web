import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { RunningStatus, RunningStatusI18nKey } from './constants'

interface FileStatusBadgeProps {
  status: RunningStatus | string
  name?: string
  className?: string
  showDot?: boolean
}

// 使用语义化设计令牌的状态颜色配置
const getStatusColors = (status: RunningStatus | string) => {
  switch (status) {
    case RunningStatus.DONE:
      return {
        bg: 'var(--color-state-success-10)',
        text: 'var(--color-state-success)',
        dot: 'var(--color-state-success)',
      }
    case RunningStatus.FAIL:
      return {
        bg: 'var(--color-state-error-10)',
        text: 'var(--color-state-error)',
        dot: 'var(--color-state-error)',
      }
    case RunningStatus.RUNNING:
      return {
        bg: 'var(--color-state-focus-10)',
        text: 'var(--color-state-focus)',
        dot: 'var(--color-state-focus)',
      }
    case RunningStatus.UNSTART:
      return {
        bg: 'var(--color-state-warning-10)',
        text: 'var(--color-state-warning)',
        dot: 'var(--color-state-warning)',
      }
    case RunningStatus.CANCEL:
      return {
        bg: 'var(--color-state-neutral-10)',
        text: 'var(--color-text-tertiary)',
        dot: 'var(--color-text-tertiary)',
      }
    case RunningStatus.SCHEDULE:
      return {
        bg: 'var(--color-state-focus-10)',
        text: 'var(--color-state-focus)',
        dot: 'var(--color-state-focus)',
      }
    default:
      return {
        bg: 'var(--color-state-neutral-10)',
        text: 'var(--color-text-secondary)',
        dot: 'var(--color-text-secondary)',
      }
  }
}

/**
 * 文件状态徽章组件
 * 用于显示文件处理状态，包含状态指示点和状态文本
 * 使用语义化设计令牌，自动适配主题切换
 */
const FileStatusBadge: React.FC<FileStatusBadgeProps> = ({
  status,
  name,
  className,
  showDot = true,
}) => {
  const { t } = useTranslation()
  const statusKey = status as RunningStatus
  const colors = getStatusColors(statusKey)
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
        className,
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 flex-shrink-0 rounded-full',
            isRunning && 'animate-pulse',
          )}
          style={{
            backgroundColor: colors.dot,
          }}
        />
      )}
      <span className="max-w-[80px] truncate">{displayName}</span>
    </span>
  )
}

export { FileStatusBadge }
export default FileStatusBadge
