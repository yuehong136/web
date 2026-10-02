import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { ReparseOptions } from '@/api/knowledge-document-ingest'
import { useTranslation } from 'react-i18next'
import { DocumentCreationMode } from '@/api/knowledge-rest'
import { useUpdateDocumentParser } from '@/hooks/use-document-request'
import type { Document, KnowledgeBase } from '@/types/api'
import type { DocumentListState } from '../types'
import type { useDocumentActions } from './use-document-actions'

type DocumentActions = ReturnType<typeof useDocumentActions>

interface UseDocumentPageModalsProps {
  datasetId: string
  currentKnowledgeBase: KnowledgeBase | null
  listState: DocumentListState
  actions: DocumentActions
}

export function useDocumentPageModals({
  datasetId,
  currentKnowledgeBase,
  listState,
  actions,
}: UseDocumentPageModalsProps) {
  const { t } = useTranslation()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [createMode, setCreateMode] = useState<
    DocumentCreationMode.WEB | DocumentCreationMode.EMPTY | null
  >(null)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renamingDoc, setRenamingDoc] = useState<Document | null>(null)
  const [newDocName, setNewDocName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState('')
  const [reparseModalOpen, setReparseModalOpen] = useState(false)
  const [reparsingDocs, setReparsingDocs] = useState<Document[]>([])
  const [isReparsing, setIsReparsing] = useState(false)
  const [reparseOptions, setReparseOptions] = useState<ReparseOptions>({
    deleteChunks: true,
    applyMetadataSettings: true,
  })
  const ownerRef = useRef({ active: false, session: 0, busy: false })
  useLayoutEffect(() => {
    const owner = { active: true, session: 0, busy: false }
    ownerRef.current = owner
    return () => {
      owner.active = false
    }
  }, [datasetId])
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)
  const [docMetadataModalOpen, setDocMetadataModalOpen] = useState(false)
  const [editingDocMeta, setEditingDocMeta] = useState<Document | null>(null)
  const [chunkMethodModalOpen, setChunkMethodModalOpen] = useState(false)
  const [editingParserDoc, setEditingParserDoc] = useState<Document | null>(
    null,
  )
  const [singleFileMetadataModalOpen, setSingleFileMetadataModalOpen] =
    useState(false)
  const [singleFileMetadataDoc, setSingleFileMetadataDoc] =
    useState<Document | null>(null)
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

  const openReparse = useCallback(
    (docs: Document[]) => {
      const owner = ownerRef.current
      if (
        !owner.active ||
        owner.busy ||
        actions.isOperationBusy() ||
        !docs.length
      )
        return
      owner.session += 1
      setReparsingDocs([...docs])
      setReparseOptions({ deleteChunks: true, applyMetadataSettings: true })
      setReparseModalOpen(true)
    },
    [actions],
  )

  const closeReparse = useCallback(() => {
    const owner = ownerRef.current
    if (owner.busy) return
    owner.session += 1
    setReparseModalOpen(false)
    setReparsingDocs([])
  }, [])

  const handleStartParse = useCallback(
    (doc: Document) => {
      if (needsParseConfirmation([doc])) openReparse([doc])
      else void actions.handleStartParse([doc.id])
    },
    [needsParseConfirmation, openReparse, actions],
  )

  const handleBatchStartParse = useCallback(() => {
    const docs = listState.selectedDocuments
    if (needsParseConfirmation(docs)) openReparse(docs)
    else void actions.handleStartParse(docs.map((doc) => doc.id))
  }, [
    needsParseConfirmation,
    openReparse,
    actions,
    listState.selectedDocuments,
  ])

  const handleConfirmParse = useCallback(
    async (options: ReparseOptions) => {
      const owner = ownerRef.current
      if (!owner.active || owner.busy || !reparsingDocs.length) return
      const session = owner.session
      const documents = [...reparsingDocs]
      owner.busy = true
      setIsReparsing(true)
      setReparseOptions({ ...options })
      try {
        const outcome = await actions.handleStartParse(
          documents.map((doc) => doc.id),
          options,
        )
        if (!owner.active || owner.session !== session || !outcome) return
        if (outcome.complete) {
          setReparseModalOpen(false)
          setReparsingDocs([])
        } else {
          setReparsingDocs(
            documents.filter((doc) => outcome.failedIds.includes(doc.id)),
          )
        }
      } finally {
        owner.busy = false
        if (owner.active && owner.session === session) setIsReparsing(false)
      }
    },
    [reparsingDocs, actions],
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

  const handleShowSingleFileMetadataSettings = useCallback((doc: Document) => {
    setSingleFileMetadataDoc(doc)
    setSingleFileMetadataModalOpen(true)
  }, [])

  const handleShowDocumentMetadata = useCallback((doc: Document) => {
    setEditingDocMeta(doc)
    setDocMetadataModalOpen(true)
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
    createMode,
    setCreateMode,
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
    reparseOptions,
    setReparseOptions,
    closeReparse,
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
    singleFileMetadataModalOpen,
    setSingleFileMetadataModalOpen,
    singleFileMetadataDoc,
    setSingleFileMetadataDoc,
    isUpdatingParser,
    handleStartParse,
    handleBatchStartParse,
    handleConfirmParse,
    openRenameModal,
    handleRename,
    requestDelete,
    handleDelete,
    handleBulkDelete,
    handleShowDocumentMetadata,
    handleShowChunkMethodModal,
    handleShowSingleFileMetadataSettings,
    handleChunkMethodSubmit,
  }
}
