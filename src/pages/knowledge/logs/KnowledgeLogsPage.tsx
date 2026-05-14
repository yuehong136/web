import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListPageTemplate } from '@/components/page-templates'
import { LogStatsCards } from './LogStatsCards'
import { LogTabFilter } from './LogTabFilter'
import { LogTable } from './LogTable'
import type { LogTableItem } from './LogTable'
import { LogDetailModal } from './LogDetailModal'
import {
  useFetchLogStats,
  useFetchFileLogs,
  useFetchDatasetLogs,
} from './hooks'
import { LogTabType } from './constants'

/**
 * 知识库日志页面
 * 展示文件处理日志和数据集日志，包含统计概览、筛选搜索和详情查看功能
 */
const KnowledgeLogsPage: React.FC = () => {
  const { t } = useTranslation()
  // 当前激活的Tab
  const [activeTab, setActiveTab] = useState<LogTabType>(LogTabType.FILE_LOGS)

  // 日志详情模态框状态
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogTableItem | null>(null)

  // 获取统计数据
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useFetchLogStats()

  // 获取文件日志
  const fileLogsHook = useFetchFileLogs(activeTab === LogTabType.FILE_LOGS)

  // 获取数据集日志
  const datasetLogsHook = useFetchDatasetLogs(
    activeTab === LogTabType.DATASET_LOGS,
  )

  // 根据当前Tab选择对应的hook数据
  const currentLogsHook =
    activeTab === LogTabType.FILE_LOGS ? fileLogsHook : datasetLogsHook

  // 处理Tab切换
  const handleTabChange = useCallback((tab: LogTabType) => {
    setActiveTab(tab)
  }, [])

  // 处理查看详情
  const handleViewDetail = useCallback((item: LogTableItem) => {
    setSelectedLog(item)
    setDetailModalOpen(true)
  }, [])

  // 处理关闭详情模态框
  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false)
    setSelectedLog(null)
  }, [])

  // 处理刷新
  const handleRefresh = useCallback(() => {
    refetchStats()
    currentLogsHook.refetch()
  }, [refetchStats, currentLogsHook])

  // 处理日志数据，保留后端状态枚举，由展示组件负责本地化。
  const processedLogs = useMemo(() => {
    const logs = currentLogsHook.data?.logs || []
    return logs.map((log) => ({
      ...log,
      statusName: log.operation_status,
    }))
  }, [currentLogsHook.data?.logs])

  // 计算文件总数（从日志数据中获取）
  const totalFiles = useMemo(() => {
    if (activeTab === LogTabType.FILE_LOGS) {
      return currentLogsHook.pagination.total
    }
    return fileLogsHook.pagination.total
  }, [
    activeTab,
    currentLogsHook.pagination.total,
    fileLogsHook.pagination.total,
  ])

  return (
    <ListPageTemplate
      title={t('knowledge.logs.title')}
      description={t('knowledge.logs.description')}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={currentLogsHook.isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${currentLogsHook.isLoading ? 'animate-spin' : ''}`}
          />
          {t('knowledge.common.refresh')}
        </Button>
      }
      stats={
        <LogStatsCards
          totalFiles={totalFiles}
          downloading={statsData.downloaded || 0}
          downloadSuccess={statsData.downloaded || 0}
          downloadFailed={0}
          processing={statsData.processing || 0}
          processSuccess={statsData.finished || 0}
          processFailed={statsData.failed || 0}
          isLoading={statsLoading}
        />
      }
    >
      {/* 主内容区域 */}
      <div className="rounded-radius-xl p-space-lg border border-components-console-border bg-components-console-surface">
        {/* Tab切换和筛选 */}
        <LogTabFilter
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchValue={currentLogsHook.searchString}
          onSearchChange={currentLogsHook.handleSearchChange}
          filterValue={currentLogsHook.filterValue}
          onFilterChange={currentLogsHook.handleFilterSubmit}
        />

        {/* 日志表格 */}
        <LogTable
          data={processedLogs}
          isLoading={currentLogsHook.isLoading}
          activeTab={activeTab}
          pagination={currentLogsHook.pagination}
          onPaginationChange={currentLogsHook.handlePaginationChange}
          onViewDetail={handleViewDetail}
        />
      </div>

      {/* 日志详情模态框 */}
      <LogDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        logInfo={selectedLog}
        activeTab={activeTab}
      />
    </ListPageTemplate>
  )
}

export { KnowledgeLogsPage }
export default KnowledgeLogsPage
