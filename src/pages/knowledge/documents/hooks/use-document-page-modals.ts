import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateDocumentParser } from '@/hooks/use-document-request'
import type { Document, KnowledgeBase } from '@/types/api'
import type { DocumentListState } from '../types'
import type { useDocumentActions } from './use-document-actions'

type DocumentActions = ReturnType<typeof useDocumentActions>

interface UseDocumentPageModalsProps {
  currentKnowledgeBase: KnowledgeBase | null
  listState: DocumentListState
  actions: DocumentActions
}

export function useDocumentPageModals({
  currentKnowledgeBase,
  listState,
  actions,
}: UseDocumentPageModalsProps) {
  const { t } = useTranslation()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renamingDoc, setRenamingDoc] = useState<Document | null>(null)
  const [newDocName, setNewDocName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState('')
  const [reparseModalOpen, setReparseModalOpen] = useState(false)
  const [reparsingDocs, setReparsingDocs] = useState<Document[]>([])
  const [isReparsing, setIsReparsing] = useState(false)
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)
  const [docMetadataModalOpen, setDocMetadataModalOpen] = useState(false)
  const [editingDocMeta, setEditingDocMeta] = useState<Document | null>(null)
  const [chunkMethodModalOpen, setChunkMethodModalOpen] = useState(false)
  const [editingParserDoc, setEditingParserDoc] = useState<Document | null>(
    null,
  )
  const { updateDocumentParser, isLoading: isUpdatingParser } =
    useUpdateDocumentParser()

  const needsParseConfirmation = useCallback(
    (docs: Document[]) => {
      const hasChunks = docs.some((doc) => (doc.chunk_num || 0) > 0)
      const hasMetadataEnabled =
        currentKnowledgeBase?.enable_metadata === true ||
        currentKnowledgeBase?.parser_config?.enable_metadata === true
      return hasChunks || hasMetadataEnabled
    },
    [currentKnowledgeBase],
  )

  const handleStartParse = useCallback(
    (doc: Document) => {
      if (needsParseConfirmation([doc])) {
        setReparsingDocs([doc])
        setReparseModalOpen(true)
      } else {
        actions.handleStartParse([doc.id], false)
      }
    },
    [needsParseConfirmation, actions],
  )

  const handleBatchStartParse = useCallback(() => {
    const docs = listState.selectedDocuments
    if (needsParseConfirmation(docs)) {
      setReparsingDocs(docs)
      setReparseModalOpen(true)
    } else {
      actions.handleStartParse(
        docs.map((d) => d.id),
        false,
      )
      listState.clearSelection()
    }
  }, [needsParseConfirmation, actions, listState])

  const handleConfirmParse = useCallback(
    async (options: {
      deleteChunks: boolean
      applyMetadataSettings: boolean
    }) => {
      if (reparsingDocs.length === 0) return
      setIsReparsing(true)
      try {
        await actions.handleStartParse(
          reparsingDocs.map((d) => d.id),
          options.deleteChunks,
        )
        setReparseModalOpen(false)
        setReparsingDocs([])
        listState.clearSelection()
      } finally {
        setIsReparsing(false)
      }
    },
    [reparsingDocs, actions, listState],
  )

  const openRenameModal = useCallback((doc: Document) => {
    setRenamingDoc(doc)
    setNewDocName(doc.name)
    setRenameModalOpen(true)
  }, [])

  const handleRename = useCallback(async () => {
    if (!renamingDoc || !newDocName) return
    await actions.handleRename(renamingDoc.id, newDocName)
    setRenameModalOpen(false)
    setRenamingDoc(null)
    setNewDocName('')
  }, [renamingDoc, newDocName, actions])

  const requestDelete = useCallback((doc: Document) => {
    setDeletingDocId(doc.id)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deletingDocId) return
    await actions.handleDelete([deletingDocId])
    setDeleteConfirmOpen(false)
    setDeletingDocId('')
  }, [deletingDocId, actions])

  const handleBulkDelete = useCallback(async () => {
    const docIds = Array.from(listState.selectedDocs)
    const confirmed = window.confirm(
      t('knowledge.documents.bulkDeleteConfirm', { count: docIds.length }),
    )
    if (!confirmed) return
    await actions.handleDelete(docIds)
    listState.clearSelection()
  }, [listState, actions, t])

  const handleShowChunkMethodModal = useCallback((doc: Document) => {
    setEditingParserDoc(doc)
    setChunkMethodModalOpen(true)
  }, [])

  const handleChunkMethodSubmit = useCallback(
    async (data: {
      docId: string
      parserId: string
      parserConfig?: Record<string, unknown>
    }) => {
      await updateDocumentParser(data)
      setChunkMethodModalOpen(false)
      setEditingParserDoc(null)
      listState.refetch()
    },
    [updateDocumentParser, listState],
  )

  return {
    uploadModalOpen,
    setUploadModalOpen,
    renameModalOpen,
    setRenameModalOpen,
    newDocName,
    setNewDocName,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    reparseModalOpen,
    setReparseModalOpen,
    reparsingDocs,
    setReparsingDocs,
    isReparsing,
    metadataModalOpen,
    setMetadataModalOpen,
    docMetadataModalOpen,
    setDocMetadataModalOpen,
    editingDocMeta,
    setEditingDocMeta,
    chunkMethodModalOpen,
    setChunkMethodModalOpen,
    editingParserDoc,
    setEditingParserDoc,
    isUpdatingParser,
    handleStartParse,
    handleBatchStartParse,
    handleConfirmParse,
    openRenameModal,
    handleRename,
    requestDelete,
    handleDelete,
    handleBulkDelete,
    handleShowChunkMethodModal,
    handleChunkMethodSubmit,
  }
}
