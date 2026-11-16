import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { NavigateFunction } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChunkMethodModal, ReparseConfirmModal } from '@/components/knowledge'
import { MetadataManageType as MetadataType } from '@/types/api'
import type { KnowledgeBase } from '@/types/api'
import { ManageMetadataModal } from '../../metadata'
import { DocumentUploadModal } from '../document-upload-modal'
import { DocumentCreateModal } from '../document-create-modal'
import { DocumentCreationMode } from '@/api/knowledge-rest'
import { metadataConfigToFields } from '@/api/knowledge-metadata'
import { GenerateDeleteConfirm } from '../generate'
import type { DocumentListState } from '../types'
import type { useDocumentPageModals } from '../hooks/use-document-page-modals'
import type { useGenerateState } from '../generate/hooks'

type PageModals = ReturnType<typeof useDocumentPageModals>
type GenerateState = ReturnType<typeof useGenerateState>

interface DocumentPageModalsProps {
  kbId?: string
  currentKnowledgeBase: KnowledgeBase | null
  listState: DocumentListState
  pageModals: PageModals
  generate: GenerateState
  navigate: NavigateFunction
  isRenaming: boolean
  isDeleting?: boolean
}

export function DocumentPageModals({
  kbId,
  currentKnowledgeBase,
  listState,
  pageModals,
  generate,
  navigate,
  isRenaming,
  isDeleting = false,
}: DocumentPageModalsProps) {
  const { t } = useTranslation()
  const metadata = pageModals.singleFileMetadataDoc?.parser_config?.metadata
  const metadataSettings = useMemo(
    () => metadataConfigToFields(metadata),
    [metadata],
  )

  return (
    <>
      <Dialog
        open={pageModals.renameModalOpen}
        onOpenChange={(next) => !next && pageModals.setRenameModalOpen(false)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{t('knowledge.documents.renameTitle')}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <label
              htmlFor="newDocName"
              className="mb-space-xs block text-sm font-medium text-text-primary"
            >
              {t('knowledge.documents.newName')}
            </label>
            <Input
              id="newDocName"
              value={pageModals.newDocName}
              onChange={(e) => pageModals.setNewDocName(e.target.value)}
              placeholder={t('knowledge.documents.newNamePlaceholder')}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => pageModals.setRenameModalOpen(false)}
            >
              {t('knowledge.common.cancel')}
            </Button>
            <Button onClick={pageModals.handleRename} loading={isRenaming}>
              {t('knowledge.documents.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pageModals.deleteConfirmOpen}
        onOpenChange={(next) => !next && pageModals.setDeleteConfirmOpen(false)}
        onConfirm={pageModals.handleDelete}
        variant="destructive"
        pending={isDeleting}
        title={t('knowledge.documents.deleteTitle')}
        description={t('knowledge.documents.deleteDescription')}
        cancelLabel={t('knowledge.common.cancel')}
        confirmLabel={t('knowledge.documents.bulkActions.delete')}
      />

      <ConfirmDialog
        open={Boolean(pageModals.bulkDeleteIds)}
        onOpenChange={(next) => !next && pageModals.cancelBulkDelete()}
        onConfirm={() => void pageModals.confirmBulkDelete()}
        variant="destructive"
        pending={pageModals.isBulkDeleting}
        title={t('knowledge.documents.deleteTitle')}
        description={t('knowledge.documents.bulkDeleteConfirm', {
          count: pageModals.bulkDeleteIds?.length ?? 0,
        })}
        cancelLabel={t('knowledge.common.cancel')}
        confirmLabel={t('knowledge.documents.bulkActions.delete')}
      />

      {kbId && (
        <DocumentUploadModal
          open={pageModals.uploadModalOpen}
          onClose={() => pageModals.setUploadModalOpen(false)}
          kbId={kbId}
          isTableParser={currentKnowledgeBase?.parser_id === 'table'}
          onSuccess={listState.refetch}
        />
      )}

      {kbId && pageModals.createMode && (
        <DocumentCreateModal
          mode={pageModals.createMode}
          kbId={kbId}
          onClose={() => pageModals.setCreateMode(null)}
          onCreated={(document, mode) => {
            pageModals.setCreateMode(null)
            listState.refetch()
            if (mode === DocumentCreationMode.EMPTY) {
              navigate(`/knowledge/${kbId}/documents/${document.id}/chunks`)
            }
          }}
        />
      )}

      {kbId && (
        <ManageMetadataModal
          open={pageModals.metadataModalOpen}
          onClose={() => pageModals.setMetadataModalOpen(false)}
          kbId={kbId}
          mode={MetadataType.MANAGE}
          onSuccess={listState.refetch}
          onNavigateToSettings={() => {
            navigate(`/knowledge/${kbId}/settings?openMetadata=true`)
          }}
        />
      )}

      {pageModals.editingDocMeta && kbId && (
        <ManageMetadataModal
          open={pageModals.docMetadataModalOpen}
          onClose={() => {
            pageModals.setDocMetadataModalOpen(false)
            pageModals.setEditingDocMeta(null)
          }}
          kbId={kbId}
          mode={MetadataType.UPDATE_SINGLE}
          documentId={pageModals.editingDocMeta.id}
          onSuccess={listState.refetch}
        />
      )}

      <ReparseConfirmModal
        open={pageModals.reparseModalOpen}
        onClose={pageModals.closeReparse}
        options={pageModals.reparseOptions}
        onOptionsChange={pageModals.setReparseOptions}
        onConfirm={pageModals.handleConfirmParse}
        documents={pageModals.reparsingDocs}
        knowledgeBase={currentKnowledgeBase}
        isLoading={pageModals.isReparsing}
      />

      <ChunkMethodModal
        open={pageModals.chunkMethodModalOpen}
        onClose={pageModals.closeChunkMethodModal}
        datasetId={kbId ?? ''}
        tenantId={currentKnowledgeBase?.tenant_id ?? ''}
        actorKey={pageModals.parserModalActorKey}
        session={pageModals.parserModalSession}
        errorKey={pageModals.parserModalErrorKey}
        document={pageModals.editingParserDoc}
        onSubmit={pageModals.handleChunkMethodSubmit}
        onMetadataSettingsClick={
          pageModals.handleShowSingleFileMetadataSettings
        }
        savedMetadataSettings={pageModals.savedMetadataSettings}
        isLoading={pageModals.isUpdatingParser}
      />

      {pageModals.singleFileMetadataDoc && kbId && (
        <ManageMetadataModal
          open={pageModals.singleFileMetadataModalOpen}
          onClose={() => {
            pageModals.setSingleFileMetadataModalOpen(false)
            pageModals.setSingleFileMetadataDoc(null)
          }}
          kbId={kbId}
          mode={MetadataType.SINGLE_FILE_SETTING}
          documentId={pageModals.singleFileMetadataDoc.id}
          initialSettings={metadataSettings}
          initialConfig={metadata}
          onSuccess={pageModals.handleSingleFileMetadataSaved}
        />
      )}

      <GenerateDeleteConfirm
        open={generate.deleteConfirmOpen}
        loading={generate.isActionPending}
        type={generate.deletingType}
        onConfirm={generate.handleDeleteConfirm}
        onClose={generate.handleDeleteCancel}
      />
    </>
  )
}
