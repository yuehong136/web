import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pager } from '@/components/patterns'
import { cn } from '@/lib/utils'
import { KnowledgeSectionTemplate } from '../components/knowledge-section-template'
import { SectionFooter } from '../components/section-footer'
import { LogStatsCards } from './LogStatsCards'
import { LogTabFilter } from './LogTabFilter'
import { LogTable } from './LogTable'
import { LogLoadError } from './components/log-load-error'
import { useLogInspectorPanel } from './components/log-inspector'
import { PAGE_SIZE_OPTIONS } from './constants'
import { useKnowledgeLogsController } from './hooks'

export function KnowledgeLogsPage() {
  const { id } = useParams<{ id: string }>()
  return <KnowledgeLogsContent key={id} />
}

function KnowledgeLogsContent() {
  const { t } = useTranslation()
  const {
    activeTab,
    setActiveTab,
    stats,
    currentLogs,
    processedLogs,
    detailModal,
    handleRefresh,
  } = useKnowledgeLogsController()
  const inspector = useLogInspectorPanel(detailModal)
  const { pagination } = currentLogs

  return (
    <KnowledgeSectionTemplate
      title={t('knowledge.logs.title')}
      subline={
        stats.error ? null : (
          <LogStatsCards summary={stats.data} isLoading={stats.isLoading} />
        )
      }
      actions={
        <Button
          variant="ghost"
          onClick={handleRefresh}
          disabled={currentLogs.isLoading}
        >
          <RefreshCw
            className={cn(
              'size-icon-sm',
              currentLogs.isLoading && 'animate-spin',
            )}
            aria-hidden="true"
          />
          {t('knowledge.common.refresh')}
        </Button>
      }
      toolbar={
        <LogTabFilter
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchValue={currentLogs.searchString}
          onSearchChange={currentLogs.handleSearchChange}
          filterValue={currentLogs.filterValue}
          onFilterChange={currentLogs.handleFilterSubmit}
        />
      }
      inspector={inspector}
      bodyScroll="none"
    >
      {stats.error ? <LogLoadError onRetry={stats.refetch} /> : null}
      {currentLogs.error ? (
        <LogLoadError onRetry={currentLogs.refetch} />
      ) : (
        <>
          <div
            data-scroll-root="logs-body"
            className="scroll-area min-h-0 flex-1 overflow-y-auto"
          >
            <LogTable
              data={processedLogs}
              isLoading={currentLogs.isLoading}
              activeTab={activeTab}
              onViewDetail={detailModal.openDetail}
              activeId={
                detailModal.open ? detailModal.selectedLog?.id : undefined
              }
            />
          </div>
          {pagination.total > 0 ? (
            <SectionFooter>
              <Pager
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={(page) =>
                  currentLogs.handlePaginationChange(page)
                }
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(pageSize) =>
                  currentLogs.handlePaginationChange(1, pageSize)
                }
              />
            </SectionFooter>
          ) : null}
        </>
      )}
    </KnowledgeSectionTemplate>
  )
}
