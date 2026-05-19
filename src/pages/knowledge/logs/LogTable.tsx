import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LogTabType } from './constants'
import type { LogTableItem, PaginationState } from './types'
import { LogTablePagination } from './components/log-table-pagination'
import { LogTableRow } from './components/log-table-row'
import {
  LogTableEmptyState,
  LogTableSkeleton,
} from './components/log-table-state'

interface LogTableProps {
  data: LogTableItem[]
  isLoading?: boolean
  activeTab: LogTabType
  pagination: PaginationState
  onPaginationChange: (page: number, pageSize?: number) => void
  onViewDetail: (item: LogTableItem) => void
}

export function LogTable({
  data,
  isLoading,
  activeTab,
  pagination,
  onPaginationChange,
  onViewDetail,
}: LogTableProps) {
  const { t } = useTranslation()
  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  if (isLoading) {
    return <LogTableSkeleton />
  }

  if (!data || data.length === 0) {
    return <LogTableEmptyState />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-radius-lg overflow-hidden border border-border-default">
        <Table>
          <TableHeader>
            <TableRow className="bg-background-subtle">
              <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                ID
              </TableHead>
              {isFileLogs && (
                <>
                  <TableHead className="font-medium text-text-secondary">
                    {t('knowledge.logs.table.fileName')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                    {t('knowledge.logs.table.source')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                    {t('knowledge.logs.table.pipeline')}
                  </TableHead>
                </>
              )}
              <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                {t('knowledge.logs.table.startTime')}
              </TableHead>
              <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                {isFileLogs
                  ? t('knowledge.logs.table.taskType')
                  : t('knowledge.logs.table.processingType')}
              </TableHead>
              <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                {t('knowledge.logs.table.status')}
              </TableHead>
              <TableHead className="whitespace-nowrap font-medium text-text-secondary">
                {t('knowledge.logs.table.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <LogTableRow
                key={item.id}
                item={item}
                activeTab={activeTab}
                onViewDetail={onViewDetail}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <LogTablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={onPaginationChange}
      />
    </div>
  )
}
