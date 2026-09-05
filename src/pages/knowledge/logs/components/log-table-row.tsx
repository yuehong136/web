import { useTranslation } from 'react-i18next'
import { Eye, MonitorUp } from 'lucide-react'
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
import { LogInitialsAvatar } from './log-initials-avatar'

interface LogTableRowProps {
  item: LogTableItem
  activeTab: LogTabType
  onViewDetail: (item: LogTableItem) => void
}

export function LogTableRow({
  item,
  activeTab,
  onViewDetail,
}: LogTableRowProps) {
  const { t } = useTranslation()
  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  return (
    <TableRow className="group transition-colors hover:bg-background-subtle">
      <TableCell>
        <span className="whitespace-nowrap font-mono text-xs text-text-tertiary">
          {item.id || '-'}
        </span>
      </TableCell>

      {isFileLogs && (
        <>
          <TableCell className="max-w-[240px]">
            <Tooltip content={<span>{item.document_name}</span>}>
              <div className="flex cursor-default items-center gap-2">
                <LogFileIcon suffix={item.document_suffix} />
                <span className="truncate text-sm text-text-primary">
                  {item.document_name || '-'}
                </span>
              </div>
            </Tooltip>
          </TableCell>
          <TableCell>
            {!item.source_from ||
            item.source_from === 'local' ||
            item.source_from === '' ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-state-focus-10">
                <MonitorUp className="h-4 w-4 text-state-focus" />
              </div>
            ) : (
              <span className="text-sm capitalize text-text-secondary">
                {item.source_from}
              </span>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <LogInitialsAvatar name={item.pipeline_title || 'general'} />
              <span className="text-sm text-text-primary">
                {item.pipeline_title === 'naive'
                  ? 'general'
                  : item.pipeline_title || '-'}
              </span>
            </div>
          </TableCell>
        </>
      )}

      <TableCell>
        <span className="whitespace-nowrap text-sm text-text-secondary">
          {formatDate(item.process_begin_at || null)}
        </span>
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-sm text-text-primary">
          {isFileLogs
            ? item.task_type || '-'
            : formatDatasetTaskType(item.task_type, t)}
        </span>
      </TableCell>
      <TableCell>
        <FileStatusBadge status={item.operation_status as RunningStatus} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Tooltip content={t('knowledge.logs.table.viewDetail')}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewDetail(item)}
              aria-label={t('knowledge.logs.table.viewDetail')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
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
