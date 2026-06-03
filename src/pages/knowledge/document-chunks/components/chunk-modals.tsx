import type { MetadataEntry } from '../types'
import type { UploadFile } from '@/components/ui/file-uploader'
import { AddChunkModal } from './add-chunk-modal'
import { ChunkDeleteConfirms } from './chunk-delete-confirms'
import { ChunkImagePreviewModal } from './chunk-image-preview-modal'
import { ChunkMetadataModal } from './chunk-metadata-modal'

interface ChunkModalsProps {
  addChunkModalOpen: boolean
  onAddChunkModalClose: () => void
  newChunkContent: string
  onNewChunkContentChange: (content: string) => void
  newImportantKwd: string[]
  onNewImportantKwdChange: (keywords: string[]) => void
  newQuestionKwd: string[]
  onNewQuestionKwdChange: (questions: string[]) => void
  newImage: UploadFile[]
  onNewImageChange: (files: UploadFile[]) => void
  onCreateChunk: () => void
  deleteConfirmOpen: boolean
  onDeleteConfirmClose: () => void
  onDeleteConfirm: () => void
  deletingChunkId: string
  deleteSelectedConfirmOpen: boolean
  onDeleteSelectedConfirmClose: () => void
  onDeleteSelectedConfirm: () => void
  selectedChunkCount: number
  metaModalOpen: boolean
  onMetaModalClose: () => void
  editingMeta: MetadataEntry[]
  onAddMetaField: () => void
  onRemoveMetaField: (id: string) => void
  onUpdateMetaKey: (id: string, key: string) => void
  onUpdateMetaValue: (id: string, value: unknown) => void
  onSaveMeta: () => void
  previewImageUrl: string | null
  onPreviewImageClose: () => void
}

export const ChunkModals = ({
  addChunkModalOpen,
  onAddChunkModalClose,
  newChunkContent,
  onNewChunkContentChange,
  newImportantKwd,
  onNewImportantKwdChange,
  newQuestionKwd,
  onNewQuestionKwdChange,
  newImage,
  onNewImageChange,
  onCreateChunk,
  deleteConfirmOpen,
  onDeleteConfirmClose,
  onDeleteConfirm,
  deletingChunkId,
  deleteSelectedConfirmOpen,
  onDeleteSelectedConfirmClose,
  onDeleteSelectedConfirm,
  selectedChunkCount,
  metaModalOpen,
  onMetaModalClose,
  editingMeta,
  onAddMetaField,
  onRemoveMetaField,
  onUpdateMetaKey,
  onUpdateMetaValue,
  onSaveMeta,
  previewImageUrl,
  onPreviewImageClose,
}: ChunkModalsProps) => (
  <>
    <AddChunkModal
      open={addChunkModalOpen}
      onClose={onAddChunkModalClose}
      content={newChunkContent}
      onContentChange={onNewChunkContentChange}
      importantKwd={newImportantKwd}
      onImportantKwdChange={onNewImportantKwdChange}
      questionKwd={newQuestionKwd}
      onQuestionKwdChange={onNewQuestionKwdChange}
      image={newImage}
      onImageChange={onNewImageChange}
      onCreate={onCreateChunk}
    />

    <ChunkDeleteConfirms
      deleteConfirmOpen={deleteConfirmOpen}
      onDeleteConfirmClose={onDeleteConfirmClose}
      onDeleteConfirm={onDeleteConfirm}
      deletingChunkId={deletingChunkId}
      deleteSelectedConfirmOpen={deleteSelectedConfirmOpen}
      onDeleteSelectedConfirmClose={onDeleteSelectedConfirmClose}
      onDeleteSelectedConfirm={onDeleteSelectedConfirm}
      selectedChunkCount={selectedChunkCount}
    />

    <ChunkMetadataModal
      open={metaModalOpen}
      onClose={onMetaModalClose}
      editingMeta={editingMeta}
      onAddMetaField={onAddMetaField}
      onRemoveMetaField={onRemoveMetaField}
      onUpdateMetaKey={onUpdateMetaKey}
      onUpdateMetaValue={onUpdateMetaValue}
      onSaveMeta={onSaveMeta}
    />

    <ChunkImagePreviewModal
      previewImageUrl={previewImageUrl}
      onClose={onPreviewImageClose}
    />
  </>
)
