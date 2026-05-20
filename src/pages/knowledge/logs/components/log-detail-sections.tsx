import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, FileText, Hash, Play, Timer, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { FileStatusBadge } from '../FileStatusBadge'
import { LogTabType, RunningStatus } from '../constants'
import { formatDate, formatSecondsToHumanReadable } from '../utils'
import type { LogTableItem } from '../types'

interface LogDetailBodyProps {
  logInfo: LogTableItem | null
  activeTab: LogTabType
}

export function LogDetailBody({ logInfo, activeTab }: LogDetailBodyProps) {
  const { t } = useTranslation()
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

  if (!displayInfo) return null

  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  return (
    <div className="max-h-[calc(80vh-200px)] space-y-6 overflow-y-auto px-6 py-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
              <code className="rounded-radius-sm break-all bg-background-subtle px-1.5 py-0.5 font-mono text-xs text-text-secondary">
                {displayInfo.taskId}
              </code>
            }
          />
        )}

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

        {displayInfo.task && (
          <InfoItem
            icon={<Play className="h-3.5 w-3.5" />}
            label={t('knowledge.logs.detail.taskType')}
            value={
              <span className="rounded-radius-md inline-flex items-center bg-background-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                {displayInfo.task}
              </span>
            }
          />
        )}

        <InfoItem
          icon={<Clock className="h-3.5 w-3.5" />}
          label={t('knowledge.logs.detail.startTime')}
          value={displayInfo.startDate}
        />
        <InfoItem
          icon={<Timer className="h-3.5 w-3.5" />}
          label={t('knowledge.logs.detail.duration')}
          value={displayInfo.duration}
        />
        <InfoItem
          label={t('knowledge.logs.detail.status')}
          value={<FileStatusBadge status={displayInfo.status} />}
        />
        {displayInfo.progress !== undefined && (
          <InfoItem
            label={t('knowledge.logs.detail.progress')}
            value={<ProgressBar progress={displayInfo.progress} />}
          />
        )}
      </div>

      {displayInfo.details && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-tertiary">
            {t('knowledge.logs.detail.details')}
          </span>
          <ScrollArea className="h-[200px]">
            <pre className="rounded-radius-lg whitespace-pre-wrap break-words border border-components-pre-border bg-components-pre-bg p-4 font-mono text-xs text-components-pre-text">
              {highlightLogText(displayInfo.details)}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

interface InfoItemProps {
  icon?: ReactNode
  label: string
  value: ReactNode
  className?: string
  fullWidth?: boolean
}

function InfoItem({
  icon,
  label,
  value,
  className,
  fullWidth = false,
}: InfoItemProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        fullWidth && 'col-span-2',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-text-tertiary">{icon}</span>}
        <span className="text-xs font-medium text-text-tertiary">{label}</span>
      </div>
      <div className="text-sm text-text-primary">{value || '-'}</div>
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  className?: string
}

function ProgressBar({ progress, className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round(progress * 100))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-components-progress-bg">
        <div
          className="h-full rounded-full bg-components-progress-fill transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="min-w-[3rem] text-right text-xs font-medium tabular-nums text-text-secondary">
        {percentage}%
      </span>
    </div>
  )
}

function highlightLogText(text: string): ReactNode {
  if (!text) return '-'

  const cleanText = text.replace(/(\n)\1+/g, '$1')
  const logPattern = /(\[ERROR\][^\n]*|\[WARNING\][^\n]*|\[INFO\][^\n]*)/g
  const parts = cleanText.split(logPattern)

  return parts.map((part, index) => {
    if (part.includes('[ERROR]')) {
      return (
        <span key={index} className="font-medium text-status-error">
          {part}
        </span>
      )
    }
    if (part.includes('[WARNING]')) {
      return (
        <span key={index} className="text-status-warning">
          {part}
        </span>
      )
    }
    if (part.includes('[INFO]')) {
      return (
        <span key={index} className="text-state-focus">
          {part}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

interface LogDetailFooterProps {
  onClose: () => void
}

export function LogDetailFooter({ onClose }: LogDetailFooterProps) {
  const { t } = useTranslation()

  return <Button onClick={onClose}>{t('knowledge.logs.detail.close')}</Button>
}
