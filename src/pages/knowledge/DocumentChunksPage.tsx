import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { knowledgeAPI } from '@/api/knowledge'
import { fileToBase64 } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ChunkEditOverlay } from './document-chunks/components/chunk-edit-overlay'
import { ChunkList } from './document-chunks/components/chunk-list'
import { ChunkModals } from './document-chunks/components/chunk-modals'
import { ChunkToolbar } from './document-chunks/components/chunk-toolbar'
import {
  DocumentInfoShell,
  DocumentPreviewPane,
} from './document-chunks/components/document-chunks-shell'
import { DocumentInfoPanel } from './document-chunks/components/document-info-panel'
import { useResizablePanels } from './document-chunks/use-resizable-panels'
import type {
  ChunkData,
  ChunkFilterStatus,
  ChunkListDocument,
  CSSVarStyle,
  MetadataEntry,
  TextMode,
} from './document-chunks/types'

const DocumentChunksPage = () => {
  const { t } = useTranslation()
  const { docId } = useParams<{ id: string; docId: string }>()

  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] =
    useState(false)
  const [textMode, setTextMode] = useState<TextMode>('ellipse')
  const [filterStatus, setFilterStatus] = useState<ChunkFilterStatus>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [addChunkModalOpen, setAddChunkModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingChunkId, setDeletingChunkId] = useState('')
  const [newChunkContent, setNewChunkContent] = useState('')
  const [editingChunkContent, setEditingChunkContent] = useState('')
  const [editingImportantKwd, setEditingImportantKwd] = useState<string[]>([])
  const [editingQuestionKwd, setEditingQuestionKwd] = useState<string[]>([])
  const [newImportantKwd, setNewImportantKwd] = useState<string[]>([])
  const [newQuestionKwd, setNewQuestionKwd] = useState<string[]>([])
  const [editingImage, setEditingImage] = useState<File[]>([])
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [showParserConfig, setShowParserConfig] = useState(false)
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false)
  const [metaModalOpen, setMetaModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<MetadataEntry[]>([])
  const [nextMetaId, setNextMetaId] = useState(1)
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(true)
  const [previewPanelWidth, setPreviewPanelWidth] = useState(560)
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true)
  const [infoPanelWidth, setInfoPanelWidth] = useState(320)
  const handleResizeStart = useResizablePanels({
    setPreviewPanelWidth,
    setInfoPanelWidth,
  })

  const debouncedSearchKeyword = useDebouncedValue(searchKeyword.trim(), 400)

  const availableInt = useMemo(() => {
    if (filterStatus === 'enabled') return 1
    if (filterStatus === 'disabled') return 0
    return undefined
  }, [filterStatus])

  const {
    data: chunkListData,
    isFetching,
    isLoading,
    error: chunkListError,
    refetch: refetchChunkList,
  } = useQuery({
    queryKey: [
      'documentChunks',
      docId,
      page,
      pageSize,
      debouncedSearchKeyword,
      availableInt,
    ],
    enabled: Boolean(docId),
    gcTime: 0,
    queryFn: async () => {
      return knowledgeAPI.document.listChunks({
        doc_id: docId!,
        page,
        size: pageSize,
        keywords: debouncedSearchKeyword || undefined,
        available_int: availableInt,
      })
    },
    placeholderData: (previousData) => previousData,
  })

  const chunks = useMemo<ChunkData[]>(
    () => (chunkListData?.chunks ?? []) as ChunkData[],
    [chunkListData],
  )
  const total = chunkListData?.total ?? 0
  const docInfo = (chunkListData?.doc ?? null) as ChunkListDocument | null
  const loading = (isLoading || isFetching) && !chunkListData

  const filteredChunks = useMemo(() => {
    if (filterStatus === 'all') return chunks
    return chunks.filter((chunk) =>
      filterStatus === 'enabled'
        ? chunk.available_int === 1
        : chunk.available_int === 0,
    )
  }, [chunks, filterStatus])

  useEffect(() => {
    setPage(1)
    setSelectedChunkIds([])
  }, [filterStatus, searchKeyword])

  useEffect(() => {
    setSelectedChunkIds([])
  }, [page, pageSize])

  const delayedRefetchChunkList = useMemo(
    () => () => setTimeout(() => refetchChunkList(), 500),
    [refetchChunkList],
  )

  const switchChunkMutation = useMutation({
    mutationFn: async (params: { chunkId: string; availableInt: number }) => {
      if (!docId) return false
      return knowledgeAPI.document.switchChunks({
        doc_id: docId,
        chunk_ids: [params.chunkId],
        available_int: params.availableInt,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const bulkSwitchChunksMutation = useMutation({
    mutationFn: async (params: {
      chunkIds: string[]
      availableInt: number
    }) => {
      if (!docId) return false
      return knowledgeAPI.document.switchChunks({
        doc_id: docId,
        chunk_ids: params.chunkIds,
        available_int: params.availableInt,
      })
    },
    onSuccess: () => {
      setSelectedChunkIds([])
      delayedRefetchChunkList()
    },
  })

  const setChunkMutation = useMutation({
    mutationFn: async (params: {
      chunkId: string
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      image_base64?: string
    }) => {
      if (!docId) return false
      return knowledgeAPI.document.setChunk({
        doc_id: docId,
        chunk_id: params.chunkId,
        content_with_weight: params.content,
        important_kwd: params.important_kwd,
        question_kwd: params.question_kwd,
        image_base64: params.image_base64,
      })
    },
  })

  const deleteChunksMutation = useMutation({
    mutationFn: async (chunkIds: string[]) => {
      if (!docId) return false
      return knowledgeAPI.document.deleteChunks({
        doc_id: docId,
        chunk_ids: chunkIds,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const createChunkMutation = useMutation({
    mutationFn: async (params: {
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
    }) => {
      if (!docId) return false
      return knowledgeAPI.document.createChunk({
        doc_id: docId,
        content_with_weight: params.content,
        important_kwd: params.important_kwd,
        question_kwd: params.question_kwd,
        available_int: 1,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const setMetaMutation = useMutation({
    mutationFn: async (meta: Record<string, unknown>) => {
      if (!docId) return false
      return knowledgeAPI.document.setDocumentMeta({
        doc_id: docId,
        meta,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const isAllSelected =
    filteredChunks.length > 0 &&
    selectedChunkIds.length === filteredChunks.length
  const isPartialSelected =
    selectedChunkIds.length > 0 &&
    selectedChunkIds.length < filteredChunks.length
  const hasSelected = selectedChunkIds.length > 0

  const previewPanelStyle = useMemo((): CSSVarStyle => {
    return { '--preview-panel-width': `${previewPanelWidth}px` }
  }, [previewPanelWidth])

  const infoPanelStyle = useMemo((): CSSVarStyle => {
    return { '--info-panel-width': `${infoPanelWidth}px` }
  }, [infoPanelWidth])

  const resetEditState = () => {
    setIsEditMode(false)
    setSelectedChunk(null)
    setEditingChunkContent('')
    setEditingImportantKwd([])
    setEditingQuestionKwd([])
    setEditingImage([])
    setIsMarkdownPreview(false)
  }

  const populateEditingState = (chunk: ChunkData) => {
    setSelectedChunk(chunk)
    setEditingChunkContent(chunk.content_with_weight)
    setEditingImportantKwd(chunk.important_kwd || [])
    setEditingQuestionKwd(chunk.question_kwd || [])
    setIsMarkdownPreview(false)
    if (!isInfoPanelOpen) setIsInfoPanelOpen(true)
  }

  const handleSelectChunk = (chunk: ChunkData) => {
    populateEditingState(chunk)
  }

  const handleEditChunkStart = (chunk: ChunkData) => {
    populateEditingState(chunk)
    setIsEditMode(true)
  }

  const handleToggleChunkStatus = async (chunk: ChunkData) => {
    if (!docId) return

    try {
      await switchChunkMutation.mutateAsync({
        chunkId: chunk.chunk_id,
        availableInt: chunk.available_int === 1 ? 0 : 1,
      })
    } catch (error) {
      console.error('Failed to toggle chunk status:', error)
      toast.error(t('knowledge.chunks.errors.toggleStatus'))
    }
  }

  const handleCreateChunk = async () => {
    if (!newChunkContent.trim()) return

    try {
      await createChunkMutation.mutateAsync({
        content: newChunkContent.trim(),
        important_kwd: newImportantKwd,
        question_kwd: newQuestionKwd,
      })
      closeAddChunkModal()
    } catch (error) {
      console.error('Failed to create chunk:', error)
      toast.error(t('knowledge.chunks.errors.create'))
    }
  }

  const handleEditChunk = async () => {
    if (!selectedChunk || !editingChunkContent.trim() || !docId) return

    try {
      const imageBase64 =
        editingImage.length > 0
          ? await fileToBase64(editingImage[0])
          : undefined

      await setChunkMutation.mutateAsync({
        chunkId: selectedChunk.chunk_id,
        content: editingChunkContent.trim(),
        important_kwd: editingImportantKwd,
        question_kwd: editingQuestionKwd,
        image_base64: imageBase64,
      })

      resetEditState()
      setTimeout(() => {
        refetchChunkList()
      }, 500)
    } catch (error) {
      console.error('Failed to edit chunk:', error)
      toast.error(t('knowledge.chunks.errors.save'))
    }
  }

  const handleDeleteChunk = async () => {
    if (!deletingChunkId || !docId) return

    try {
      await deleteChunksMutation.mutateAsync([deletingChunkId])
      setDeleteConfirmOpen(false)
      setDeletingChunkId('')
    } catch (error) {
      console.error('Failed to delete chunk:', error)
      toast.error(t('knowledge.chunks.errors.delete'))
    }
  }

  const handleStartMetaAnnotation = () => {
    const metaArray = Object.entries(docInfo?.meta_fields || {}).map(
      ([key, value], index) => ({
        id: `meta_${index + 1}`,
        key,
        value,
      }),
    )
    setEditingMeta(metaArray)
    setNextMetaId(metaArray.length + 1)
    setMetaModalOpen(true)
  }

  const handleSaveMeta = async () => {
    if (!docId) return

    try {
      const metaObject = editingMeta.reduce(
        (acc, item) => {
          if (item.key.trim()) acc[item.key] = item.value
          return acc
        },
        {} as Record<string, unknown>,
      )

      await setMetaMutation.mutateAsync(metaObject)
      setMetaModalOpen(false)
      setEditingMeta([])
    } catch (error) {
      console.error('Failed to save meta:', error)
      toast.error(t('knowledge.chunks.errors.saveMeta'))
    }
  }

  const handleAddMetaField = () => {
    setEditingMeta((prev) => [
      ...prev,
      { id: `meta_${nextMetaId}`, key: `field_${nextMetaId}`, value: '' },
    ])
    setNextMetaId((prev) => prev + 1)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedChunkIds(
      checked ? filteredChunks.map((chunk) => chunk.chunk_id) : [],
    )
  }

  const handleSingleCheckboxClick = (chunkId: string, checked: boolean) => {
    setSelectedChunkIds((prev) => {
      const index = prev.indexOf(chunkId)
      if (checked && index === -1) return [...prev, chunkId]
      if (!checked && index !== -1) return prev.filter((id) => id !== chunkId)
      return prev
    })
  }

  const mutateSelectedChunksStatus = async (
    availableInt: number,
    errorKey: 'bulkEnable' | 'bulkDisable',
  ) => {
    if (selectedChunkIds.length === 0) return
    try {
      await bulkSwitchChunksMutation.mutateAsync({
        chunkIds: selectedChunkIds,
        availableInt,
      })
    } catch (error) {
      console.error('Failed to bulk update chunks:', error)
      const errorMessageKey =
        errorKey === 'bulkEnable'
          ? 'knowledge.chunks.errors.bulkEnable'
          : 'knowledge.chunks.errors.bulkDisable'
      toast.error(t(errorMessageKey))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedChunkIds.length === 0) return
    try {
      await deleteChunksMutation.mutateAsync(selectedChunkIds)
      setSelectedChunkIds([])
      setDeleteSelectedConfirmOpen(false)
    } catch (error) {
      console.error('Failed to bulk delete chunks:', error)
      toast.error(t('knowledge.chunks.errors.bulkDelete'))
    }
  }

  const closeAddChunkModal = () => {
    setAddChunkModalOpen(false)
    setNewChunkContent('')
    setNewImportantKwd([])
    setNewQuestionKwd([])
  }

  const closeMetaModal = () => {
    setMetaModalOpen(false)
    setEditingMeta([])
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-background-default)' }}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <DocumentPreviewPane
          open={isPreviewPanelOpen}
          docId={docId}
          docInfo={docInfo}
          selectedChunk={selectedChunk}
          style={previewPanelStyle}
          width={previewPanelWidth}
          onClose={() => setIsPreviewPanelOpen(false)}
          onResizeStart={handleResizeStart}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background-surface">
          <ChunkToolbar
            textMode={textMode}
            onTextModeChange={setTextMode}
            isPreviewPanelOpen={isPreviewPanelOpen}
            onOpenPreviewPanel={() => setIsPreviewPanelOpen(true)}
            isSearchOpen={isSearchOpen}
            onSearchOpenChange={setIsSearchOpen}
            searchKeyword={searchKeyword}
            onSearchKeywordChange={setSearchKeyword}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            total={total}
            isAllSelected={isAllSelected}
            isPartialSelected={isPartialSelected}
            selectedCount={selectedChunkIds.length}
            hasSelected={hasSelected}
            onSelectAll={handleSelectAll}
            onBulkEnable={() => mutateSelectedChunksStatus(1, 'bulkEnable')}
            onBulkDisable={() => mutateSelectedChunksStatus(0, 'bulkDisable')}
            onBulkDeleteClick={() => setDeleteSelectedConfirmOpen(true)}
            isBulkSwitchPending={bulkSwitchChunksMutation.isPending}
            isDeletePending={deleteChunksMutation.isPending}
            onAddChunk={() => setAddChunkModalOpen(true)}
          />

          <ChunkList
            loading={loading}
            error={chunkListError}
            chunks={chunks}
            filteredChunks={filteredChunks}
            total={total}
            page={page}
            pageSize={pageSize}
            selectedChunk={selectedChunk}
            selectedChunkIds={selectedChunkIds}
            textMode={textMode}
            onRefetch={() => refetchChunkList()}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onSelectChunk={handleSelectChunk}
            onEditChunk={handleEditChunkStart}
            onToggleChunkStatus={handleToggleChunkStatus}
            onDeleteChunk={(chunkId) => {
              setDeletingChunkId(chunkId)
              setDeleteConfirmOpen(true)
            }}
            onCheckboxChange={handleSingleCheckboxClick}
            onPreviewImage={setPreviewImageUrl}
          />
        </div>

        <DocumentInfoShell
          open={isInfoPanelOpen}
          style={infoPanelStyle}
          width={infoPanelWidth}
          onOpen={() => setIsInfoPanelOpen(true)}
          onResizeStart={handleResizeStart}
        >
          {isInfoPanelOpen && isEditMode && selectedChunk && (
            <ChunkEditOverlay
              selectedChunk={selectedChunk}
              editingChunkContent={editingChunkContent}
              onEditingChunkContentChange={setEditingChunkContent}
              editingImportantKwd={editingImportantKwd}
              onEditingImportantKwdChange={setEditingImportantKwd}
              editingQuestionKwd={editingQuestionKwd}
              onEditingQuestionKwdChange={setEditingQuestionKwd}
              editingImage={editingImage}
              onEditingImageChange={setEditingImage}
              isMarkdownPreview={isMarkdownPreview}
              onMarkdownPreviewChange={setIsMarkdownPreview}
              onCancel={resetEditState}
              onSave={handleEditChunk}
              onPreviewImage={setPreviewImageUrl}
            />
          )}

          {isInfoPanelOpen && !isEditMode && (
            <DocumentInfoPanel
              docInfo={docInfo}
              selectedChunk={selectedChunk}
              showParserConfig={showParserConfig}
              onShowParserConfigChange={setShowParserConfig}
              onCollapsePanel={() => setIsInfoPanelOpen(false)}
              onClearSelectedChunk={() => {
                setSelectedChunk(null)
                setEditingChunkContent('')
                setEditingImportantKwd([])
                setEditingQuestionKwd([])
              }}
              onStartMetaAnnotation={handleStartMetaAnnotation}
            />
          )}
        </DocumentInfoShell>
      </div>

      <ChunkModals
        addChunkModalOpen={addChunkModalOpen}
        onAddChunkModalClose={closeAddChunkModal}
        newChunkContent={newChunkContent}
        onNewChunkContentChange={setNewChunkContent}
        newImportantKwd={newImportantKwd}
        onNewImportantKwdChange={setNewImportantKwd}
        newQuestionKwd={newQuestionKwd}
        onNewQuestionKwdChange={setNewQuestionKwd}
        onCreateChunk={handleCreateChunk}
        deleteConfirmOpen={deleteConfirmOpen}
        onDeleteConfirmClose={() => setDeleteConfirmOpen(false)}
        onDeleteConfirm={handleDeleteChunk}
        deletingChunkId={deletingChunkId}
        deleteSelectedConfirmOpen={deleteSelectedConfirmOpen}
        onDeleteSelectedConfirmClose={() => setDeleteSelectedConfirmOpen(false)}
        onDeleteSelectedConfirm={handleBulkDelete}
        selectedChunkCount={selectedChunkIds.length}
        metaModalOpen={metaModalOpen}
        onMetaModalClose={closeMetaModal}
        editingMeta={editingMeta}
        onAddMetaField={handleAddMetaField}
        onRemoveMetaField={(id) =>
          setEditingMeta((prev) => prev.filter((item) => item.id !== id))
        }
        onUpdateMetaKey={(id, key) =>
          setEditingMeta((prev) =>
            prev.map((item) => (item.id === id ? { ...item, key } : item)),
          )
        }
        onUpdateMetaValue={(id, value) =>
          setEditingMeta((prev) =>
            prev.map((item) => (item.id === id ? { ...item, value } : item)),
          )
        }
        onSaveMeta={handleSaveMeta}
        previewImageUrl={previewImageUrl}
        onPreviewImageClose={() => setPreviewImageUrl(null)}
      />
    </div>
  )
}

export { DocumentChunksPage }
