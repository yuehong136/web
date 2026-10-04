import { FileText, Info, PanelsLeftBottom, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import { PageHeader } from '@/components/patterns'
import { Button, Tooltip } from '@/components/ui'
import { ChunkEditOverlay } from './document-chunks/components/chunk-edit-overlay'
import { ChunkList } from './document-chunks/components/chunk-list'
import { ChunkModals } from './document-chunks/components/chunk-modals'
import { ChunkToolbar } from './document-chunks/components/chunk-toolbar'
import {
  ChunkSideSheet,
  DocumentChunksWorkspace,
} from './document-chunks/components/document-chunks-shell'
import { DocumentInfoPanel } from './document-chunks/components/document-info-panel'
import {
  useChunkPanelLayout,
  useDocumentChunksController,
} from './document-chunks/hooks'

const DocumentChunksPage = () => {
  const { id, docId } = useParams<{ id: string; docId: string }>()
  return <DocumentChunksContent key={`${id}:${docId}`} />
}

const DocumentChunksContent = () => {
  const { t } = useTranslation()
  const panel = useChunkPanelLayout()
  const c = useDocumentChunksController()
  const { list, selection, addForm, editForm, metaForm, deleteState } = c
  const mutationPending = Object.values(c.pending).some(Boolean)
  const disabled =
    mutationPending ||
    list.isPlaceholderData ||
    list.loading ||
    Boolean(list.error)
  const closeEditor = () => {
    if (!c.pending.save) editForm.reset()
  }

  return (
    <ConsolePageTemplate
      bodyOverflow="hidden"
      className="w-full min-w-0"
      header={
        <PageHeader
          compact
          wrapActions
          surface="elevated"
          titleSize="md"
          leading={<FileText className="size-icon-lg text-text-secondary" />}
          title={
            <span className="block truncate" title={list.docInfo?.name}>
              {list.docInfo?.name || t('knowledge.nav.documentFallback')}
            </span>
          }
          description={t('knowledge.chunks.workspace.description')}
          actions={
            <div className="flex flex-wrap items-center gap-space-xs">
              <Button
                variant={panel.isPreviewPanelOpen ? 'secondary' : 'ghost'}
                size="sm"
                onClick={panel.togglePreview}
                aria-pressed={panel.isPreviewPanelOpen}
                disabled={!list.docInfo}
              >
                <PanelsLeftBottom className="size-icon-sm" />
                {t('knowledge.chunks.workspace.source')}
              </Button>
              <Tooltip content={t('knowledge.chunks.info.title')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={panel.openInfo}
                  aria-label={t('knowledge.chunks.info.title')}
                  disabled={!list.docInfo || Boolean(list.error)}
                >
                  <Info className="size-icon-sm" />
                  <span className="hidden sm:inline">
                    {t('knowledge.chunks.info.title')}
                  </span>
                </Button>
              </Tooltip>
              <Button size="sm" onClick={addForm.open} disabled={disabled}>
                <Plus className="size-icon-sm" />
                {t('knowledge.chunks.toolbar.addChunk')}
              </Button>
            </div>
          }
        />
      }
    >
      <DocumentChunksWorkspace
        previewOpen={panel.isPreviewPanelOpen}
        onClosePreview={panel.closePreview}
        docId={list.docId}
        docInfo={list.docInfo}
        selectedChunk={editForm.selectedChunk}
      >
        <ChunkToolbar
          textMode={list.textMode}
          onTextModeChange={list.setTextMode}
          searchKeyword={list.searchKeyword}
          onSearchKeywordChange={list.setSearchKeyword}
          filterStatus={list.filterStatus}
          onFilterStatusChange={list.setFilterStatus}
          total={list.total}
          isAllSelected={selection.isAllSelected(list.filteredChunks)}
          isPartialSelected={selection.isPartialSelected(list.filteredChunks)}
          selectedCount={selection.selectedCount}
          hasSelected={selection.hasSelected}
          onSelectAll={c.handleSelectAll}
          onClearSelection={selection.clear}
          onBulkEnable={c.handleBulkEnable}
          onBulkDisable={c.handleBulkDisable}
          onBulkDeleteClick={deleteState.openBulkDelete}
          isBulkSwitchPending={c.pending.bulkSwitch}
          isDeletePending={c.pending.delete}
          disabled={disabled}
          isRefreshing={list.isRefreshing}
        />
        <ChunkList
          loading={list.loading}
          error={list.error}
          chunks={list.chunks}
          filteredChunks={list.filteredChunks}
          total={list.total}
          page={list.page}
          pageSize={list.pageSize}
          selectedChunk={editForm.selectedChunk}
          selectedChunkIds={selection.selectedChunkIds}
          textMode={list.textMode}
          filterKey={`${list.debouncedSearchKeyword}:${list.filterStatus}`}
          isMutationPending={disabled}
          isRefreshing={list.isRefreshing}
          onRefetch={() => list.refetchChunkList()}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          onSelectChunk={(chunk) => {
            if (editForm.selectedChunk?.chunk_id === chunk.chunk_id)
              editForm.clearSelected()
            else c.handleSelectChunk(chunk)
          }}
          onEditChunk={c.handleStartEdit}
          onToggleChunkStatus={c.handleToggleChunkStatus}
          onDeleteChunk={deleteState.openDeleteSingle}
          onCheckboxChange={selection.toggleSingle}
          onPreviewImage={c.setPreviewImageId}
        />
      </DocumentChunksWorkspace>
      <ChunkSideSheet
        open={panel.isInfoPanelOpen}
        onClose={panel.closeInfo}
        title={t('knowledge.chunks.info.title')}
      >
        <DocumentInfoPanel
          docInfo={list.docInfo}
          selectedChunk={editForm.selectedChunk}
          onCollapsePanel={panel.closeInfo}
          onClearSelectedChunk={editForm.clearSelected}
          onStartMetaAnnotation={c.handleStartMetaAnnotation}
          disabled={disabled}
        />
      </ChunkSideSheet>
      <ChunkSideSheet
        open={editForm.isEditMode}
        onClose={closeEditor}
        title={t('knowledge.chunks.edit.title')}
      >
        {editForm.selectedChunk && (
          <ChunkEditOverlay
            selectedChunk={editForm.selectedChunk}
            editingChunkContent={editForm.editingChunkContent}
            onEditingChunkContentChange={editForm.setEditingChunkContent}
            editingImportantKwd={editForm.editingImportantKwd}
            onEditingImportantKwdChange={editForm.setEditingImportantKwd}
            editingQuestionKwd={editForm.editingQuestionKwd}
            onEditingQuestionKwdChange={editForm.setEditingQuestionKwd}
            editingImage={editForm.editingImage}
            onEditingImageChange={editForm.setEditingImage}
            isMarkdownPreview={editForm.isMarkdownPreview}
            onMarkdownPreviewChange={editForm.setIsMarkdownPreview}
            onCancel={closeEditor}
            onSave={c.handleEditChunk}
            onPreviewImage={c.setPreviewImageId}
            isPending={c.pending.save}
            canSubmit={editForm.canSubmit && !disabled}
          />
        )}
      </ChunkSideSheet>
      <ChunkModals
        canSaveMeta={!disabled}
        canCreateChunk={!disabled}
        isCreatePending={c.pending.create}
        isDeletePending={c.pending.delete}
        isSetMetaPending={c.pending.metadata}
        addChunkModalOpen={addForm.addChunkModalOpen}
        onAddChunkModalClose={addForm.close}
        newChunkContent={addForm.content}
        onNewChunkContentChange={addForm.setContent}
        newImportantKwd={addForm.importantKwd}
        onNewImportantKwdChange={addForm.setImportantKwd}
        newQuestionKwd={addForm.questionKwd}
        onNewQuestionKwdChange={addForm.setQuestionKwd}
        newImage={addForm.image}
        onNewImageChange={addForm.setImage}
        onCreateChunk={c.handleCreateChunk}
        deleteConfirmOpen={deleteState.deleteConfirmOpen}
        onDeleteConfirmClose={deleteState.closeDeleteSingle}
        onDeleteConfirm={c.handleDeleteChunk}
        deletingChunkId={deleteState.deletingChunkId}
        deleteSelectedConfirmOpen={deleteState.deleteSelectedConfirmOpen}
        onDeleteSelectedConfirmClose={deleteState.closeBulkDelete}
        onDeleteSelectedConfirm={c.handleBulkDelete}
        selectedChunkCount={selection.selectedCount}
        metaModalOpen={metaForm.metaModalOpen}
        onMetaModalClose={metaForm.close}
        editingMeta={metaForm.editingMeta}
        onAddMetaField={metaForm.addField}
        onRemoveMetaField={metaForm.removeField}
        onUpdateMetaKey={metaForm.updateKey}
        onUpdateMetaValue={metaForm.updateValue}
        onSaveMeta={c.handleSaveMeta}
        previewImageId={c.previewImageId}
        onPreviewImageClose={() => c.setPreviewImageId(null)}
      />
    </ConsolePageTemplate>
  )
}

export { DocumentChunksPage }
