import { toast } from '@/lib/toast'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { CollectionView } from '@/components/patterns'
import { ROUTES } from '@/constants'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useDeleteKnowledge,
  useFetchKnowledgeList,
} from '@/hooks/use-knowledge-request'
import type { KnowledgeBase } from '@/types/api'
import {
  DEFAULT_PAGE_SIZE,
  GRID_DEFAULT_MAX_ITEMS,
  SEARCH_DEBOUNCE_MS,
} from './constants'
import { useQuickEdit } from './use-quick-edit'
import type { KnowledgeGroupBy, KnowledgeTimeFormat } from './types'

export interface KnowledgeDeletion {
  ids: string[]
  /** Set when one named base is deleted from its row. */
  name?: string
}

/** Paths a knowledge row can open; `import` opens the upload dialog. */
export const knowledgePaths = {
  create: `${ROUTES.KNOWLEDGE}/create`,
  dataSources: '/settings/datasource',
  documents: (id: string) => `${ROUTES.KNOWLEDGE}/${id}/documents`,
  importDocuments: (id: string) =>
    `${ROUTES.KNOWLEDGE}/${id}/documents?import=1`,
  search: (id: string) => `${ROUTES.KNOWLEDGE}/${id}/search`,
  settings: (id: string) => `${ROUTES.KNOWLEDGE}/${id}/settings`,
}

export const useKnowledgeListPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Null until the user picks a view; small collections then open as cards.
  const [viewChoice, setViewChoice] = useState<CollectionView | null>(null)
  const [groupBy, setGroupBy] = useState<KnowledgeGroupBy>('content')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortDesc, setSortDesc] = useState(true)
  const [timeFormat, setTimeFormat] = useState<KnowledgeTimeFormat>('detailed')
  const [editingKnowledgeBase, setEditingKnowledgeBase] =
    useState<KnowledgeBase | null>(null)
  const [deletion, setDeletion] = useState<KnowledgeDeletion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState('')
  const keywords = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS)

  // Paging, sort and keywords are part of the query key, so changes refetch.
  const { knowledgeBases, total, isLoading, isError, refetch } =
    useFetchKnowledgeList({
      page: currentPage,
      page_size: pageSize,
      orderby: 'update_time',
      desc: sortDesc,
      keywords,
    })
  const { deleteKnowledge } = useDeleteKnowledge()
  const viewMode: CollectionView =
    viewChoice ?? (total <= GRID_DEFAULT_MAX_ITEMS ? 'grid' : 'list')

  const changeSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }, [])

  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  // Keyword search is the only server filter the list offers.
  const hasActiveSearch = searchQuery.trim() !== ''

  const openCreate = useCallback(
    () => navigate(knowledgePaths.create),
    [navigate],
  )

  // Connectors are configured in settings, then linked from a base's settings.
  const openDataSources = useCallback(
    () => navigate(knowledgePaths.dataSources),
    [navigate],
  )

  const requestDelete = useCallback(
    (target: KnowledgeDeletion) => {
      if (!deleting) setDeletion(target)
    },
    [deleting],
  )

  const cancelDelete = useCallback(() => {
    if (!deleting) setDeletion(null)
  }, [deleting])

  const confirmDelete = useCallback(async () => {
    if (!deletion || deleting) return
    const { ids, name } = deletion
    setDeleting(true)
    try {
      await Promise.all(ids.map((id) => deleteKnowledge(id)))
      setSelectedIds((previous) => previous.filter((id) => !ids.includes(id)))
      setDeletion(null)
      if (name)
        toast.success(t('knowledge.list.notifications.deleteSuccessTitle'), {
          description: t('knowledge.list.notifications.deleteSuccessMessage'),
        })
      else
        toast.success(
          t('knowledge.list.notifications.bulkDeleteSuccessTitle'),
          {
            description: t(
              'knowledge.list.notifications.bulkDeleteSuccessMessage',
              { count: ids.length },
            ),
          },
        )
    } catch {
      toast.error(
        t(
          name
            ? 'knowledge.list.notifications.deleteErrorTitle'
            : 'knowledge.list.notifications.bulkDeleteErrorTitle',
        ),
        { description: t('knowledge.list.notifications.deleteErrorMessage') },
      )
    } finally {
      setDeleting(false)
    }
  }, [deleteKnowledge, deleting, deletion, t])

  const { handleQuickEditSubmit, isQuickEditSubmitting } = useQuickEdit({
    editingKnowledgeBase,
    onUpdated: () => setEditingKnowledgeBase(null),
  })

  const toggleSelected = useCallback((id: string, checked: boolean) => {
    setSelectedIds((previous) =>
      checked
        ? [...new Set([...previous, id])]
        : previous.filter((item) => item !== id),
    )
  }, [])

  // Page-level select-all keeps selections made on other pages.
  const togglePage = useCallback(
    (checked: boolean) => {
      const visible = knowledgeBases.map((knowledgeBase) => knowledgeBase.id)
      setSelectedIds((previous) =>
        checked
          ? [...new Set([...previous, ...visible])]
          : previous.filter((id) => !visible.includes(id)),
      )
    },
    [knowledgeBases],
  )

  return {
    t,
    navigate,
    knowledgeBases,
    total,
    isLoading,
    isError,
    refetch,
    viewMode,
    setViewMode: setViewChoice,
    groupBy,
    setGroupBy,
    sortDesc,
    setSortDesc,
    timeFormat,
    setTimeFormat,
    searchQuery,
    setSearchQuery: changeSearchQuery,
    hasActiveSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: changePageSize,
    selectedIds,
    setSelectedIds,
    toggleSelected,
    togglePage,
    openCreate,
    openDataSources,
    editingKnowledgeBase,
    setEditingKnowledgeBase,
    handleQuickEditSubmit,
    isQuickEditSubmitting,
    deletion,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}

export type KnowledgeListPageState = ReturnType<typeof useKnowledgeListPage>
