import { useTranslation } from 'react-i18next'
import { Button, PageSizeSelector, Table, type Column } from '@/components/ui'
import { Checkbox } from '@/components/ui/checkbox'
import type { Document } from '@/types/api'
import { PAGE_SIZE_OPTIONS } from '../constants'
import type { DocumentListState } from '../types'

interface DocumentListPanelProps {
  listState: DocumentListState
  columns: Column<Document>[]
}

export function DocumentListPanel({
  listState,
  columns,
}: DocumentListPanelProps) {
  const { t } = useTranslation()

  if (listState.isLoading || listState.documents.length === 0) {
    return null
  }

  const totalPages = Math.ceil(listState.total / listState.pageSize)

  return (
    <div className="rounded-radius-lg shadow-elevation-low flex min-h-0 flex-1 flex-col overflow-hidden bg-background-surface">
      <div className="border-b border-border-default px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="gap-space-md flex min-w-0 items-center">
            <div className="gap-space-xs flex min-w-0 cursor-pointer items-center">
              <Checkbox
                aria-label={t('knowledge.documents.selectAll')}
                checked={listState.allSelected}
                onCheckedChange={(checked) =>
                  listState.selectAll(checked as boolean)
                }
              />
              <span className="whitespace-nowrap text-sm text-text-secondary">
                {t('knowledge.documents.selectAll')} (
                {listState.selectedDocs.size > 0
                  ? t('knowledge.documents.selectedCount', {
                      count: listState.selectedDocs.size,
                    })
                  : t('knowledge.documents.totalDocuments', {
                      count: listState.total,
                    })}
                )
              </span>
            </div>
          </div>
          <div className="text-sm text-text-tertiary">
            {t('knowledge.documents.displayCount', {
              visible: listState.documents.length,
              total: listState.total,
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Table<Document>
          columns={columns}
          data={listState.documents}
          rowKey="id"
          sortConfig={{
            field: listState.sortConfig.orderby,
            direction: listState.sortConfig.desc ? 'desc' : 'asc',
          }}
          onSort={(field, direction) => {
            listState.setSortConfig({
              orderby: field,
              desc: direction === 'desc',
            })
          }}
          striped
          hoverable
          className="min-w-full"
          tableLayout="fixed"
          stickyHeader
          wrapperClassName="overflow-visible"
        />
      </div>

      {listState.total > 0 && (
        <div className="shadow-elevation-high sticky bottom-0 border-t border-components-pagination-border bg-components-pagination-bg backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-sm text-components-pagination-text">
              {t('knowledge.documents.totalItems', {
                count: listState.total,
              })}
              {listState.selectedDocs.size > 0 &&
                ` • ${t('knowledge.documents.selectedCount', {
                  count: listState.selectedDocs.size,
                })}`}
            </div>

            <div className="flex items-center space-x-4">
              <PageSizeSelector
                pageSize={listState.pageSize}
                onChange={(size) => {
                  listState.setPageSize(size)
                  listState.setPage(1)
                }}
                options={PAGE_SIZE_OPTIONS}
              />

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => listState.setPage(listState.page - 1)}
                  disabled={listState.page <= 1}
                >
                  {t('knowledge.documents.previousPage')}
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    {
                      length: Math.min(5, totalPages),
                    },
                    (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (listState.page <= 3) {
                        pageNum = i + 1
                      } else if (listState.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = listState.page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            listState.page === pageNum ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => listState.setPage(pageNum)}
                          className="min-w-[32px]"
                        >
                          {pageNum}
                        </Button>
                      )
                    },
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => listState.setPage(listState.page + 1)}
                  disabled={listState.page >= totalPages}
                >
                  {t('knowledge.documents.nextPage')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
