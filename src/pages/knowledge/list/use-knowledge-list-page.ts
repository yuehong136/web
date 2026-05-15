import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import type { KnowledgeBase } from '@/types/api'
import { DEFAULT_KNOWLEDGE_FILTERS, DEFAULT_PAGE_SIZE } from './constants'
import {
  formatKnowledgeTime,
  getStatusClassName,
  getUniqueOptions,
  matchesKnowledgeFilters,
} from './utils'
import type {
  KnowledgeFilterOption,
  KnowledgeFilterState,
  KnowledgeTimeFormat,
  KnowledgeViewMode,
} from './types'

const getPermissionLabel = (
  permission: string,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  if (permission === 'me') return t('knowledge.list.filters.permission.me')
  if (permission === 'team') return t('knowledge.list.filters.permission.team')
  return permission
}

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
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [timeFormat, setTimeFormat] = useState<KnowledgeTimeFormat>('detailed')
  const [editingKnowledgeBase, setEditingKnowledgeBase] =
    useState<KnowledgeBase | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [filters, setFilters] = useState<KnowledgeFilterState>(
    DEFAULT_KNOWLEDGE_FILTERS,
  )

  const backendFilterParams = useMemo(
    () => ({
      permissions:
        filters.permissions.length > 0 ? filters.permissions : undefined,
      languages: filters.languages.length > 0 ? filters.languages : undefined,
      parser_ids:
        filters.parser_ids.length > 0 ? filters.parser_ids : undefined,
      embd_ids: filters.embd_ids.length > 0 ? filters.embd_ids : undefined,
    }),
    [filters],
  )

  const loadCurrentPage = useCallback(() => {
    loadKnowledgeBases({
      page: currentPage,
      page_size: pageSize,
      orderby: sortBy,
      desc: sortDesc,
      keywords: searchQuery,
      filter_params: backendFilterParams,
    })
  }, [
    backendFilterParams,
    currentPage,
    loadKnowledgeBases,
    pageSize,
    searchQuery,
    sortBy,
    sortDesc,
  ])

  useEffect(() => {
    loadCurrentPage()
  }, [loadCurrentPage])

  useEffect(() => {
    setCurrentPage((prevPage) => (prevPage === 1 ? prevPage : 1))
  }, [filters, searchQuery])

  const filteredKnowledgeBases = useMemo(() => {
    const now = Date.now()
    return knowledgeBases.filter((knowledgeBase) =>
      matchesKnowledgeFilters(knowledgeBase, filters, now),
    )
  }, [filters, knowledgeBases])

  const totalPages = Math.ceil(total / pageSize)

  const permissionOptions = useMemo<KnowledgeFilterOption[]>(() => {
    return getUniqueOptions(knowledgeBases, 'permission').map((option) => ({
      ...option,
      label: getPermissionLabel(option.value, t),
    }))
  }, [knowledgeBases, t])

  const languageOptions = useMemo(
    () => getUniqueOptions(knowledgeBases, 'language'),
    [knowledgeBases],
  )

  const parserOptions = useMemo(
    () => getUniqueOptions(knowledgeBases, 'parser_id'),
    [knowledgeBases],
  )

  const embeddingOptions = useMemo(
    () => getUniqueOptions(knowledgeBases, 'embd_id'),
    [knowledgeBases],
  )

  const timeRangeOptions = useMemo(
    () => [
      { value: 'all', label: t('knowledge.list.filters.time.all') },
      { value: 'today', label: t('knowledge.list.filters.time.today') },
      { value: 'week', label: t('knowledge.list.filters.time.week') },
      { value: 'month', label: t('knowledge.list.filters.time.month') },
      { value: 'quarter', label: t('knowledge.list.filters.time.quarter') },
    ],
    [t],
  )

  const timeFormatOptions = useMemo(
    () => [
      { value: 'detailed', label: t('knowledge.list.timeFormat.detailed') },
      { value: 'compact', label: t('knowledge.list.timeFormat.compact') },
      { value: 'relative', label: t('knowledge.list.timeFormat.relative') },
    ],
    [t],
  )

  const hasActiveFilters = useMemo(
    () =>
      filters.permissions.length > 0 ||
      filters.languages.length > 0 ||
      filters.parser_ids.length > 0 ||
      filters.embd_ids.length > 0 ||
      filters.doc_num_range.length > 0 ||
      filters.time_range !== 'all' ||
      searchQuery.trim() !== '',
    [filters, searchQuery],
  )

  const activeFilterCount = useMemo(
    () =>
      filters.permissions.length +
      filters.languages.length +
      filters.parser_ids.length +
      filters.embd_ids.length +
      filters.doc_num_range.length +
      (filters.time_range !== 'all' ? 1 : 0) +
      (searchQuery.trim() ? 1 : 0),
    [filters, searchQuery],
  )

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_KNOWLEDGE_FILTERS)
    setSearchQuery('')
  }, [setSearchQuery])

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
      prev.length === filteredKnowledgeBases.length
        ? []
        : filteredKnowledgeBases.map((knowledgeBase) => knowledgeBase.id),
    )
  }, [filteredKnowledgeBases])

  return {
    activeFilterCount,
    clearAllFilters,
    currentPage,
    editingKnowledgeBase,
    embeddingOptions,
    filterPopoverOpen,
    filteredKnowledgeBases,
    filters,
    formatTime,
    getStatusClassName,
    getStatusText,
    handleBulkDelete,
    handleCreateSuccess,
    handleDelete,
    handleView,
    hasActiveFilters,
    isLoading,
    knowledgeBases,
    languageOptions,
    parserOptions,
    permissionOptions,
    searchQuery,
    selectedBases,
    setCurrentPage,
    setEditingKnowledgeBase,
    setFilterPopoverOpen,
    setFilters,
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
    timeRangeOptions,
    toggleGridSelection,
    toggleSelectedBase,
    toggleSelectAll,
    total,
    totalPages,
    pageSize,
    viewMode,
  }
}
