'use client'

import { Clock3, Loader2 } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { useDataSourceLogs } from '@/hooks/use-datasource-request'
import { formatDate } from '@/lib/utils'
import { DataSourceStatus, type IDataSourceLog } from '../types'
import { DataSourceStatusBadge, DataSourceStatusIcon } from './status-display'

interface DataSourceLogsTableProps {
  state: ReturnType<typeof useDataSourceLogs>
}

function getLogSummary(t: TFunction, log: IDataSourceLog): string {
  switch (log.status) {
    case DataSourceStatus.SCHEDULED:
      return t('datasource.logSummaryScheduled')
    case DataSourceStatus.RUNNING:
      return t('datasource.logSummaryRunning')
    case DataSourceStatus.PAUSED:
      return t('datasource.logSummaryPaused')
    case DataSourceStatus.FAILED:
      return log.error_msg || t('datasource.logSummaryFailed')
    default:
      return t('datasource.logSummaryCompleted', {
        added: log.new_docs_indexed || 0,
        total: log.total_docs_indexed || 0,
        errors: log.error_count || 0,
      })
  }
}

function formatSyncCursor(log: IDataSourceLog): string {
  const cursor = log.poll_range_end || log.poll_range_start
  return cursor ? formatDate(cursor) : '-'
}

/**
 * Sync history. Statuses are normalized at the API boundary so numeric
 * RAGFlow task states and semantic states render consistently here.
 */
export function DataSourceLogsTable({ state }: DataSourceLogsTableProps) {
  const { t } = useTranslation()
  const { logs, total, isFetching, pagination, setPagination } = state

  if (isFetching && logs.length === 0) {
    return (
      <div className="py-space-xl flex items-center justify-center">
        <Loader2 className="size-icon-lg animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="gap-space-sm py-space-xl flex flex-col items-center justify-center text-center">
        <div className="rounded-radius-full flex h-12 w-12 items-center justify-center bg-components-page-state-icon-bg text-components-page-state-icon">
          <Clock3 className="size-icon-lg" />
        </div>
        <p className="text-sm font-medium text-text-primary">
          {t('datasource.noLogs')}
        </p>
        <p className="text-sm text-text-secondary">
          {t('datasource.noLogsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table wrapperClassName="rounded-radius-lg border border-border-subtle">
        <TableHeader className="bg-surface-secondary">
          <TableRow>
            <TableHead>{t('datasource.logUpdatedAt')}</TableHead>
            <TableHead>{t('datasource.logKnowledgeBase')}</TableHead>
            <TableHead>{t('datasource.logStatus')}</TableHead>
            <TableHead className="w-2/5">
              {t('datasource.logSummary')}
            </TableHead>
            <TableHead>{t('datasource.logCursor')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow
              key={log.id}
              className={
                log.status === DataSourceStatus.FAILED
                  ? 'bg-status-error-subtle'
                  : undefined
              }
            >
              <TableCell className="whitespace-nowrap text-text-secondary">
                {log.update_date ? formatDate(log.update_date) : '-'}
              </TableCell>
              <TableCell>
                <div className="gap-space-sm flex min-w-0 items-center">
                  <DataSourceStatusIcon status={log.status} />
                  <span className="truncate font-medium text-text-primary">
                    {log.kb_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <DataSourceStatusBadge status={log.status} />
              </TableCell>
              <TableCell className="whitespace-normal text-text-primary">
                {getLogSummary(t, log)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-text-secondary">
                {formatSyncCursor(log)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {total > pagination.pageSize ? (
        <div className="mt-space-base flex justify-end">
          <Pagination
            total={total}
            current={pagination.page}
            pageSize={pagination.pageSize}
            onChange={(page: number) =>
              setPagination({ page, pageSize: pagination.pageSize })
            }
          />
        </div>
      ) : null}
    </div>
  )
}
