import { useNavigate, useParams } from 'react-router-dom'
import { ListPageTemplate } from '@/components/page-templates'
import { useAbilities } from '@/hooks/use-abilities'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { BulkActionToolbar } from './bulk-action-toolbar'
import { DocumentEmptyState } from './components/document-empty-state'
import { DocumentListPanel } from './components/document-list-panel'
import { DocumentPageModals } from './components/document-page-modals'
import { DocumentPageToolbar } from './components/document-page-toolbar'
import { GenerateTaskDock } from './generate'
import { useGenerateState } from './generate/hooks'
import {
  useDocumentActions,
  useDocumentListState,
  useDocumentLogModal,
  useDocumentPageModals,
  useFilterCollections,
  useFilterGroup,
} from './hooks/index'
import { useDocumentTableColumns } from './document-table-columns'

export function KnowledgeDocumentsPage() {
  const { id: kbId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { knowledgeBase: currentKnowledgeBase } = useFetchKnowledgeDetail(kbId)
  const listState = useDocumentListState()
  const filterCollections = useFilterCollections(listState.filterOptions)
  const filterGroup = useFilterGroup()
  const actions = useDocumentActions(() => {
    listState.clearSelection()
    listState.refetch()
  })
  const logModal = useDocumentLogModal(listState.documents)
  const generate = useGenerateState(kbId || '')
  const pageModals = useDocumentPageModals({
    currentKnowledgeBase,
    listState,
    actions,
  })
  const chunkNum = currentKnowledgeBase?.chunk_num ?? 0
  const hasMetadataEnabled =
    currentKnowledgeBase?.enable_metadata === true ||
    currentKnowledgeBase?.parser_config?.enable_metadata === true
  const { canDownloadInTenant } = useAbilities()
  const canDownload = canDownloadInTenant(currentKnowledgeBase?.tenant_id)

  const columns = useDocumentTableColumns({
    kbId: kbId || '',
    selectedDocs: listState.selectedDocs,
    hasMetadataEnabled,
    canDownload,
    onSelectDoc: listState.selectDoc,
    onToggleStatus: actions.handleToggleStatus,
    onStartParse: pageModals.handleStartParse,
    onStopParse: (doc) => actions.handleStopParse([doc.id]),
    onRename: pageModals.openRenameModal,
    onDownload: actions.handleDownload,
    onDelete: pageModals.requestDelete,
    onEditMetadata: pageModals.handleShowDocumentMetadata,
    onShowLog: logModal.showLog,
    onShowChunkMethodModal: pageModals.handleShowChunkMethodModal,
  })

  return (
    <ListPageTemplate hideHeader>
      <DocumentPageToolbar
        listState={listState}
        filterCollections={filterCollections}
        filterGroup={filterGroup}
        generate={generate}
        chunkNum={chunkNum}
        onOpenMetadata={() => pageModals.setMetadataModalOpen(true)}
        onOpenUpload={() => pageModals.setUploadModalOpen(true)}
      />

      <GenerateTaskDock
        kbId={kbId || ''}
        graphStatus={generate.graph.status}
        raptorStatus={generate.raptor.status}
        graphTrace={generate.graph.traceData}
        raptorTrace={generate.raptor.traceData}
        disabled={chunkNum <= 0}
        isActionPending={generate.isActionPending}
        onRun={generate.handleRun}
        onPause={generate.handlePause}
        onDelete={generate.handleDeleteRequest}
      />

      <DocumentListPanel listState={listState} columns={columns} />

      <DocumentEmptyState
        listState={listState}
        onOpenUpload={() => pageModals.setUploadModalOpen(true)}
      />

      <BulkActionToolbar
        selectedCount={listState.selectedDocs.size}
        onEnable={() =>
          actions.handleBulkEnable(Array.from(listState.selectedDocs))
        }
        onDisable={() =>
          actions.handleBulkDisable(Array.from(listState.selectedDocs))
        }
        onStartParse={pageModals.handleBatchStartParse}
        onStopParse={() =>
          actions.handleStopParse(Array.from(listState.selectedDocs))
        }
        onDelete={pageModals.handleBulkDelete}
        onClearSelection={listState.clearSelection}
        isLoading={actions.isChangingStatus || actions.isRunning}
      />

      <DocumentPageModals
        kbId={kbId}
        currentKnowledgeBase={currentKnowledgeBase}
        listState={listState}
        pageModals={pageModals}
        logModal={logModal}
        generate={generate}
        navigate={navigate}
        isRenaming={actions.isRenaming}
      />
    </ListPageTemplate>
  )
}
