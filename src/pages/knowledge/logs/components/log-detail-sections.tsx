import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { FileStatusBadge } from '../FileStatusBadge'
import { LogTabType, RunningStatus } from '../constants'
import { formatDate, formatSecondsToHumanReadable } from '../utils'
import type { LogTableItem } from '../types'

interface LogDetailBodyProps {
  logInfo: LogTableItem | null
  activeTab: LogTabType
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="min-w-0 truncate text-fg-subtle">{label}</dt>
      <dd className="col-span-2 min-w-0 break-words text-fg">
        {children || '-'}
      </dd>
    </>
  )
}

/** Log properties and the full log text, laid out for the Inspector. */
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
  const percent =
    displayInfo.progress === undefined
      ? null
      : Math.min(100, Math.max(0, Math.round(displayInfo.progress * 100)))

  return (
    <div className="flex flex-col gap-space-md text-sm">
      <dl className="grid grid-cols-3 gap-x-space-md gap-y-space-sm">
        {isFileLogs && displayInfo.fileName ? (
          <Property label={t('knowledge.logs.detail.fileName')}>
            <span className="inline-flex min-w-0 items-center gap-space-xs">
              <FileKindTile name={displayInfo.fileName} size="xs" />
              <span className="min-w-0 break-words">
                {displayInfo.fileName}
              </span>
            </span>
          </Property>
        ) : null}
        <Property label={t('knowledge.logs.detail.status')}>
          <FileStatusBadge status={displayInfo.status} />
        </Property>
        {percent !== null ? (
          <Property label={t('knowledge.logs.detail.progress')}>
            <span className="tabular-nums">{percent}%</span>
          </Property>
        ) : null}
        {displayInfo.task ? (
          <Property label={t('knowledge.logs.detail.taskType')}>
            {displayInfo.task}
          </Property>
        ) : null}
        {isFileLogs ? (
          <Property label={t('knowledge.logs.detail.source')}>
            {displayInfo.source === 'local'
              ? t('knowledge.logs.detail.localUpload')
              : displayInfo.source}
          </Property>
        ) : null}
        <Property label={t('knowledge.logs.detail.startTime')}>
          {displayInfo.startDate}
        </Property>
        <Property label={t('knowledge.logs.detail.duration')}>
          {displayInfo.duration}
        </Property>
        {displayInfo.taskId ? (
          <Property label={t('knowledge.logs.detail.taskId')}>
            <code className="font-mono text-xs break-all text-fg-muted">
              {displayInfo.taskId}
            </code>
          </Property>
        ) : null}
      </dl>

      {displayInfo.details ? (
        <section className="border-t border-line-subtle pt-space-md">
          <h3 className="mb-space-sm text-sm font-semibold text-fg">
            {t('knowledge.logs.detail.details')}
          </h3>
          <pre className="max-h-96 overflow-y-auto rounded-radius-md bg-sunken p-space-sm font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-fg-muted">
            {highlightLogText(displayInfo.details)}
          </pre>
        </section>
      ) : null}
    </div>
  )
}

function highlightLogText(text: string): ReactNode {
  const cleanText = text.replace(/(\n)\1+/g, '$1')
  const logPattern = /(\[ERROR\][^\n]*|\[WARNING\][^\n]*|\[INFO\][^\n]*)/g
  return cleanText.split(logPattern).map((part, index) => {
    if (part.includes('[ERROR]'))
      return (
        <span key={index} className="font-medium text-danger-fg">
          {part}
        </span>
      )
    if (part.includes('[WARNING]'))
      return (
        <span key={index} className="text-warning-fg">
          {part}
        </span>
      )
    if (part.includes('[INFO]'))
      return (
        <span key={index} className="text-info-fg">
          {part}
        </span>
      )
    return <span key={index}>{part}</span>
  })
}
