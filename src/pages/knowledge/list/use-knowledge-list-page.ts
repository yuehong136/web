import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import type { KnowledgeBase } from '@/types/api'
import { DEFAULT_PAGE_SIZE } from './constants'
import { useQuickEdit } from './use-quick-edit'
import { formatKnowledgeTime, getStatusClassName } from './utils'
import type { KnowledgeTimeFormat, KnowledgeViewMode } from './types'

export const useKnowledgeListPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    deleteKnowledgeBase,
    isLoading,
    knowledgeBases,
    loadKnowledgeBases,
    searchQuery,
    setSearchQuery,
    total,
  } = useKnowledgeStore()
  const { addNotification } = useUIStore()

  const [viewMode, setViewMode] = useState<KnowledgeViewMode>('grid')
  const [selectedBases, setSelectedBases] = useState<string[]>([])
  const [sortBy] = useState<'create_time' | 'update_time' | 'name' | 'doc_num'>(
    'update_time',
  )
  const [sortDesc, setSortDesc] = useState(true)
  const [timeFormat, setTimeFormat] = useState<KnowledgeTimeFormat>('detailed')
  const [editingKnowledgeBase, setEditingKnowledgeBase] =
    useState<KnowledgeBase | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const loadCurrentPage = useCallback(() => {
    // 仅传后端能准确分页/计数的条件：关键词搜索 + 排序 + 分页
    loadKnowledgeBases({
      page: currentPage,
      page_size: pageSize,
      orderby: sortBy,
      desc: sortDesc,
      keywords: searchQuery,
    })
  }, [currentPage, loadKnowledgeBases, pageSize, searchQuery, sortBy, sortDesc])

  useEffect(() => {
    loadCurrentPage()
  }, [loadCurrentPage])

  useEffect(() => {
    setCurrentPage((prevPage) => (prevPage === 1 ? prevPage : 1))
  }, [searchQuery])

  const totalPages = Math.ceil(total / pageSize)

  const timeFormatOptions = useMemo(
    () => [
      { value: 'detailed', label: t('knowledge.list.timeFormat.detailed') },
      { value: 'compact', label: t('knowledge.list.timeFormat.compact') },
      { value: 'relative', label: t('knowledge.list.timeFormat.relative') },
    ],
    [t],
  )

  // 列表只保留后端可信筛选：关键词搜索。是否处于筛选态即「有搜索词」。
  const hasActiveSearch = searchQuery.trim() !== ''

  const formatTime = useCallback(
    (timestamp: number) => formatKnowledgeTime(timestamp, timeFormat),
    [timeFormat],
  )

  const getStatusText = useCallback(
    (knowledgeBase: KnowledgeBase) => {
      if (knowledgeBase.doc_num > 0) {
        return t('knowledge.list.status.hasContent')
      }

      if (knowledgeBase.permission === 'me') {
        return t('knowledge.list.status.empty')
      }

      return t('knowledge.list.status.unknown')
    },
    [t],
  )

  const handleCreateSuccess = useCallback(
    (knowledgeBaseId: string) => {
      loadCurrentPage()
      navigate(`${ROUTES.KNOWLEDGE}/${knowledgeBaseId}`)
    },
    [loadCurrentPage, navigate],
  )

  const handleView = useCallback(
    (knowledgeBaseId: string) => {
      navigate(`${ROUTES.KNOWLEDGE}/${knowledgeBaseId}`)
    },
    [navigate],
  )

  const handleDelete = useCallback(
    async (knowledgeBaseId: string) => {
      if (!window.confirm(t('knowledge.list.confirm.deleteSingle'))) {
        return
      }

      try {
        await deleteKnowledgeBase(knowledgeBaseId)
        addNotification({
          type: 'success',
          title: t('knowledge.list.notifications.deleteSuccessTitle'),
          message: t('knowledge.list.notifications.deleteSuccessMessage'),
        })
      } catch {
        addNotification({
          type: 'error',
          title: t('knowledge.list.notifications.deleteErrorTitle'),
          message: t('knowledge.list.notifications.deleteErrorMessage'),
        })
      }
    },
    [addNotification, deleteKnowledgeBase, t],
  )

  const handleBulkDelete = useCallback(async () => {
    if (selectedBases.length === 0) {
      return
    }

    if (
      !window.confirm(
        t('knowledge.list.confirm.deleteBulk', {
          count: selectedBases.length,
        }),
      )
    ) {
      return
    }

    try {
      await Promise.all(selectedBases.map((id) => deleteKnowledgeBase(id)))
      setSelectedBases([])
      addNotification({
        type: 'success',
        title: t('knowledge.list.notifications.bulkDeleteSuccessTitle'),
        message: t('knowledge.list.notifications.bulkDeleteSuccessMessage', {
          count: selectedBases.length,
        }),
      })
    } catch {
      addNotification({
        type: 'error',
        title: t('knowledge.list.notifications.bulkDeleteErrorTitle'),
        message: t('knowledge.list.notifications.deleteErrorMessage'),
      })
    }
  }, [addNotification, deleteKnowledgeBase, selectedBases, t])

  const { handleQuickEditSubmit, isQuickEditSubmitting } = useQuickEdit({
    editingKnowledgeBase,
    onUpdated: () => setEditingKnowledgeBase(null),
  })

  const toggleSelectedBase = useCallback((knowledgeBaseId: string) => {
    setSelectedBases((prev) =>
      prev.includes(knowledgeBaseId)
        ? prev.filter((id) => id !== knowledgeBaseId)
        : [...prev, knowledgeBaseId],
    )
  }, [])

  const toggleGridSelection = useCallback(
    (knowledgeBaseId: string, checked: boolean) => {
      setSelectedBases((prev) =>
        checked
          ? [...prev, knowledgeBaseId]
          : prev.filter((id) => id !== knowledgeBaseId),
      )
    },
    [],
  )

  const toggleSelectAll = useCallback(() => {
    setSelectedBases((prev) =>
      prev.length === knowledgeBases.length
        ? []
        : knowledgeBases.map((knowledgeBase) => knowledgeBase.id),
    )
  }, [knowledgeBases])

  return {
    currentPage,
    editingKnowledgeBase,
    formatTime,
    getStatusClassName,
    getStatusText,
    handleBulkDelete,
    handleCreateSuccess,
    handleDelete,
    handleQuickEditSubmit,
    handleView,
    hasActiveSearch,
    isLoading,
    isQuickEditSubmitting,
    knowledgeBases,
    searchQuery,
    selectedBases,
    setCurrentPage,
    setEditingKnowledgeBase,
    setPageSize,
    setSearchQuery,
    setShowCreateModal,
    setSortDesc,
    setTimeFormat,
    setViewMode,
    showCreateModal,
    sortDesc,
    t,
    timeFormat,
    timeFormatOptions,
    toggleGridSelection,
    toggleSelectedBase,
    toggleSelectAll,
    total,
    totalPages,
    pageSize,
    viewMode,
  }
}
