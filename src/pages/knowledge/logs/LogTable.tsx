import React from 'react'
import {
  Eye,
  FileText,
  MonitorUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FileStatusBadge } from './FileStatusBadge'
import { LogTabType, RunningStatus, RunningStatusMap, ProcessingTypeMap, ProcessingType } from './constants'
import { formatDate } from './hooks'
import type { IFileLogItem } from '@/types/api'

// 扩展日志项类型，添加计算字段
interface LogTableItem extends Partial<IFileLogItem> {
  id: string
  operation_status: string
  status?: string
  statusName?: string
}

interface LogTableProps {
  data: LogTableItem[]
  isLoading?: boolean
  activeTab: LogTabType
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  onPaginationChange: (page: number, pageSize?: number) => void
  onViewDetail: (item: LogTableItem) => void
}

// 获取文件图标颜色
const getFileIconColor = (suffix?: string) => {
  const ext = suffix?.toLowerCase()
  if (!ext) return 'var(--color-text-tertiary)'
  if (['pdf'].includes(ext)) return 'var(--color-state-error)'
  if (['doc', 'docx'].includes(ext)) return 'var(--color-state-focus)'
  if (['xls', 'xlsx'].includes(ext)) return 'var(--color-state-success)'
  if (['ppt', 'pptx'].includes(ext)) return 'var(--color-state-warning)'
  if (['txt', 'md'].includes(ext)) return 'var(--color-text-secondary)'
  return 'var(--color-text-tertiary)'
}

// 根据字符串生成一致的颜色 - 使用语义化设计令牌
const getAvatarColors = (name: string): { bg: string; text: string } => {
  const colors = [
    { bg: 'var(--color-state-focus-10)', text: 'var(--color-state-focus)' },
    { bg: 'var(--color-state-success-10)', text: 'var(--color-state-success)' },
    { bg: 'var(--color-state-warning-10)', text: 'var(--color-state-warning)' },
    { bg: 'var(--color-state-error-10)', text: 'var(--color-state-error)' },
    { bg: 'var(--color-state-neutral-10)', text: 'var(--color-text-secondary)' },
  ]
  
  // 根据名称生成一致的索引
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// 获取首字母
const getInitials = (name: string): string => {
  if (!name) return 'G'
  // 如果是 naive，显示为 General 的 G
  if (name.toLowerCase() === 'naive') return 'G'
  // 取首字母大写
  return name.charAt(0).toUpperCase()
}

/**
 * 首字母头像组件
 */
const InitialsAvatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'sm' }) => {
  const colors = getAvatarColors(name || 'default')
  const initials = getInitials(name)
  
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium',
        size === 'sm' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {initials}
    </div>
  )
}

/**
 * 空状态组件
 */
const EmptyState: React.FC<{ message?: string }> = ({ message = '暂无数据' }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <FileText 
      className="w-12 h-12 mb-3 opacity-30"
      style={{ color: 'var(--color-text-tertiary)' }}
    />
    <p 
      className="text-sm"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {message}
    </p>
  </div>
)

/**
 * 加载状态骨架屏
 */
const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div 
        key={i} 
        className="h-12 rounded-lg animate-pulse"
        style={{ backgroundColor: 'var(--color-background-subtle)' }}
      />
    ))}
  </div>
)

/**
 * 分页组件
 */
const Pagination: React.FC<{
  page: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize?: number) => void
}> = ({ page, pageSize, total, onChange }) => {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div 
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        共 {total} 条记录，第 {page} / {totalPages || 1} 页
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

/**
 * 文件日志表格行
 */
const FileLogRow: React.FC<{
  item: LogTableItem
  onViewDetail: (item: LogTableItem) => void
}> = ({ item, onViewDetail }) => (
  <TableRow 
    className="group transition-colors"
    style={{ '--hover-bg': 'var(--color-background-subtle)' } as React.CSSProperties}
  >
    {/* ID列 - 显示完整ID */}
    <TableCell>
      <span 
        className="text-xs font-mono whitespace-nowrap"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {item.id || '-'}
      </span>
    </TableCell>
    
    {/* 文件名列 */}
    <TableCell className="max-w-[240px]">
      <Tooltip content={<span>{item.document_name}</span>}>
        <div className="flex items-center gap-2 cursor-default">
          <FileText 
            className="w-4 h-4 flex-shrink-0"
            style={{ color: getFileIconColor(item.document_suffix) }}
          />
          <span 
            className="truncate text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.document_name || '-'}
          </span>
        </div>
      </Tooltip>
    </TableCell>
    
    {/* 来源列 */}
    <TableCell>
      {(!item.source_from || item.source_from === 'local' || item.source_from === '') ? (
        <div 
          className="flex items-center justify-center w-7 h-7 rounded-full"
          style={{ backgroundColor: 'var(--color-state-focus-10)' }}
        >
          <MonitorUp 
            className="w-4 h-4"
            style={{ color: 'var(--color-state-focus)' }}
          />
        </div>
      ) : (
        <span 
          className="text-sm capitalize"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {item.source_from}
        </span>
      )}
    </TableCell>
    
    {/* 数据管道列 - 使用首字母头像 */}
    <TableCell>
      <div className="flex items-center gap-2 whitespace-nowrap">
        <InitialsAvatar name={item.pipeline_title || 'general'} />
        <span 
          className="text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {item.pipeline_title === 'naive' ? 'general' : item.pipeline_title || '-'}
        </span>
      </div>
    </TableCell>
    
    {/* 开始时间列 */}
    <TableCell>
      <span 
        className="text-sm whitespace-nowrap"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {formatDate(item.process_begin_at || null)}
      </span>
    </TableCell>
    
    {/* 任务类型列 */}
    <TableCell>
      <span 
        className="text-sm whitespace-nowrap"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {item.task_type || '-'}
      </span>
    </TableCell>
    
    {/* 状态列 */}
    <TableCell>
      <FileStatusBadge
        status={item.operation_status as RunningStatus}
        name={RunningStatusMap[item.operation_status as RunningStatus]}
      />
    </TableCell>
    
    {/* 操作列 */}
    <TableCell>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip content="查看详情">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </TableCell>
  </TableRow>
)

/**
 * 数据集日志表格行
 */
const DatasetLogRow: React.FC<{
  item: LogTableItem
  onViewDetail: (item: LogTableItem) => void
}> = ({ item, onViewDetail }) => (
  <TableRow 
    className="group transition-colors"
    style={{ '--hover-bg': 'var(--color-background-subtle)' } as React.CSSProperties}
  >
    {/* ID列 - 显示完整ID */}
    <TableCell>
      <span 
        className="text-xs font-mono whitespace-nowrap"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {item.id || '-'}
      </span>
    </TableCell>
    
    {/* 开始时间列 */}
    <TableCell>
      <span 
        className="text-sm whitespace-nowrap"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {formatDate(item.process_begin_at || null)}
      </span>
    </TableCell>
    
    {/* 处理类型列 */}
    <TableCell>
      <span 
        className="text-sm whitespace-nowrap"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {ProcessingTypeMap[item.task_type as ProcessingType] || item.task_type || '-'}
      </span>
    </TableCell>
    
    {/* 状态列 */}
    <TableCell>
      <FileStatusBadge
        status={item.operation_status as RunningStatus}
        name={RunningStatusMap[item.operation_status as RunningStatus]}
      />
    </TableCell>
    
    {/* 操作列 */}
    <TableCell>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip content="查看详情">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onViewDetail(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </TableCell>
  </TableRow>
)

/**
 * 日志表格组件
 */
const LogTable: React.FC<LogTableProps> = ({
  data,
  isLoading,
  activeTab,
  pagination,
  onPaginationChange,
  onViewDetail,
}) => {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (!data || data.length === 0) {
    return <EmptyState />
  }

  const isFileLogs = activeTab === LogTabType.FILE_LOGS

  return (
    <div className="space-y-4">
      <div 
        className="rounded-lg overflow-hidden"
        style={{
          borderWidth: '1px',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <Table>
          <TableHeader>
            <TableRow 
              style={{ backgroundColor: 'var(--color-background-subtle)' }}
            >
              <TableHead 
                className="font-medium whitespace-nowrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ID
              </TableHead>
              {isFileLogs && (
                <>
                  <TableHead 
                    className="font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    文件名
                  </TableHead>
                  <TableHead 
                    className="font-medium whitespace-nowrap"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    来源
                  </TableHead>
                  <TableHead 
                    className="font-medium whitespace-nowrap"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    数据管道
                  </TableHead>
                </>
              )}
              <TableHead 
                className="font-medium whitespace-nowrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                开始时间
              </TableHead>
              <TableHead 
                className="font-medium whitespace-nowrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {isFileLogs ? '任务类型' : '处理类型'}
              </TableHead>
              <TableHead 
                className="font-medium whitespace-nowrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                状态
              </TableHead>
              <TableHead 
                className="font-medium whitespace-nowrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              isFileLogs ? (
                <FileLogRow key={item.id} item={item} onViewDetail={onViewDetail} />
              ) : (
                <DatasetLogRow key={item.id} item={item} onViewDetail={onViewDetail} />
              )
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onChange={onPaginationChange}
      />
    </div>
  )
}

export { LogTable }
export default LogTable
export type { LogTableItem }
