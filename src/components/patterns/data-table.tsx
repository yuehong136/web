import type { MouseEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
  /** CSS width for fixed columns, e.g. '7rem'. The flexible column omits it. */
  width?: string
  align?: 'start' | 'center' | 'end'
  /** Hide the column below this breakpoint to keep narrow screens readable. */
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface DataTableSelection<T> {
  selectedIds: readonly string[]
  /** Receives the full next selection, including ids kept from other pages. */
  onSelectedIdsChange: (ids: string[]) => void
  /** Checkbox label for a row, e.g. "Select report.pdf". */
  rowLabel: (row: T) => string
  /** Header checkbox label; defaults to "Select all rows on this page". */
  allLabel?: string
}

export interface DataTableProps<T> {
  /** Accessible table name. */
  label: string
  columns: DataTableColumn<T>[]
  rows: readonly T[]
  getRowId: (row: T) => string
  selection?: DataTableSelection<T>
  /** Trailing per-row controls (icon buttons, an ActionMenu). */
  rowActions?: (row: T) => ReactNode
  /**
   * Pointer shortcut for opening a row (e.g. into the Inspector). Keyboard
   * users need the same action on a control inside a cell.
   */
  onRowClick?: (row: T) => void
  /** The row shown in an open Inspector. */
  activeRowId?: string
  /** Shown in place of the body when there are no rows. */
  emptyState?: ReactNode
  density?: 'default' | 'compact'
  /** Keep the header visible while the body scrolls (default true). */
  stickyHeader?: boolean
  className?: string
}

const HIDE = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}
const ALIGN = { start: 'text-left', center: 'text-center', end: 'text-right' }
const INTERACTIVE =
  'a, button, input, select, textarea, label, [role="checkbox"], [role="menuitem"], [contenteditable="true"]'

/**
 * Column-configured table on ui/table with page-scoped selection, row actions
 * and an empty state. Rows are 44px (36px compact); numbers are tabular.
 */
export function DataTable<T>({
  label,
  columns,
  rows,
  getRowId,
  selection,
  rowActions,
  onRowClick,
  activeRowId,
  emptyState,
  density = 'default',
  stickyHeader = true,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const ids = rows.map(getRowId)
  const selected = new Set(selection?.selectedIds ?? [])
  const selectedOnPage = ids.filter((id) => selected.has(id)).length
  const allSelected = ids.length > 0 && selectedOnPage === ids.length
  const span = columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0)
  const cellPadding =
    density === 'compact'
      ? 'px-space-base py-space-xs'
      : 'px-space-base py-space-sm'

  const toggleAll = () => {
    if (!selection) return
    const visible = new Set(ids)
    selection.onSelectedIdsChange(
      allSelected
        ? selection.selectedIds.filter((id) => !visible.has(id))
        : [...new Set([...selection.selectedIds, ...ids])],
    )
  }
  const toggle = (id: string, checked: boolean) => {
    if (!selection) return
    selection.onSelectedIdsChange(
      checked
        ? [...new Set([...selection.selectedIds, id])]
        : selection.selectedIds.filter((item) => item !== id),
    )
  }
  const rowClick = (row: T) => (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return
    onRowClick?.(row)
  }

  return (
    <Table
      aria-label={label}
      data-slot="data-table"
      wrapperClassName={cn('min-w-0', className)}
    >
      <TableHeader
        className={cn(
          stickyHeader && 'sticky top-0 z-10 bg-background-surface',
        )}
      >
        <TableRow className="hover:bg-transparent">
          {selection ? (
            <TableHead className="h-auto w-10 py-space-xs pr-0 pl-space-md">
              <Checkbox
                aria-label={
                  selection.allLabel ?? t('common.patterns.table.selectAll')
                }
                checked={allSelected}
                indeterminate={selectedOnPage > 0 && !allSelected}
                disabled={!ids.length}
                onCheckedChange={toggleAll}
              />
            </TableHead>
          ) : null}
          {columns.map((column, index) => (
            <TableHead
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
              className={cn(
                'h-auto px-space-base py-space-xs whitespace-nowrap',
                index === 0 && !selection && 'pl-space-md',
                ALIGN[column.align ?? 'start'],
                column.hideBelow && HIDE[column.hideBelow],
              )}
            >
              {column.header}
            </TableHead>
          ))}
          {rowActions ? (
            <TableHead className="h-auto w-px px-space-sm py-space-xs">
              <span className="sr-only">
                {t('common.patterns.table.actions')}
              </span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={span} className="p-0">
              {emptyState ?? (
                <p className="px-space-md py-space-lg text-center text-sm text-text-tertiary">
                  {t('common.noData')}
                </p>
              )}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => {
            const id = ids[index]
            const isSelected = selected.has(id)
            const isActive = activeRowId === id
            return (
              <TableRow
                key={id}
                data-state={isSelected ? 'selected' : undefined}
                aria-current={isActive || undefined}
                onClick={onRowClick ? rowClick(row) : undefined}
                className={cn(
                  'group/row',
                  isActive && 'bg-state-selected-bg',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {selection ? (
                  <TableCell
                    className={cn(cellPadding, 'w-10 pr-0 pl-space-md')}
                  >
                    <Checkbox
                      aria-label={selection.rowLabel(row)}
                      checked={isSelected}
                      onCheckedChange={(value) => toggle(id, value === true)}
                    />
                  </TableCell>
                ) : null}
                {columns.map((column, columnIndex) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      cellPadding,
                      'h-[calc(var(--control-height-sm)+2*var(--space-sm))] text-text-secondary tabular-nums',
                      density === 'compact' &&
                        'h-[calc(var(--control-height-sm)+2*var(--space-xs))]',
                      columnIndex === 0 && !selection && 'pl-space-md',
                      ALIGN[column.align ?? 'start'],
                      column.hideBelow && HIDE[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.cell(row, index)}
                  </TableCell>
                ))}
                {rowActions ? (
                  <TableCell className={cn(cellPadding, 'w-px px-space-sm')}>
                    <div className="flex items-center justify-end gap-space-2xs whitespace-nowrap">
                      {rowActions(row)}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
