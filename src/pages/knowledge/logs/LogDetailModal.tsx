import React, { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileStatusBadge } from './FileStatusBadge'
import { RunningStatus, RunningStatusMap, LogTabType } from './constants'
import { formatDate, formatSecondsToHumanReadable } from './hooks'
import type { LogTableItem } from './LogTable'

interface LogDetailModalProps {
  open: boolean
  onClose: () => void
  logInfo: LogTableItem | null
  activeTab: LogTabType
}

/**
 * 信息项组件 - 使用设计令牌
 */
const InfoItem: React.FC<{
  label: string
  value: React.ReactNode
  className?: string
}> = ({ label, value, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <span 
      className="text-xs"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {label}
    </span>
    <div 
      className="text-sm"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {value || '-'}
    </div>
  </div>
)

/**
 * 高亮错误日志文本 - 使用设计令牌
 */
const highlightLogText = (text: string): React.ReactNode => {
  if (!text) return '-'

  // 移除重复换行
  const cleanText = text.replace(/(\n)\1+/g, '$1')

  // 分割并高亮错误行
  const parts = cleanText.split(/(\[ERROR\].+?\n)/g)

  return parts.map((part, index) => {
    if (part.match(/\[ERROR\]/)) {
      return (
        <span 
          key={index} 
          className="font-medium"
          style={{ color: 'var(--color-state-error)' }}
        >
          {part}
        </span>
      )
    }
    if (part.match(/\[WARNING\]/)) {
      return (
        <span 
          key={index}
          style={{ color: 'var(--color-state-warning)' }}
        >
          {part}
        </span>
      )
    }
    if (part.match(/\[INFO\]/)) {
      return (
        <span 
          key={index}
          style={{ color: 'var(--color-state-focus)' }}
        >
          {part}
        </span>
      )
    }
    return part
  })
}

/**
 * 日志详情模态框组件
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

  const title = activeTab === LogTabType.FILE_LOGS ? '文件日志详情' : '数据集日志详情'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {title}
          </DialogTitle>
          <DialogDescription>
            查看日志的详细信息和处理进度
          </DialogDescription>
        </DialogHeader>

        {displayInfo && (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[calc(80vh-180px)] pr-4">
              <div className="space-y-6">
                {/* 基本信息网格 */}
                <div className="grid grid-cols-2 gap-4">
                  {activeTab === LogTabType.FILE_LOGS && displayInfo.fileName && (
                    <InfoItem label="文件名" value={displayInfo.fileName} />
                  )}
                  
                  {displayInfo.taskId && (
                    <InfoItem
                      label="任务ID"
                      value={
                        <span 
                          className="font-mono text-xs break-all"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {displayInfo.taskId}
                        </span>
                      }
                    />
                  )}

                  {activeTab === LogTabType.FILE_LOGS && displayInfo.source && (
                    <InfoItem
                      label="来源"
                      value={
                        <span className="capitalize">
                          {displayInfo.source === 'local' ? '本地上传' : displayInfo.source}
                        </span>
                      }
                    />
                  )}

                  {displayInfo.task && (
                    <InfoItem label="任务类型" value={displayInfo.task} />
                  )}

                  <InfoItem label="开始时间" value={displayInfo.startDate} />

                  <InfoItem label="持续时间" value={displayInfo.duration} />

                  <InfoItem
                    label="状态"
                    value={
                      <FileStatusBadge
                        status={displayInfo.status}
                        name={RunningStatusMap[displayInfo.status]}
                      />
                    }
                  />

                  {displayInfo.progress !== undefined && (
                    <InfoItem
                      label="进度"
                      value={
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--color-background-subtle)' }}
                          >
                            <div
                              className="h-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, displayInfo.progress * 100)}%`,
                                backgroundColor: 'var(--color-state-focus)',
                              }}
                            />
                          </div>
                          <span 
                            className="text-xs tabular-nums"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {Math.round(displayInfo.progress * 100)}%
                          </span>
                        </div>
                      }
                    />
                  )}
                </div>

                {/* 详细日志 */}
                {displayInfo.details && (
                  <div className="space-y-2">
                    <span 
                      className="text-xs"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      详细日志
                    </span>
                    <div className="relative">
                      <pre 
                        className="p-4 rounded-lg text-xs font-mono whitespace-pre-wrap break-words max-h-[250px] overflow-y-auto scrollbar-thin"
                        style={{
                          backgroundColor: 'var(--color-background-subtle)',
                          borderWidth: '1px',
                          borderColor: 'var(--color-border-subtle)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {highlightLogText(displayInfo.details)}
                      </pre>
                      {/* 渐变遮罩 */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none rounded-b-lg"
                        style={{
                          background: 'linear-gradient(to top, var(--color-background-subtle), transparent)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <div 
          className="flex justify-end pt-4"
          style={{ borderTopWidth: '1px', borderColor: 'var(--color-border-subtle)' }}
        >
          <Button onClick={onClose}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { LogDetailModal }
export default LogDetailModal
