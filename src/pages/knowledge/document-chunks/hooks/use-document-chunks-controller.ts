import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ChunkData } from '../types'
import { useChunkActions } from './use-chunk-actions'
import { useChunkAddForm } from './use-chunk-add-form'
import { useChunkEditForm } from './use-chunk-edit-form'
import { useChunkListState } from './use-chunk-list-state'
import { useChunkMetaForm } from './use-chunk-meta-form'
import { useChunkSelection } from './use-chunk-selection'

interface UseDocumentChunksControllerOptions {
  onSelectChunk?: () => void
  onStartEdit?: () => void
}

export const useDocumentChunksController = (
  options: UseDocumentChunksControllerOptions = {},
) => {
  const { t } = useTranslation()
  const { onSelectChunk, onStartEdit } = options
  const list = useChunkListState()
  const selection = useChunkSelection()
  const addForm = useChunkAddForm()
  const editForm = useChunkEditForm()
  const metaForm = useChunkMetaForm()
  const clearSelection = selection.clear
  const selectChunk = editForm.selectChunk
  const startEdit = editForm.startEdit
  const resetEditForm = editForm.reset
  const selectedChunkId = editForm.selectedChunk?.chunk_id
  const actions = useChunkActions({
    kbId: list.kbId,
    docId: list.docId,
    onMutationSuccess: list.delayedRefetchChunkList,
    onBulkMutationSuccess: clearSelection,
  })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingChunkId, setDeletingChunkId] = useState('')
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] =
    useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  useEffect(() => {
    clearSelection()
  }, [
    list.filterStatus,
    list.debouncedSearchKeyword,
    list.page,
    list.pageSize,
    clearSelection,
  ])

  useEffect(() => {
    if (!selectedChunkId) return
    const selectedChunkStillVisible = list.chunks.some(
      (chunk) => chunk.chunk_id === selectedChunkId,
    )
    if (!selectedChunkStillVisible) {
      resetEditForm()
    }
  }, [list.chunks, resetEditForm, selectedChunkId])

  const handleSelectChunk = useCallback(
    (chunk: ChunkData) => {
      selectChunk(chunk)
      onSelectChunk?.()
    },
    [onSelectChunk, selectChunk],
  )

  const handleStartEdit = useCallback(
    (chunk: ChunkData) => {
      startEdit(chunk)
      onStartEdit?.()
    },
    [onStartEdit, startEdit],
  )

  const handleToggleChunkStatus = useCallback(
    async (chunk: ChunkData) => {
      if (!list.docId) return
      try {
        await actions.toggleChunkStatus({
          chunkId: chunk.chunk_id,
          availableInt: chunk.available_int === 1 ? 0 : 1,
        })
      } catch (error) {
        console.error('Failed to toggle chunk status:', error)
        toast.error(t('knowledge.chunks.errors.toggleStatus'))
      }
    },
    [actions, list.docId, t],
  )

  const handleCreateChunk = useCallback(async () => {
    if (!addForm.canSubmit) return
    try {
      await actions.createChunk(await addForm.toPayloadAsync())
      addForm.close()
    } catch (error) {
      console.error('Failed to create chunk:', error)
      toast.error(t('knowledge.chunks.errors.create'))
    }
  }, [actions, addForm, t])

  const handleEditChunk = useCallback(async () => {
    if (!editForm.canSubmit || !list.docId) return
    try {
      const payload = await editForm.toPayloadAsync()
      if (!payload) return
      await actions.setChunk(payload)
      editForm.reset()
      list.delayedRefetchChunkList()
    } catch (error) {
      console.error('Failed to edit chunk:', error)
      toast.error(t('knowledge.chunks.errors.save'))
    }
  }, [actions, editForm, list, t])

  const openDeleteSingle = useCallback((chunkId: string) => {
    setDeletingChunkId(chunkId)
    setDeleteConfirmOpen(true)
  }, [])

  const closeDeleteSingle = useCallback(() => {
    setDeleteConfirmOpen(false)
    setDeletingChunkId('')
  }, [])

  const handleDeleteChunk = useCallback(async () => {
    if (!deletingChunkId || !list.docId) return
    try {
      await actions.deleteChunks([deletingChunkId])
      closeDeleteSingle()
    } catch (error) {
      console.error('Failed to delete chunk:', error)
      toast.error(t('knowledge.chunks.errors.delete'))
    }
  }, [actions, closeDeleteSingle, deletingChunkId, list.docId, t])

  const openBulkDelete = useCallback(() => {
    setDeleteSelectedConfirmOpen(true)
  }, [])

  const closeBulkDelete = useCallback(() => {
    setDeleteSelectedConfirmOpen(false)
  }, [])

  const mutateSelectedChunksStatus = useCallback(
    async (availableInt: number, errorKey: 'bulkEnable' | 'bulkDisable') => {
      if (selection.selectedChunkIds.length === 0) return
      try {
        await actions.bulkSwitchChunks({
          chunkIds: selection.selectedChunkIds,
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
    },
    [actions, selection.selectedChunkIds, t],
  )

  const handleBulkEnable = useCallback(
    () => mutateSelectedChunksStatus(1, 'bulkEnable'),
    [mutateSelectedChunksStatus],
  )

  const handleBulkDisable = useCallback(
    () => mutateSelectedChunksStatus(0, 'bulkDisable'),
    [mutateSelectedChunksStatus],
  )

  const handleBulkDelete = useCallback(async () => {
    if (selection.selectedChunkIds.length === 0) return
    try {
      await actions.deleteChunks(selection.selectedChunkIds)
      selection.clear()
      closeBulkDelete()
    } catch (error) {
      console.error('Failed to bulk delete chunks:', error)
      toast.error(t('knowledge.chunks.errors.bulkDelete'))
    }
  }, [actions, closeBulkDelete, selection, t])

  const handleStartMetaAnnotation = useCallback(() => {
    metaForm.startAnnotation(list.docInfo)
  }, [list.docInfo, metaForm])

  const handleSaveMeta = useCallback(async () => {
    if (!list.docId) return
    try {
      await actions.setMeta(metaForm.toPayload())
      metaForm.close()
    } catch (error) {
      console.error('Failed to save meta:', error)
      toast.error(t('knowledge.chunks.errors.saveMeta'))
    }
  }, [actions, list.docId, metaForm, t])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      selection.selectAll(
        checked,
        list.filteredChunks.map((chunk) => chunk.chunk_id),
      )
    },
    [list.filteredChunks, selection],
  )

  return {
    list,
    selection,
    addForm,
    editForm,
    metaForm,
    actions,
    deleteState: {
      deleteConfirmOpen,
      deletingChunkId,
      deleteSelectedConfirmOpen,
      openDeleteSingle,
      closeDeleteSingle,
      openBulkDelete,
      closeBulkDelete,
    },
    previewImageUrl,
    setPreviewImageUrl,
    handleSelectChunk,
    handleStartEdit,
    handleToggleChunkStatus,
    handleCreateChunk,
    handleEditChunk,
    handleDeleteChunk,
    handleBulkEnable,
    handleBulkDisable,
    handleBulkDelete,
    handleStartMetaAnnotation,
    handleSaveMeta,
    handleSelectAll,
  }
}

export type DocumentChunksController = ReturnType<
  typeof useDocumentChunksController
>
