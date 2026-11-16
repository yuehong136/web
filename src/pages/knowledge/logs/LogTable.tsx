import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { LogTabType } from './constants'
import type { LogTableItem } from './types'
import { LogTableRow } from './components/log-table-row'
import {
  LogTableEmptyState,
  LogTableSkeleton,
} from './components/log-table-state'

interface LogTableProps {
  data: LogTableItem[]
  isLoading?: boolean
  activeTab: LogTabType
  onViewDetail: (item: LogTableItem) => void
  /** The log shown in the Inspector. */
  activeId?: string
}

/** File or dataset log rows; the page footer owns the pager. */
export function LogTable({
  data,
  isLoading,
  activeTab,
  onViewDetail,
  activeId,
}: LogTableProps) {
  const { t } = useTranslation()
  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  if (isLoading) {
    return <LogTableSkeleton />
  }

  if (!data || data.length === 0) {
    return <LogTableEmptyState />
  }

  const head = 'h-auto px-space-base py-space-xs whitespace-nowrap'
  return (
    <Table aria-label={t(`knowledge.logs.tabs.${activeTab}`)}>
      <TableHeader className="sticky top-0 z-10 bg-background-surface">
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(head, 'pl-space-md')}>
            {t('knowledge.logs.table.id')}
          </TableHead>
          {isFileLogs && (
            <>
              <TableHead className={head}>
                {t('knowledge.logs.table.fileName')}
              </TableHead>
              <TableHead className={head}>
                {t('knowledge.logs.table.source')}
              </TableHead>
              <TableHead className={head}>
                {t('knowledge.logs.table.pipeline')}
              </TableHead>
            </>
          )}
          <TableHead className={head}>
            {t('knowledge.logs.table.startTime')}
          </TableHead>
          <TableHead className={head}>
            {isFileLogs
              ? t('knowledge.logs.table.taskType')
              : t('knowledge.logs.table.processingType')}
          </TableHead>
          <TableHead className={head}>
            {t('knowledge.logs.table.status')}
          </TableHead>
          <TableHead className={cn(head, 'w-px')}>
            <span className="sr-only">{t('knowledge.logs.table.actions')}</span>
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
            active={item.id === activeId}
          />
        ))}
      </TableBody>
    </Table>
  )
}
