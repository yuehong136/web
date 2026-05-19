import { useCallback, useState } from 'react'
import type { LogTabType } from '../constants'
import type { LogDetailModalState, LogTableItem } from '../types'

export function useLogDetailModal(activeTab: LogTabType): LogDetailModalState {
  const [open, setOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogTableItem | null>(null)

  const openDetail = useCallback((item: LogTableItem) => {
    setSelectedLog(item)
    setOpen(true)
  }, [])

  const closeDetail = useCallback(() => {
    setOpen(false)
    setSelectedLog(null)
  }, [])

  return {
    open,
    selectedLog,
    activeTab,
    openDetail,
    closeDetail,
  }
}
