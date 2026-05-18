import { useTranslation } from 'react-i18next'
import type { NavigateFunction } from 'react-router-dom'
import { Button, ConfirmModal, Input, Modal } from '@/components/ui'
import { ChunkMethodModal, ReparseConfirmModal } from '@/components/knowledge'
import { MetadataManageType as MetadataType } from '@/types/api'
import type { KnowledgeBase } from '@/types/api'
import { DocumentMetadataModal, ManageMetadataModal } from '../../metadata'
import { DocumentUploadModal } from '../document-upload-modal'
import { GenerateDeleteConfirm } from '../generate'
import { ProcessLogModal } from '../process-log-modal'
import type { DocumentListState } from '../types'
import type { useDocumentLogModal } from '../hooks/use-document-log-modal'
import type { useDocumentPageModals } from '../hooks/use-document-page-modals'
import type { useGenerateState } from '../generate/hooks'

type PageModals = ReturnType<typeof useDocumentPageModals>
type LogModal = ReturnType<typeof useDocumentLogModal>
type GenerateState = ReturnType<typeof useGenerateState>

interface DocumentPageModalsProps {
  kbId?: string
  currentKnowledgeBase: KnowledgeBase | null
  listState: DocumentListState
  pageModals: PageModals
  logModal: LogModal
  generate: GenerateState
  navigate: NavigateFunction
  isRenaming: boolean
}

export function DocumentPageModals({
  kbId,
  currentKnowledgeBase,
  listState,
  pageModals,
  logModal,
  generate,
  navigate,
  isRenaming,
}: DocumentPageModalsProps) {
  const { t } = useTranslation()

  return (
    <>
      <Modal
        open={pageModals.renameModalOpen}
        onClose={() => pageModals.setRenameModalOpen(false)}
        title={t('knowledge.documents.renameTitle')}
      >
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-text-primary">
              {t('knowledge.documents.newName')}
            </span>
            <Input
              id="newDocName"
              value={pageModals.newDocName}
              onChange={(e) => pageModals.setNewDocName(e.target.value)}
              placeholder={t('knowledge.documents.newNamePlaceholder')}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => pageModals.setRenameModalOpen(false)}
            >
              {t('knowledge.common.cancel')}
            </Button>
            <Button onClick={pageModals.handleRename} loading={isRenaming}>
              {t('knowledge.documents.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={pageModals.deleteConfirmOpen}
        onClose={() => pageModals.setDeleteConfirmOpen(false)}
        onConfirm={pageModals.handleDelete}
        title={t('knowledge.documents.deleteTitle')}
        description={t('knowledge.documents.deleteDescription')}
      />

      {kbId && (
        <DocumentUploadModal
          open={pageModals.uploadModalOpen}
          onClose={() => pageModals.setUploadModalOpen(false)}
          kbId={kbId}
          onSuccess={listState.refetch}
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
        <DocumentMetadataModal
          open={pageModals.docMetadataModalOpen}
          onClose={() => {
            pageModals.setDocMetadataModalOpen(false)
            pageModals.setEditingDocMeta(null)
          }}
          docId={pageModals.editingDocMeta.id}
          docName={pageModals.editingDocMeta.name}
          kbId={kbId}
          metaFields={pageModals.editingDocMeta.meta_fields || {}}
          onSuccess={listState.refetch}
        />
      )}

      <ReparseConfirmModal
        open={pageModals.reparseModalOpen}
        onClose={() => {
          pageModals.setReparseModalOpen(false)
          pageModals.setReparsingDocs([])
        }}
        onConfirm={pageModals.handleConfirmParse}
        documents={pageModals.reparsingDocs}
        knowledgeBase={currentKnowledgeBase}
        isLoading={pageModals.isReparsing}
      />

      <ProcessLogModal
        visible={logModal.logVisible}
        onClose={logModal.hideLog}
        logInfo={logModal.logInfo}
      />

      <ChunkMethodModal
        open={pageModals.chunkMethodModalOpen}
        onClose={() => {
          pageModals.setChunkMethodModalOpen(false)
          pageModals.setEditingParserDoc(null)
        }}
        document={pageModals.editingParserDoc}
        onSubmit={pageModals.handleChunkMethodSubmit}
        isLoading={pageModals.isUpdatingParser}
      />

      <GenerateDeleteConfirm
        open={generate.deleteConfirmOpen}
        type={generate.deletingType}
        onConfirm={generate.handleDeleteConfirm}
        onClose={generate.handleDeleteCancel}
      />
    </>
  )
}
