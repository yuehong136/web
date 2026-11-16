import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  PageErrorState,
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { useAbilities } from '@/hooks/use-abilities'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { cn } from '@/lib/utils'
import type { Document } from '@/types/api'
import { KnowledgeSectionTemplate } from '../components/knowledge-section-template'
import { SectionFooter } from '../components/section-footer'
import { BulkActionToolbar } from './bulk-action-toolbar'
import { DocumentCreateMenu } from './components/document-create-menu'
import { DocumentEmptyState } from './components/document-empty-state'
import { DocumentFilterBar } from './components/document-filter-bar'
import { useDocumentInspectorPanel } from './components/document-inspector'
import { DocumentPageModals } from './components/document-page-modals'
import { PAGE_SIZE_OPTIONS } from './constants'
import {
  DocumentActionCell,
  type DocumentRowHandlers,
} from './document-action-cell'
import { useDocumentTableColumns } from './document-table-columns'
import { GenerateButton, GenerateTaskDock } from './generate'
import { useGenerateState } from './generate/hooks'
import {
  useDocumentActions,
  useDocumentListState,
  useDocumentPageModals,
  useFilterCollections,
} from './hooks/index'
import { useDocumentInspector } from './hooks/use-document-inspector'

export function KnowledgeDocumentsPage() {
  const { id } = useParams<{ id: string }>()
  return <DocumentsPage key={id} />
}

function DocumentsPage() {
  const { t } = useTranslation()
  const { id: kbId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { knowledgeBase: currentKnowledgeBase } = useFetchKnowledgeDetail(kbId)
  const listState = useDocumentListState()
  const filterCollections = useFilterCollections(listState.filterOptions)
  const actions = useDocumentActions(
    () => {
      listState.clearSelection()
      listState.refetch()
    },
    kbId,
    listState.removeSelectedDocs,
  )
  const inspector = useDocumentInspector(listState.documents)
  const generate = useGenerateState(kbId || '')
  const pageModals = useDocumentPageModals({
    datasetId: kbId ?? '',
    currentKnowledgeBase,
    listState,
    actions,
    onDeleted: inspector.closeIfShowing,
  })
  const chunkNum = currentKnowledgeBase?.chunk_num ?? 0
  const { canDownloadInTenant } = useAbilities()
  const canDownload = canDownloadInTenant(currentKnowledgeBase?.tenant_id)

  const handlers = useMemo<DocumentRowHandlers>(
    () => ({
      onOpenDetails: inspector.openDocument,
      onViewChunks: (doc: Document) =>
        navigate(`/knowledge/${kbId}/documents/${doc.id}/chunks`),
      onStartParse: pageModals.handleStartParse,
      onStopParse: (doc: Document) => actions.handleStopParse([doc.id]),
      onRename: pageModals.openRenameModal,
      onDownload: actions.handleDownload,
      onDelete: pageModals.requestDelete,
      onEditMetadata: pageModals.handleShowDocumentMetadata,
      onChangeChunkMethod: pageModals.handleShowChunkMethodModal,
    }),
    [actions, inspector.openDocument, kbId, navigate, pageModals],
  )
  const columns = useDocumentTableColumns({
    onOpenDetails: inspector.openDocument,
    onToggleStatus: actions.handleToggleStatus,
    onShowChunkMethodModal: pageModals.handleShowChunkMethodModal,
  })
  const inspectorPanel = useDocumentInspectorPanel({
    document: inspector.document,
    open: inspector.open,
    onClose: inspector.close,
    canDownload,
    onToggleStatus: actions.handleToggleStatus,
    handlers,
  })

  const { documents } = listState
  const selectedIds = useMemo(
    () => Array.from(listState.selectedDocs),
    [listState.selectedDocs],
  )
  const state = listState.isError
    ? 'error'
    : listState.isLoading && documents.length === 0
      ? 'loading'
      : 'content'
  const empty = !listState.isLoading && documents.length === 0

  return (
    <>
      <KnowledgeSectionTemplate
        title={t('knowledge.documents.title')}
        count={listState.total}
        countLabel={t('knowledge.documents.totalDocuments', {
          count: listState.total,
        })}
        actions={
          <>
            <GenerateButton
              disabled={chunkNum <= 0}
              graphStatus={generate.graph.status}
              raptorStatus={generate.raptor.status}
              graphTrace={generate.graph.traceData}
              raptorTrace={generate.raptor.traceData}
              isActionPending={generate.isActionPending}
              onRun={generate.handleRun}
              onPause={generate.handlePause}
              onDelete={generate.handleDeleteRequest}
            />
            <Button
              variant="ghost"
              onClick={() => pageModals.setMetadataModalOpen(true)}
            >
              <Tag className="size-icon-sm" aria-hidden="true" />
              {t('knowledge.documents.manageMetadata')}
            </Button>
            <DocumentCreateMenu
              onOpenUpload={() => pageModals.setUploadModalOpen(true)}
              onOpenCreate={pageModals.setCreateMode}
            />
          </>
        }
        toolbar={
          <DocumentFilterBar
            listState={listState}
            filterCollections={filterCollections}
          />
        }
        state={state}
        loadingState={
          <PageLoadingState
            title={t('knowledge.documents.loadingTitle')}
            description={t('knowledge.common.preparing')}
          />
        }
        errorState={
          <PageErrorState
            title={t('knowledge.documents.errorTitle')}
            description={t('knowledge.documents.errorDescription')}
            retryLabel={t('knowledge.common.retry')}
            onRetry={listState.refetch}
          />
        }
        inspector={inspectorPanel}
        bodyScroll="none"
      >
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
        {empty ? (
          <div className="scroll-area flex min-h-0 flex-1 overflow-y-auto">
            <DocumentEmptyState
              filtered={listState.hasActiveFilters}
              onClearFilters={listState.clearAllFilters}
              onOpenUpload={() => pageModals.setUploadModalOpen(true)}
              onOpenCreate={pageModals.setCreateMode}
            />
          </div>
        ) : (
          <>
            <div
              data-scroll-root="documents-body"
              className={cn(
                'scroll-area min-h-0 flex-1 overflow-y-auto',
                selectedIds.length > 0 &&
                  'pb-[calc(var(--control-height)+var(--space-xl))]',
              )}
            >
              <DataTable<Document>
                label={t('knowledge.documents.title')}
                columns={columns}
                rows={documents}
                getRowId={(doc) => doc.id}
                selection={{
                  selectedIds,
                  onSelectedIdsChange: (ids) => {
                    const next = new Set(ids)
                    for (const id of selectedIds)
                      if (!next.has(id)) listState.selectDoc(id, false)
                    for (const id of ids) listState.selectDoc(id, true)
                  },
                  rowLabel: (doc) =>
                    t('knowledge.documents.selectDocument', { name: doc.name }),
                  allLabel: t('knowledge.documents.selectAll'),
                }}
                rowActions={(doc) => (
                  <DocumentActionCell
                    document={doc}
                    canDownload={canDownload}
                    handlers={handlers}
                  />
                )}
                onRowClick={inspector.openDocument}
                activeRowId={inspector.document?.id}
              />
            </div>
            <SectionFooter>
              <Pager
                page={listState.page}
                pageSize={listState.pageSize}
                total={listState.total}
                onPageChange={listState.setPage}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(size) => {
                  listState.setPageSize(size)
                  listState.setPage(1)
                }}
              />
            </SectionFooter>
          </>
        )}
        <BulkActionToolbar
          selectedCount={selectedIds.length}
          onEnable={() => actions.handleBulkEnable(selectedIds)}
          onDisable={() => actions.handleBulkDisable(selectedIds)}
          onStartParse={pageModals.handleBatchStartParse}
          onStopParse={() => actions.handleStopParse(selectedIds)}
          onDelete={pageModals.handleBulkDelete}
          onClearSelection={listState.clearSelection}
          isLoading={actions.isChangingStatus || actions.isRunning}
        />
      </KnowledgeSectionTemplate>

      <DocumentPageModals
        kbId={kbId}
        currentKnowledgeBase={currentKnowledgeBase}
        listState={listState}
        pageModals={pageModals}
        generate={generate}
        navigate={navigate}
        isRenaming={actions.isRenaming}
        isDeleting={actions.isDeleting}
      />
    </>
  )
}
