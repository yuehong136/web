import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileStatusBadge } from './FileStatusBadge'
import { RunningStatus, LogTabType } from './constants'
import { formatDate, formatSecondsToHumanReadable } from './hooks'
import {
  FileText,
  Database,
  Clock,
  Upload,
  Hash,
  Play,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LogTableItem } from './LogTable'

interface LogDetailModalProps {
  open: boolean
  onClose: () => void
  logInfo: LogTableItem | null
  activeTab: LogTabType
}

/**
 * 信息项组件 - 纯展示组件
 */
interface InfoItemProps {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  className?: string
  fullWidth?: boolean
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  className,
  fullWidth = false,
}) => (
  <div
    className={cn(
      'flex flex-col gap-1.5',
      fullWidth && 'col-span-2',
      className,
    )}
  >
    <div className="flex items-center gap-1.5">
      {icon && (
        <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      )}
      <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
        {label}
      </span>
    </div>
    <div className="text-sm text-[var(--color-text-primary)]">
      {value || '-'}
    </div>
  </div>
)

/**
 * 进度条组件 - 纯展示组件
 */
interface ProgressBarProps {
  progress: number
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className }) => {
  const percentage = Math.min(100, Math.round(progress * 100))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-components-progress-bg)]">
        <div
          className="h-full rounded-full bg-[var(--color-components-progress-fill)] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="min-w-[3rem] text-right text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
        {percentage}%
      </span>
    </div>
  )
}

/**
 * 高亮日志文本 - 支持多种日志级别
 */
const highlightLogText = (text: string): React.ReactNode => {
  if (!text) return '-'

  // 移除重复换行
  const cleanText = text.replace(/(\n)\1+/g, '$1')

  // 匹配各种日志级别格式
  const logPattern = /(\[ERROR\][^\n]*|\[WARNING\][^\n]*|\[INFO\][^\n]*)/g
  const parts = cleanText.split(logPattern)

  return parts.map((part, index) => {
    if (part.includes('[ERROR]')) {
      return (
        <span
          key={index}
          className="font-medium text-[var(--color-state-error)]"
        >
          {part}
        </span>
      )
    }
    if (part.includes('[WARNING]')) {
      return (
        <span key={index} className="text-[var(--color-state-warning)]">
          {part}
        </span>
      )
    }
    if (part.includes('[INFO]')) {
      return (
        <span key={index} className="text-[var(--color-state-focus)]">
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/**
 * 日志详情模态框组件
 *
 * 展示文件或数据集的处理日志详情
 */
const LogDetailModal: React.FC<LogDetailModalProps> = ({
  open,
  onClose,
  logInfo,
  activeTab,
}) => {
  const { t } = useTranslation()
  // 计算展示的信息
  const displayInfo = useMemo(() => {
    if (!logInfo) return null

    return {
      taskId: logInfo.task_id,
      fileName: logInfo.document_name,
      source: logInfo.source_from || 'local',
      task: logInfo.task_type,
      status: logInfo.operation_status as RunningStatus,
      startDate: formatDate(logInfo.process_begin_at || null),
      duration: formatSecondsToHumanReadable(logInfo.process_duration || 0),
      details: logInfo.progress_msg || '',
      progress: logInfo.progress,
    }
  }, [logInfo])

  const isFileLogs = activeTab === LogTabType.FILE_LOGS
  const title = isFileLogs
    ? t('knowledge.logs.detail.fileTitle')
    : t('knowledge.logs.detail.datasetTitle')
  const HeaderIcon = isFileLogs ? FileText : Database

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-state-focus-10)]">
              <HeaderIcon className="h-5 w-5 text-[var(--color-state-focus)]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {t('knowledge.logs.detail.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {displayInfo && (
          <div className="max-h-[calc(80vh-200px)] space-y-6 overflow-y-auto px-6 py-4">
            {/* 基本信息网格 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* 文件名 / 任务ID */}
              {isFileLogs && displayInfo.fileName && (
                <InfoItem
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label={t('knowledge.logs.detail.fileName')}
                  value={
                    <span className="break-all font-medium">
                      {displayInfo.fileName}
                    </span>
                  }
                />
              )}

              {displayInfo.taskId && (
                <InfoItem
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label={t('knowledge.logs.detail.taskId')}
                  value={
                    <code className="break-all rounded bg-[var(--color-background-subtle)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-text-secondary)]">
                      {displayInfo.taskId}
                    </code>
                  }
                />
              )}

              {/* 来源 */}
              {isFileLogs && displayInfo.source && (
                <InfoItem
                  icon={<Upload className="h-3.5 w-3.5" />}
                  label={t('knowledge.logs.detail.source')}
                  value={
                    displayInfo.source === 'local'
                      ? t('knowledge.logs.detail.localUpload')
                      : displayInfo.source
                  }
                />
              )}

              {/* 任务类型 */}
              {displayInfo.task && (
                <InfoItem
                  icon={<Play className="h-3.5 w-3.5" />}
                  label={t('knowledge.logs.detail.taskType')}
                  value={
                    <span className="inline-flex items-center rounded-md bg-[var(--color-background-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      {displayInfo.task}
                    </span>
                  }
                />
              )}

              {/* 开始时间 */}
              <InfoItem
                icon={<Clock className="h-3.5 w-3.5" />}
                label={t('knowledge.logs.detail.startTime')}
                value={displayInfo.startDate}
              />

              {/* 持续时间 */}
              <InfoItem
                icon={<Timer className="h-3.5 w-3.5" />}
                label={t('knowledge.logs.detail.duration')}
                value={displayInfo.duration}
              />

              {/* 状态 */}
              <InfoItem
                label={t('knowledge.logs.detail.status')}
                value={<FileStatusBadge status={displayInfo.status} />}
              />

              {/* 进度 */}
              {displayInfo.progress !== undefined && (
                <InfoItem
                  label={t('knowledge.logs.detail.progress')}
                  value={<ProgressBar progress={displayInfo.progress} />}
                />
              )}
            </div>

            {/* 详细日志 */}
            {displayInfo.details && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  {t('knowledge.logs.detail.details')}
                </span>
                <ScrollArea className="h-[200px]">
                  <pre
                    className={cn(
                      'whitespace-pre-wrap break-words rounded-lg p-4 font-mono text-xs',
                      'bg-[var(--color-components-pre-bg)]',
                      'border border-[var(--color-components-pre-border)]',
                      'text-[var(--color-components-pre-text)]',
                    )}
                  >
                    {highlightLogText(displayInfo.details)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>{t('knowledge.logs.detail.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { LogDetailModal }
export default LogDetailModal
