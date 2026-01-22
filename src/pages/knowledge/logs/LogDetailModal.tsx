import React, { useMemo } from 'react'
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
import { RunningStatus, RunningStatusMap, LogTabType } from './constants'
import { formatDate, formatSecondsToHumanReadable } from './hooks'
import { FileText, Database, Clock, Upload, Hash, Play, Timer } from 'lucide-react'
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
  <div className={cn(
    'flex flex-col gap-1.5',
    fullWidth && 'col-span-2',
    className
  )}>
    <div className="flex items-center gap-1.5">
      {icon && (
        <span className="text-[var(--color-text-tertiary)]">
          {icon}
        </span>
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
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--color-components-progress-bg)]">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out bg-[var(--color-components-progress-fill)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)] min-w-[3rem] text-right">
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
        <span 
          key={index}
          className="text-[var(--color-state-warning)]"
        >
          {part}
        </span>
      )
    }
    if (part.includes('[INFO]')) {
      return (
        <span 
          key={index}
          className="text-[var(--color-state-focus)]"
        >
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
  const title = isFileLogs ? '文件日志详情' : '数据集日志详情'
  const HeaderIcon = isFileLogs ? FileText : Database

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-state-focus-10)] flex items-center justify-center">
              <HeaderIcon className="h-5 w-5 text-[var(--color-state-focus)]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                查看日志的详细信息和处理进度
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {displayInfo && (
          <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(80vh-200px)]">
            {/* 基本信息网格 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* 文件名 / 任务ID */}
              {isFileLogs && displayInfo.fileName && (
                <InfoItem 
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="文件名" 
                  value={
                    <span className="font-medium break-all">
                      {displayInfo.fileName}
                    </span>
                  }
                />
              )}
              
              {displayInfo.taskId && (
                <InfoItem
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="任务ID"
                  value={
                    <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)] break-all">
                      {displayInfo.taskId}
                    </code>
                  }
                />
              )}

              {/* 来源 */}
              {isFileLogs && displayInfo.source && (
                <InfoItem
                  icon={<Upload className="h-3.5 w-3.5" />}
                  label="来源"
                  value={displayInfo.source === 'local' ? '本地上传' : displayInfo.source}
                />
              )}

              {/* 任务类型 */}
              {displayInfo.task && (
                <InfoItem 
                  icon={<Play className="h-3.5 w-3.5" />}
                  label="任务类型" 
                  value={
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)] text-xs font-medium">
                      {displayInfo.task}
                    </span>
                  }
                />
              )}

              {/* 开始时间 */}
              <InfoItem 
                icon={<Clock className="h-3.5 w-3.5" />}
                label="开始时间" 
                value={displayInfo.startDate} 
              />

              {/* 持续时间 */}
              <InfoItem 
                icon={<Timer className="h-3.5 w-3.5" />}
                label="持续时间" 
                value={displayInfo.duration} 
              />

              {/* 状态 */}
              <InfoItem
                label="状态"
                value={
                  <FileStatusBadge
                    status={displayInfo.status}
                    name={RunningStatusMap[displayInfo.status]}
                  />
                }
              />

              {/* 进度 */}
              {displayInfo.progress !== undefined && (
                <InfoItem
                  label="进度"
                  value={<ProgressBar progress={displayInfo.progress} />}
                />
              )}
            </div>

            {/* 详细日志 */}
            {displayInfo.details && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  详细日志
                </span>
                <ScrollArea className="h-[200px]">
                  <pre className={cn(
                    'p-4 rounded-lg text-xs font-mono whitespace-pre-wrap break-words',
                    'bg-[var(--color-components-pre-bg)]',
                    'border border-[var(--color-components-pre-border)]',
                    'text-[var(--color-components-pre-text)]'
                  )}>
                    {highlightLogText(displayInfo.details)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { LogDetailModal }
export default LogDetailModal
