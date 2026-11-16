import { Info, PanelsRightBottom, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { DetailTemplate } from '@/components/page-templates'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button, Tooltip } from '@/components/ui'
import { ROUTES } from '@/constants'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { DocumentStatusBadge } from './documents/document-status-cell'
import { useDocumentParserLabel } from './documents/parser-method-cell'
import { ChunkBulkBar } from './document-chunks/components/chunk-bulk-bar'
import { ChunkEditOverlay } from './document-chunks/components/chunk-edit-overlay'
import { ChunkList } from './document-chunks/components/chunk-list'
import { ChunkModals } from './document-chunks/components/chunk-modals'
import { ChunkToolbar } from './document-chunks/components/chunk-toolbar'
import {
  ChunkSideSheet,
  DocumentChunksWorkspace,
} from './document-chunks/components/document-chunks-shell'
import {
  DocumentInfoPanel,
  DocumentParserPanel,
} from './document-chunks/components/document-info-panel'
import {
  useChunkPanelLayout,
  useDocumentChunksController,
} from './document-chunks/hooks'
import type { ChunkListDocument } from './document-chunks/types'
import { legacyRunStatus } from './document-chunks/utils'

const DocumentChunksPage = () => {
  const { id, docId } = useParams<{ id: string; docId: string }>()
  return <DocumentChunksContent key={`${id}:${docId}`} />
}

/** "128 chunks · General · ● Completed" under the document name. */
function DocumentSubline({ docInfo }: { docInfo: ChunkListDocument }) {
  const { t } = useTranslation()
  const parser = useDocumentParserLabel(docInfo)
  return (
    <span className="inline-flex flex-wrap items-center gap-x-space-sm gap-y-space-2xs text-xs text-text-tertiary">
      <span className="tabular-nums">
        {t('knowledge.chunks.toolbar.totalChunks', {
          count: docInfo.chunk_num || 0,
        })}
      </span>
      <span aria-hidden="true">·</span>
      <span>{parser}</span>
      <span aria-hidden="true">·</span>
      <DocumentStatusBadge
        document={{ ...docInfo, run: legacyRunStatus(docInfo.run) }}
      />
    </span>
  )
}

const DocumentChunksContent = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { knowledgeBase } = useFetchKnowledgeDetail(id)
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
  const sourceShowing = panel.isPanelOpen && panel.tab === 'source'
  const infoShowing = panel.isPanelOpen && panel.tab === 'info'
  const searchSummary = list.debouncedSearchKeyword
    ? t('knowledge.chunks.toolbar.searchHits', {
        keyword: list.debouncedSearchKeyword,
        count: list.total,
      })
    : undefined

  return (
    <DetailTemplate
      className="w-full min-w-0"
      bodyScroll="none"
      crumbs={[
        { label: t('knowledge.nav.knowledge'), to: ROUTES.KNOWLEDGE },
        {
          label: knowledgeBase?.name || t('knowledge.nav.documentFallback'),
          to: `${ROUTES.KNOWLEDGE}/${id}/documents`,
        },
      ]}
      leading={
        list.docInfo ? (
          <FileKindTile
            name={list.docInfo.suffix || list.docInfo.name}
            size="md"
          />
        ) : undefined
      }
      title={
        <span title={list.docInfo?.name}>
          {list.docInfo?.name || t('knowledge.nav.documentFallback')}
        </span>
      }
      subline={
        list.docInfo ? <DocumentSubline docInfo={list.docInfo} /> : undefined
      }
      actions={
        <>
          <Button
            variant={sourceShowing ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => panel.togglePanel('source')}
            aria-pressed={sourceShowing}
            disabled={!list.docInfo}
          >
            <PanelsRightBottom className="size-icon-sm" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t('knowledge.chunks.workspace.source')}
            </span>
          </Button>
          <Tooltip content={t('knowledge.chunks.info.title')}>
            <Button
              variant={infoShowing ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => panel.togglePanel('info')}
              aria-label={t('knowledge.chunks.info.title')}
              aria-pressed={infoShowing}
              disabled={!list.docInfo || Boolean(list.error)}
            >
              <Info className="size-icon-sm" aria-hidden="true" />
              <span className="hidden sm:inline">
                {t('knowledge.chunks.info.title')}
              </span>
            </Button>
          </Tooltip>
          <Button size="sm" onClick={addForm.open} disabled={disabled}>
            <Plus className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.chunks.toolbar.addChunk')}
          </Button>
        </>
      }
    >
      <DocumentChunksWorkspace
        previewOpen={panel.isPanelOpen && Boolean(list.docInfo)}
        onClosePreview={panel.closePanel}
        panelTab={panel.tab}
        onPanelTabChange={panel.setTab}
        onSplitChange={panel.onSplitChange}
        docId={list.docId}
        docInfo={list.docInfo}
        selectedChunk={editForm.selectedChunk}
        infoPanel={
          <DocumentInfoPanel
            docInfo={list.docInfo}
            selectedChunk={editForm.selectedChunk}
            onClearSelectedChunk={editForm.clearSelected}
            onStartMetaAnnotation={c.handleStartMetaAnnotation}
            disabled={disabled}
          />
        }
        configPanel={<DocumentParserPanel docInfo={list.docInfo} />}
      >
        <ChunkToolbar
          knowledgeIds={list.kbId ? [list.kbId] : []}
          textMode={list.textMode}
          onTextModeChange={list.setTextMode}
          searchKeyword={list.searchKeyword}
          onSearchKeywordChange={list.setSearchKeyword}
          filterStatus={list.filterStatus}
          onFilterStatusChange={list.setFilterStatus}
          total={list.total}
          documentTotal={list.docInfo?.chunk_num}
          isAllSelected={selection.isAllSelected(list.filteredChunks)}
          isPartialSelected={selection.isPartialSelected(list.filteredChunks)}
          onSelectAll={c.handleSelectAll}
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
          sourceVisible={sourceShowing}
          summary={searchSummary}
          hasSelection={selection.hasSelected}
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
        <ChunkBulkBar
          selectedCount={selection.selectedCount}
          onBulkEnable={c.handleBulkEnable}
          onBulkDisable={c.handleBulkDisable}
          onBulkDeleteClick={deleteState.openBulkDelete}
          onClearSelection={selection.clear}
          disabled={disabled}
        />
      </DocumentChunksWorkspace>
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
    </DetailTemplate>
  )
}

export { DocumentChunksPage }
