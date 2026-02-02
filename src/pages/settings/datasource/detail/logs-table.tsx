'use client'

import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { useDataSourceLogs } from '@/hooks/use-datasource-request'
import { DataSourceStatus } from '../types'
import { cn } from '@/lib/utils'

interface DataSourceLogsTableProps {
  dataSourceId: string
  refreshFreq?: number
}

/**
 * 数据源同步日志表格
 */
export function DataSourceLogsTable({ dataSourceId, refreshFreq }: DataSourceLogsTableProps) {
  const { t } = useTranslation()
  const { logs, total, isFetching, pagination, setPagination } = useDataSourceLogs(
    dataSourceId,
    refreshFreq ? refreshFreq : false
  )

  // 获取状态图标
  const getStatusIcon = (status: DataSourceStatus) => {
    switch (status) {
      case DataSourceStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-status-success" />
      case DataSourceStatus.FAILED:
        return <AlertCircle className="w-4 h-4 text-status-error" />
      case DataSourceStatus.RUNNING:
        return <Loader2 className="w-4 h-4 text-status-info animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-text-tertiary" />
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status: DataSourceStatus) => {
    switch (status) {
      case DataSourceStatus.COMPLETED:
        return <Badge variant="success">{t('datasource.statusCompleted')}</Badge>
      case DataSourceStatus.FAILED:
        return <Badge variant="destructive">{t('datasource.statusFailed')}</Badge>
      case DataSourceStatus.RUNNING:
        return <Badge variant="default">{t('datasource.statusRunning')}</Badge>
      default:
        return <Badge variant="secondary">{t('datasource.statusPending')}</Badge>
    }
  }

  if (isFetching && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 border border-border rounded-radius-lg">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-border rounded-radius-lg">
        <Clock className="w-10 h-10 text-text-tertiary mb-2" />
        <p className="text-sm text-text-secondary">{t('datasource.noLogs')}</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-radius-lg overflow-hidden">
      {/* 表格头部 */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface-secondary text-sm font-medium text-text-secondary">
        <div className="col-span-3">{t('datasource.logKnowledgeBase')}</div>
        <div className="col-span-2">{t('datasource.logStatus')}</div>
        <div className="col-span-2">{t('datasource.logDocsIndexed')}</div>
        <div className="col-span-2">{t('datasource.logErrors')}</div>
        <div className="col-span-3">{t('datasource.logTime')}</div>
      </div>

      {/* 表格内容 */}
      <div className="divide-y divide-border">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              'grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-surface-secondary transition-colors',
              log.status === DataSourceStatus.FAILED && 'bg-status-error/5'
            )}
          >
            <div className="col-span-3 flex items-center gap-2">
              {getStatusIcon(log.status)}
              <span className="text-text-primary truncate">{log.kb_name}</span>
            </div>
            <div className="col-span-2">
              {getStatusBadge(log.status)}
            </div>
            <div className="col-span-2 text-text-primary">
              {log.new_docs_indexed}
            </div>
            <div className="col-span-2">
              {log.error_count > 0 ? (
                <span className="text-status-error">{log.error_count}</span>
              ) : (
                <span className="text-text-tertiary">0</span>
              )}
            </div>
            <div className="col-span-3 text-text-secondary">
              {log.poll_range_start && log.poll_range_end
                ? `${log.poll_range_start} - ${log.poll_range_end}`
                : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {total > pagination.pageSize && (
        <div className="px-4 py-3 border-t border-border">
          <Pagination
            total={total}
            current={pagination.page}
            pageSize={pagination.pageSize}
            onChange={(page, pageSize) => setPagination({ page, pageSize })}
          />
        </div>
      )}
    </div>
  )
}
