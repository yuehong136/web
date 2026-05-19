import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListPageTemplate } from '@/components/page-templates'
import { LogStatsCards } from './LogStatsCards'
import { LogTabFilter } from './LogTabFilter'
import { LogTable } from './LogTable'
import { LogDetailModal } from './LogDetailModal'
import { useKnowledgeLogsController } from './hooks'

export function KnowledgeLogsPage() {
  const { t } = useTranslation()
  const {
    activeTab,
    setActiveTab,
    stats,
    currentLogs,
    processedLogs,
    totalFiles,
    detailModal,
    handleRefresh,
  } = useKnowledgeLogsController()

  return (
    <ListPageTemplate
      title={t('knowledge.logs.title')}
      description={t('knowledge.logs.description')}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={currentLogs.isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${currentLogs.isLoading ? 'animate-spin' : ''}`}
          />
          {t('knowledge.common.refresh')}
        </Button>
      }
      stats={
        <LogStatsCards
          totalFiles={totalFiles}
          downloading={stats.data.downloaded || 0}
          downloadSuccess={stats.data.downloaded || 0}
          downloadFailed={0}
          processing={stats.data.processing || 0}
          processSuccess={stats.data.finished || 0}
          processFailed={stats.data.failed || 0}
          isLoading={stats.isLoading}
        />
      }
    >
      <div className="rounded-radius-xl p-space-lg border border-components-console-border bg-components-console-surface">
        <LogTabFilter
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchValue={currentLogs.searchString}
          onSearchChange={currentLogs.handleSearchChange}
          filterValue={currentLogs.filterValue}
          onFilterChange={currentLogs.handleFilterSubmit}
        />

        <LogTable
          data={processedLogs}
          isLoading={currentLogs.isLoading}
          activeTab={activeTab}
          pagination={currentLogs.pagination}
          onPaginationChange={currentLogs.handlePaginationChange}
          onViewDetail={detailModal.openDetail}
        />
      </div>

      <LogDetailModal
        open={detailModal.open}
        onClose={detailModal.closeDetail}
        logInfo={detailModal.selectedLog}
        activeTab={detailModal.activeTab}
      />
    </ListPageTemplate>
  )
}
