import { ChunkEditOverlay } from './document-chunks/components/chunk-edit-overlay'
import { ChunkList } from './document-chunks/components/chunk-list'
import { ChunkModals } from './document-chunks/components/chunk-modals'
import { ChunkToolbar } from './document-chunks/components/chunk-toolbar'
import {
  DocumentInfoShell,
  DocumentPreviewPane,
} from './document-chunks/components/document-chunks-shell'
import { DocumentInfoPanel } from './document-chunks/components/document-info-panel'
import {
  useChunkPanelLayout,
  useDocumentChunksController,
} from './document-chunks/hooks'

const DocumentChunksPage = () => {
  const panel = useChunkPanelLayout()
  const c = useDocumentChunksController({
    onSelectChunk: panel.openInfo,
    onStartEdit: panel.openInfo,
  })

  const { list, selection, addForm, editForm, metaForm, deleteState, actions } =
    c

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background-default">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <DocumentPreviewPane
          open={panel.isPreviewPanelOpen}
          docId={list.docId}
          docInfo={list.docInfo}
          selectedChunk={editForm.selectedChunk}
          style={panel.previewPanelStyle}
          width={panel.previewPanelWidth}
          onClose={panel.closePreview}
          onResizeStart={panel.handleResizeStart}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background-surface">
          <ChunkToolbar
            textMode={list.textMode}
            onTextModeChange={list.setTextMode}
            isPreviewPanelOpen={panel.isPreviewPanelOpen}
            onOpenPreviewPanel={panel.openPreview}
            isSearchOpen={list.isSearchOpen}
            onSearchOpenChange={list.setIsSearchOpen}
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
            onBulkEnable={c.handleBulkEnable}
            onBulkDisable={c.handleBulkDisable}
            onBulkDeleteClick={deleteState.openBulkDelete}
            isBulkSwitchPending={actions.isBulkSwitchPending}
            isDeletePending={actions.isDeletePending}
            onAddChunk={addForm.open}
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
            onRefetch={() => list.refetchChunkList()}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            onSelectChunk={c.handleSelectChunk}
            onEditChunk={c.handleStartEdit}
            onToggleChunkStatus={c.handleToggleChunkStatus}
            onDeleteChunk={deleteState.openDeleteSingle}
            onCheckboxChange={selection.toggleSingle}
            onPreviewImage={c.setPreviewImageUrl}
          />
        </div>

        <DocumentInfoShell
          open={panel.isInfoPanelOpen}
          style={panel.infoPanelStyle}
          width={panel.infoPanelWidth}
          onOpen={panel.openInfo}
          onResizeStart={panel.handleResizeStart}
        >
          {panel.isInfoPanelOpen &&
            editForm.isEditMode &&
            editForm.selectedChunk && (
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
                onCancel={editForm.reset}
                onSave={c.handleEditChunk}
                onPreviewImage={c.setPreviewImageUrl}
              />
            )}

          {panel.isInfoPanelOpen && !editForm.isEditMode && (
            <DocumentInfoPanel
              docInfo={list.docInfo}
              selectedChunk={editForm.selectedChunk}
              onCollapsePanel={panel.closeInfo}
              onClearSelectedChunk={editForm.clearSelected}
              onStartMetaAnnotation={c.handleStartMetaAnnotation}
            />
          )}
        </DocumentInfoShell>
      </div>

      <ChunkModals
        addChunkModalOpen={addForm.addChunkModalOpen}
        onAddChunkModalClose={addForm.close}
        newChunkContent={addForm.content}
        onNewChunkContentChange={addForm.setContent}
        newImportantKwd={addForm.importantKwd}
        onNewImportantKwdChange={addForm.setImportantKwd}
        newQuestionKwd={addForm.questionKwd}
        onNewQuestionKwdChange={addForm.setQuestionKwd}
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
        previewImageUrl={c.previewImageUrl}
        onPreviewImageClose={() => c.setPreviewImageUrl(null)}
      />
    </div>
  )
}

export { DocumentChunksPage }
