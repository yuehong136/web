import { useTranslation } from 'react-i18next'
import { MonitorUp, Network, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip'
import { FileStatusBadge } from '../FileStatusBadge'
import {
  LogTabType,
  ProcessingType,
  ProcessingTypeI18nKey,
  RunningStatus,
} from '../constants'
import { formatDate } from '../utils'
import type { LogTableItem } from '../types'
import { LogFileIcon } from './log-file-icon'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { cn } from '@/lib/utils'

// The built-in parser ("naive") and untitled runs read as the general pipeline.
const pipelineAvatarName = (title?: string) =>
  !title || title.toLowerCase() === 'naive' ? 'General' : title

interface LogTableRowProps {
  item: LogTableItem
  activeTab: LogTabType
  onViewDetail: (item: LogTableItem) => void
  /** Shown in the Inspector. */
  active?: boolean
}

const CELL = 'px-space-base py-space-sm'

export function LogTableRow({
  item,
  activeTab,
  onViewDetail,
  active = false,
}: LogTableRowProps) {
  const { t } = useTranslation()
  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  return (
    <TableRow
      aria-current={active || undefined}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button, a')) return
        onViewDetail(item)
      }}
      className={cn('cursor-pointer', active && 'bg-accent-soft')}
    >
      <TableCell className={cn(CELL, 'pl-space-md')}>
        <span className="font-mono text-xs whitespace-nowrap text-fg-subtle">
          {item.id || '-'}
        </span>
      </TableCell>

      {isFileLogs && (
        <>
          <TableCell className={cn(CELL, 'max-w-60')}>
            <Tooltip content={<span>{item.document_name}</span>}>
              <div className="flex items-center gap-space-sm">
                <LogFileIcon suffix={item.document_suffix} />
                <span className="truncate text-sm text-fg">
                  {item.document_name || '-'}
                </span>
              </div>
            </Tooltip>
          </TableCell>
          <TableCell className={CELL}>
            {!item.source_from ||
            item.source_from === 'local' ||
            item.source_from === '' ? (
              <span className="inline-flex items-center gap-space-xs text-sm text-fg-muted">
                <MonitorUp
                  className="size-icon-sm text-fg-subtle"
                  aria-hidden="true"
                />
                {t('knowledge.logs.detail.localUpload')}
              </span>
            ) : (
              <span className="text-sm text-fg-muted capitalize">
                {item.source_from}
              </span>
            )}
          </TableCell>
          <TableCell className={CELL}>
            <div className="flex items-center gap-space-sm whitespace-nowrap">
              <EntityAvatar
                name={pipelineAvatarName(item.pipeline_title)}
                size="xs"
                shape="circle"
              />
              <span className="text-sm text-fg">
                {item.pipeline_title === 'naive'
                  ? 'general'
                  : item.pipeline_title || '-'}
              </span>
            </div>
          </TableCell>
        </>
      )}

      <TableCell className={CELL}>
        <span className="text-sm whitespace-nowrap text-fg-muted">
          {formatDate(item.process_begin_at || null)}
        </span>
      </TableCell>
      <TableCell className={CELL}>
        <span className="inline-flex items-center gap-space-sm text-sm whitespace-nowrap text-fg">
          {!isFileLogs &&
            (item.task_type === ProcessingType.KNOWLEDGE_GRAPH ||
              item.task_type === ProcessingType.LEGACY_KNOWLEDGE_GRAPH) && (
              <Network
                aria-hidden="true"
                className="size-icon-sm shrink-0 text-fg-muted"
              />
            )}
          {isFileLogs
            ? item.task_type || '-'
            : formatDatasetTaskType(item.task_type, t)}
        </span>
      </TableCell>
      <TableCell className={CELL}>
        <FileStatusBadge status={item.operation_status as RunningStatus} />
      </TableCell>
      <TableCell className={cn(CELL, 'w-px px-space-sm')}>
        <Tooltip content={t('knowledge.logs.table.viewDetail')}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onViewDetail(item)}
            aria-label={t('knowledge.logs.table.viewDetail')}
          >
            <PanelRight className="size-icon-sm" aria-hidden="true" />
          </Button>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

function formatDatasetTaskType(
  taskType: string | undefined,
  t: (key: string) => string,
) {
  const processingType = taskType as ProcessingType
  return ProcessingTypeI18nKey[processingType]
    ? t(ProcessingTypeI18nKey[processingType])
    : taskType || '-'
}
