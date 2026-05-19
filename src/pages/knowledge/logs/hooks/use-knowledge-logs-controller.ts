import { useCallback, useMemo, useState } from 'react'
import { LogTabType } from '../constants'
import { useLogDetailModal } from './use-log-detail-modal'
import { useLogListState } from './use-log-list-state'
import { useLogStats } from './use-log-stats'

export function useKnowledgeLogsController() {
  const [activeTab, setActiveTab] = useState<LogTabType>(LogTabType.FILE_LOGS)
  const stats = useLogStats()
  const fileLogs = useLogListState(
    LogTabType.FILE_LOGS,
    activeTab === LogTabType.FILE_LOGS,
  )
  const datasetLogs = useLogListState(
    LogTabType.DATASET_LOGS,
    activeTab === LogTabType.DATASET_LOGS,
  )
  const detailModal = useLogDetailModal(activeTab)
  const currentLogs =
    activeTab === LogTabType.FILE_LOGS ? fileLogs : datasetLogs

  const handleRefresh = useCallback(() => {
    stats.refetch()
    currentLogs.refetch()
  }, [currentLogs, stats])

  const processedLogs = useMemo(
    () =>
      (currentLogs.data?.logs || []).map((log) => ({
        ...log,
        statusName: log.operation_status,
      })),
    [currentLogs.data?.logs],
  )

  const totalFiles = useMemo(() => {
    if (activeTab === LogTabType.FILE_LOGS) {
      return currentLogs.pagination.total
    }
    return fileLogs.pagination.total
  }, [activeTab, currentLogs.pagination.total, fileLogs.pagination.total])

  return {
    activeTab,
    setActiveTab,
    stats,
    currentLogs,
    processedLogs,
    totalFiles,
    detailModal,
    handleRefresh,
  }
}
