import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
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

type Operation =
  | 'create'
  | 'save'
  | 'toggle'
  | 'bulkSwitch'
  | 'delete'
  | 'metadata'

export const useDocumentChunksController = (
  options: UseDocumentChunksControllerOptions = {},
) => {
  const { t } = useTranslation()
  const { onSelectChunk, onStartEdit } = options
  const list = useChunkListState()
  const ownerKey = `${list.kbId}:${list.docId}`
  const selection = useChunkSelection(ownerKey)
  const addForm = useChunkAddForm(ownerKey)
  const editForm = useChunkEditForm(ownerKey)
  const metaForm = useChunkMetaForm(ownerKey)
  const clearSelection = selection.clear
  const selectChunk = editForm.selectChunk
  const startEdit = editForm.startEdit
  const resetEditForm = editForm.reset
  const selectedChunkId = editForm.selectedChunk?.chunk_id
  const actions = useChunkActions({
    kbId: list.kbId,
    docId: list.docId,
    onMutationSuccess: list.delayedRefetchChunkList,
  })

  const [currentScope, setCurrentScope] = useState({ ownerKey, generation: 0 })
  if (currentScope.ownerKey !== ownerKey) {
    setCurrentScope({ ownerKey, generation: currentScope.generation + 1 })
  }
  const scope = useRef<typeof currentScope | null>(currentScope)
  useLayoutEffect(() => {
    scope.current = currentScope
    return () => {
      scope.current = null
    }
  }, [currentScope])
  const generation = currentScope.generation
  const locks = useRef(new Map<Operation, number>())
  const [pendingOperations, setPendingOperations] = useState<{
    generation: number
    operations: Operation[]
  }>({ generation, operations: [] })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingChunkId, setDeletingChunkId] = useState('')
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] =
    useState(false)
  const [previousOwner, setPreviousOwner] = useState(ownerKey)
  if (previousOwner !== ownerKey) {
    setPreviousOwner(ownerKey)
    setDeleteConfirmOpen(false)
    setDeletingChunkId('')
    setDeleteSelectedConfirmOpen(false)
  }
  const [previewImage, setPreviewImage] = useState<{
    ownerKey: string
    imageId: string | null
  } | null>(null)
  const previewImageId =
    previewImage && previewImage.ownerKey === `${list.kbId}:${list.docId}`
      ? previewImage.imageId
      : null
  const setPreviewImageId = useCallback(
    (imageId: string | null) => {
      setPreviewImage({ ownerKey: `${list.kbId}:${list.docId}`, imageId })
    },
    [list.kbId, list.docId],
  )

  const interaction = useRef({
    create: addForm.session,
    save: editForm.session,
    metadata: metaForm.session,
    selectedIds: selection.selectedChunkIds.join('\0'),
    deletingChunkId,
  })
  useLayoutEffect(() => {
    interaction.current = {
      create: addForm.session,
      save: editForm.session,
      metadata: metaForm.session,
      selectedIds: selection.selectedChunkIds.join('\0'),
      deletingChunkId,
    }
  }, [
    addForm.session,
    deletingChunkId,
    editForm.session,
    metaForm.session,
    selection.selectedChunkIds,
  ])
  const pending = Object.fromEntries(
    (
      ['create', 'save', 'toggle', 'bulkSwitch', 'delete', 'metadata'] as const
    ).map((operation) => [
      operation,
      pendingOperations.generation === generation &&
        pendingOperations.operations.includes(operation),
    ]),
  ) as Record<Operation, boolean>

  const runOperation = useCallback(
    async (
      operation: Operation,
      errorKey: string,
      work: (isCurrent: () => boolean) => Promise<void>,
    ) => {
      if (
        !list.kbId ||
        !list.docId ||
        !list.docInfo ||
        list.loading ||
        list.error ||
        list.isPlaceholderData
      )
        return
      if (locks.current.get(operation) === generation) return
      locks.current.set(operation, generation)
      const operationSession = interaction.current
      const isCurrent = () => {
        if (scope.current?.generation !== generation) return false
        if (
          operation === 'create' ||
          operation === 'save' ||
          operation === 'metadata'
        ) {
          return interaction.current[operation] === operationSession[operation]
        }
        if (operation === 'delete') {
          return (
            interaction.current.deletingChunkId ===
              operationSession.deletingChunkId &&
            interaction.current.selectedIds === operationSession.selectedIds
          )
        }
        if (operation === 'bulkSwitch') {
          return (
            interaction.current.selectedIds === operationSession.selectedIds
          )
        }
        return true
      }
      const publishPending = () =>
        setPendingOperations({
          generation,
          operations: [...locks.current]
            .filter(([, value]) => value === generation)
            .map(([key]) => key),
        })
      publishPending()
      try {
        await work(isCurrent)
      } catch {
        if (isCurrent()) toast.error(t(errorKey))
      } finally {
        if (locks.current.get(operation) === generation)
          locks.current.delete(operation)
        if (scope.current?.generation === generation) publishPending()
      }
    },
    [
      generation,
      list.docId,
      list.docInfo,
      list.error,
      list.isPlaceholderData,
      list.kbId,
      list.loading,
      t,
    ],
  )

  useEffect(() => {
    clearSelection()
  }, [
    list.filterStatus,
    list.debouncedSearchKeyword,
    list.page,
    list.pageSize,
    ownerKey,
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
      await runOperation(
        'toggle',
        'knowledge.chunks.errors.toggleStatus',
        async () => {
          await actions.toggleChunkStatus({
            chunkId: chunk.chunk_id,
            availableInt: chunk.available_int === 1 ? 0 : 1,
          })
        },
      )
    },
    [actions, runOperation],
  )

  const handleCreateChunk = useCallback(async () => {
    if (!addForm.canSubmit) return
    await runOperation(
      'create',
      'knowledge.chunks.errors.create',
      async (isCurrent) => {
        const payload = await addForm.toPayloadAsync()
        if (!isCurrent()) return
        await actions.createChunk(payload)
        if (isCurrent()) addForm.close()
      },
    )
  }, [actions, addForm, runOperation])

  const handleEditChunk = useCallback(async () => {
    if (!editForm.canSubmit || !list.docId) return
    await runOperation(
      'save',
      'knowledge.chunks.errors.save',
      async (isCurrent) => {
        const payload = await editForm.toPayloadAsync()
        if (!payload || !isCurrent()) return
        await actions.setChunk(payload)
        if (isCurrent()) editForm.reset()
      },
    )
  }, [actions, editForm, list.docId, runOperation])

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
    await runOperation(
      'delete',
      'knowledge.chunks.errors.delete',
      async (isCurrent) => {
        await actions.deleteChunks([deletingChunkId])
        if (isCurrent()) closeDeleteSingle()
      },
    )
  }, [actions, closeDeleteSingle, deletingChunkId, list.docId, runOperation])

  const openBulkDelete = useCallback(() => {
    setDeleteSelectedConfirmOpen(true)
  }, [])

  const closeBulkDelete = useCallback(() => {
    setDeleteSelectedConfirmOpen(false)
  }, [])

  const mutateSelectedChunksStatus = useCallback(
    async (availableInt: number, errorKey: 'bulkEnable' | 'bulkDisable') => {
      if (selection.selectedChunkIds.length === 0) return
      const errorMessageKey =
        errorKey === 'bulkEnable'
          ? 'knowledge.chunks.errors.bulkEnable'
          : 'knowledge.chunks.errors.bulkDisable'
      await runOperation('bulkSwitch', errorMessageKey, async (isCurrent) => {
        await actions.bulkSwitchChunks({
          chunkIds: selection.selectedChunkIds,
          availableInt,
        })
        if (isCurrent()) selection.clear()
      })
    },
    [actions, runOperation, selection],
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
    await runOperation(
      'delete',
      'knowledge.chunks.errors.bulkDelete',
      async (isCurrent) => {
        await actions.deleteChunks(selection.selectedChunkIds)
        if (isCurrent()) {
          selection.clear()
          closeBulkDelete()
        }
      },
    )
  }, [actions, closeBulkDelete, runOperation, selection])

  const handleStartMetaAnnotation = useCallback(() => {
    if (!list.docInfo || list.loading || list.error || list.isPlaceholderData)
      return
    metaForm.startAnnotation(list.docInfo)
  }, [list.docInfo, list.error, list.isPlaceholderData, list.loading, metaForm])

  const handleSaveMeta = useCallback(async () => {
    if (!list.docId) return
    await runOperation(
      'metadata',
      'knowledge.chunks.errors.saveMeta',
      async (isCurrent) => {
        await actions.setMeta(metaForm.toPayload())
        if (isCurrent()) metaForm.close()
      },
    )
  }, [actions, list.docId, metaForm, runOperation])

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
    pending,
    deleteState: {
      deleteConfirmOpen,
      deletingChunkId,
      deleteSelectedConfirmOpen,
      openDeleteSingle,
      closeDeleteSingle,
      openBulkDelete,
      closeBulkDelete,
    },
    previewImageId,
    setPreviewImageId,
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
