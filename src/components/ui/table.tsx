import * as React from 'react'
import { cn } from '@/lib/utils'

type SortDirection = 'asc' | 'desc'

export interface Column<T = any> {
  key: string
  title?: React.ReactNode
  dataIndex?: string | keyof T
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  sortable?: boolean
  ellipsis?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
}

interface SortConfig {
  field?: string
  direction?: SortDirection
}

export interface DataTableProps<T> extends Omit<
  React.TableHTMLAttributes<HTMLTableElement>,
  'children'
> {
  columns?: Column<T>[]
  data?: T[]
  dataSource?: T[]
  loading?: boolean
  rowKey?: keyof T | ((record: T) => React.Key) | string
  sortConfig?: SortConfig
  onSort?: (field: string, direction: SortDirection) => void
  onRow?: (
    record: T,
    index: number,
  ) => React.HTMLAttributes<HTMLTableRowElement>
  striped?: boolean
  hoverable?: boolean
  stickyHeader?: boolean
  tableLayout?: 'auto' | 'fixed'
  wrapperClassName?: string
  children?: React.ReactNode
}

function getByPath(record: any, path?: string | number) {
  if (path === undefined) return record
  if (typeof path === 'number') return record?.[path]
  if (typeof path !== 'string') return record?.[String(path)]
  if (!path) return record
  if (path.indexOf('.') === -1) return record?.[path]
  return path
    .split('.')
    .reduce((obj, key) => (obj == null ? obj : obj[key]), record)
}

function resolveRowKey<T>(
  record: T,
  rowKey: DataTableProps<T>['rowKey'],
  index: number,
): React.Key {
  if (typeof rowKey === 'function') return rowKey(record)
  if (typeof rowKey === 'string') return (record as any)?.[rowKey] ?? index
  if (rowKey) return (record as any)?.[String(rowKey)] ?? index
  return (record as any)?.id ?? index
}

const TableInner = <T,>(
  {
    columns,
    data,
    dataSource,
    loading: _loading,
    rowKey,
    sortConfig,
    onSort,
    onRow,
    striped,
    hoverable,
    stickyHeader,
    tableLayout,
    wrapperClassName,
    className,
    children,
    ...htmlProps
  }: DataTableProps<T>,
  ref: React.Ref<HTMLTableElement>,
) => {
  const rows = (data ?? dataSource) as T[] | undefined
  const tableClasses = cn(
    'w-full caption-bottom text-sm',
    tableLayout === 'fixed' && 'table-fixed',
    className,
  )

  if (Array.isArray(columns) && Array.isArray(rows)) {
    return (
      <div className={cn('relative w-full overflow-auto', wrapperClassName)}>
        <table ref={ref} className={tableClasses} {...htmlProps}>
          <colgroup>
            {columns.map((col) => {
              const style: React.CSSProperties = {}
              if (col.width !== undefined) style.width = col.width
              if (col.minWidth !== undefined) style.minWidth = col.minWidth
              return <col key={col.key} style={style} />
            })}
          </colgroup>
          <thead
            className={cn(
              '[&_tr]:border-b',
              stickyHeader && 'sticky top-0 z-20 bg-background-surface',
            )}
          >
            <tr>
              {columns.map((col) => {
                const field = String(col.dataIndex ?? col.key)
                const isActive = sortConfig?.field === field
                const direction = sortConfig?.direction ?? 'asc'
                const thClasses = cn(
                  'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                  stickyHeader && 'bg-background-surface',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                )
                const style: React.CSSProperties = {}
                if (col.width !== undefined) style.width = col.width
                if (col.minWidth !== undefined) style.minWidth = col.minWidth

                const handleSort = () => {
                  if (!onSort || !col.sortable) return
                  const next: SortDirection = isActive
                    ? direction === 'asc'
                      ? 'desc'
                      : 'asc'
                    : 'asc'
                  onSort(field, next)
                }

                return (
                  <th
                    key={col.key}
                    className={thClasses}
                    style={style}
                    onClick={col.sortable && onSort ? handleSort : undefined}
                  >
                    <span
                      className={cn(
                        col.sortable && onSort
                          ? 'inline-flex cursor-pointer select-none items-center gap-1'
                          : undefined,
                      )}
                    >
                      {col.title ?? field}
                      {col.sortable && onSort && (
                        <span className="text-xs opacity-70">
                          {isActive ? (direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className={cn('[&_tr:last-child]:border-0')}>
            {rows.map((record, index) => {
              const rowAttrs = onRow ? onRow(record, index) : undefined
              const rowClass = cn(
                'border-b transition-colors',
                hoverable ? 'hover:bg-muted/50' : undefined,
                striped ? 'odd:bg-muted/30' : undefined,
                rowAttrs?.className,
              )
              const rowKeyValue = resolveRowKey(record, rowKey, index)
              const { className: _rowClassName, ...restRowAttrs } =
                rowAttrs || {}
              return (
                <tr key={rowKeyValue} className={rowClass} {...restRowAttrs}>
                  {columns.map((col) => {
                    const tdClasses = cn(
                      'p-4 align-middle',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )
                    const style: React.CSSProperties = {}
                    if (col.width !== undefined) style.width = col.width
                    if (col.minWidth !== undefined)
                      style.minWidth = col.minWidth
                    const raw = getByPath(record as any, col.dataIndex as any)
                    const content = col.render
                      ? col.render(raw, record, index)
                      : (raw ?? '')
                    return (
                      <td key={col.key} className={tdClasses} style={style}>
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full overflow-auto', wrapperClassName)}>
      <table ref={ref} className={tableClasses} {...htmlProps}>
        {children}
      </table>
    </div>
  )
}

const Table = React.forwardRef(TableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLTableElement> },
) => React.ReactNode
;(Table as React.FC).displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
      className,
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'hover:bg-muted/50 border-b transition-colors data-[state=selected]:bg-muted',
      className,
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
