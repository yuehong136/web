import { useState, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Modal,
  Button,
  FileUploader,
  Switch,
  type UploadFile,
  type FileRejection,
  type FileUploaderTexts,
} from '@/components/ui'
import { knowledgeAPI } from '@/api/knowledge'
import { toast } from '@/lib/toast'

const DOCUMENT_UPLOAD_MAX_SIZE = 1024 * 1024 * 1024
const DOCUMENT_UPLOAD_MAX_FILE_COUNT = 32

interface DocumentUploadModalProps {
  open: boolean
  onClose: () => void
  kbId: string
  onSuccess: () => void
}

export function DocumentUploadModal({
  open,
  onClose,
  kbId,
  onSuccess,
}: DocumentUploadModalProps) {
  const { t } = useTranslation()
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [parseOnUpload, setParseOnUpload] = useState(true)
  const uploadTexts: Partial<FileUploaderTexts> = {
    fileTab: t('knowledge.documents.upload.fileTab'),
    folderTab: t('knowledge.documents.upload.folderTab'),
    dropActiveTitle: t('knowledge.documents.upload.dropActiveTitle'),
    fileDropTitle: t('knowledge.documents.upload.fileDropTitle'),
    folderDropTitle: t('knowledge.documents.upload.folderDropTitle'),
    fileDropDescription: (
      <Trans
        i18nKey="knowledge.documents.upload.description"
        components={{
          strong: <span className="font-medium text-text-primary" />,
        }}
      />
    ),
    folderDropDescription: t(
      'knowledge.documents.upload.folderDropDescription',
    ),
    selectFile: t('knowledge.documents.upload.selectFile'),
    selectFolder: t('knowledge.documents.upload.selectFolder'),
    selectedFiles: (count, maxFileCount) => (
      <>
        {t('knowledge.documents.upload.selectedFiles', { count })}
        <span className="text-text-tertiary"> / {maxFileCount}</span>
      </>
    ),
    clearAll: t('knowledge.documents.upload.clearAll'),
    totalSize: t('knowledge.documents.upload.totalSize'),
    remainingFiles: (count) =>
      t('knowledge.documents.upload.remainingFiles', { count }),
    uploadSuccess: t('knowledge.documents.upload.uploadSuccessStatus'),
    uploadFailed: t('knowledge.documents.upload.failed'),
    uploading: t('knowledge.documents.upload.uploading'),
    retryUpload: t('knowledge.documents.upload.retryUpload'),
    removeFile: t('knowledge.documents.upload.removeFile'),
    tooManyFiles: (count) =>
      t('knowledge.documents.upload.tooManyFilesWithLimit', { count }),
  }

  const handleUploadFilesChange = useCallback((files: UploadFile[]) => {
    setUploadFiles(files)
  }, [])

  const handleFilesRejected = useCallback(
    (rejectedFiles: FileRejection[]) => {
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMessages = errors.map((e) => {
          if (e.code === 'file-too-large') {
            return t('knowledge.documents.upload.fileTooLarge', {
              name: file.name,
            })
          }
          if (e.code === 'file-invalid-type') {
            return t('knowledge.documents.upload.fileInvalidType', {
              name: file.name,
            })
          }
          if (e.code === 'too-many-files') {
            return t('knowledge.documents.upload.tooManyFilesWithLimit', {
              count: DOCUMENT_UPLOAD_MAX_FILE_COUNT,
            })
          }
          return e.message
        })
        toast.error(errorMessages.join('; '))
      })
    },
    [t],
  )

  const handleUpload = async () => {
    if (!kbId || uploadFiles.length === 0) return

    const filesToUpload = uploadFiles.filter((f) => f.status !== 'success')
    if (filesToUpload.length === 0) {
      toast.info(t('knowledge.documents.upload.allUploaded'))
      handleClose()
      return
    }

    try {
      setUploading(true)

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status !== 'success'
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f,
        ),
      )

      const uploadedDocs = await knowledgeAPI.document.upload(
        kbId,
        filesToUpload,
      )

      if (uploadedDocs && uploadedDocs.length > 0) {
        setUploadFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: 'success' as const,
            progress: 100,
          })),
        )

        toast.success(
          t('knowledge.documents.upload.success', {
            count: uploadedDocs.length,
          }),
        )

        if (parseOnUpload) {
          try {
            const docIds = uploadedDocs.map((doc) => doc.id)
            await knowledgeAPI.document.parse(kbId, docIds)
            toast.success(
              t('knowledge.documents.toasts.parseStarted', {
                count: docIds.length,
              }),
            )
          } catch (parseError) {
            console.error('Auto parse failed:', parseError)
            toast.error(t('knowledge.documents.upload.autoParseError'))
          }
        }

        setTimeout(() => {
          handleClose()
          onSuccess()
        }, 800)
      } else {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? {
                  ...f,
                  status: 'error' as const,
                  error: t('knowledge.documents.upload.serverResponseError'),
                }
              : f,
          ),
        )
        toast.error(t('knowledge.documents.upload.serverResponseErrorToast'))
      }
    } catch (error) {
      console.error('Document upload failed:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('knowledge.documents.upload.unknownError')

      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f,
        ),
      )

      toast.error(
        t('knowledge.documents.upload.failedWithMessage', {
          message: errorMessage,
        }),
      )
    } finally {
      setUploading(false)
    }
  }

  const handleRetryUpload = useCallback(
    async (file: UploadFile, index: number) => {
      if (!kbId) return

      setUploadFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'uploading' as const,
                progress: 0,
                error: undefined,
              }
            : f,
        ),
      )

      try {
        const uploadedDocs = await knowledgeAPI.document.upload(kbId, [file])

        if (uploadedDocs && uploadedDocs.length > 0) {
          setUploadFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: 'success' as const, progress: 100 }
                : f,
            ),
          )
          toast.success(
            t('knowledge.documents.upload.fileUploadSuccess', {
              name: file.name,
            }),
          )
        } else {
          setUploadFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? {
                    ...f,
                    status: 'error' as const,
                    error: t('knowledge.documents.upload.failed'),
                  }
                : f,
            ),
          )
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : t('knowledge.documents.upload.failed')
        setUploadFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: 'error' as const, error: errorMessage }
              : f,
          ),
        )
      }
    },
    [kbId, t],
  )

  const handleClose = () => {
    if (!uploading) {
      setUploadFiles([])
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('knowledge.documents.upload.title')}
      size="lg"
    >
      <div className="space-y-6">
        <FileUploader
          value={uploadFiles}
          onValueChange={handleUploadFilesChange}
          onFilesRejected={handleFilesRejected}
          onRetry={handleRetryUpload}
          maxSize={DOCUMENT_UPLOAD_MAX_SIZE}
          maxFileCount={DOCUMENT_UPLOAD_MAX_FILE_COUNT}
          multiple={true}
          showProgress={true}
          disabled={uploading}
          dropzoneHeight="min-h-[180px]"
          listMaxHeight="max-h-[240px]"
          texts={uploadTexts}
        />

        <div className="rounded-radius-lg bg-surface-secondary flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">
              {t('knowledge.documents.upload.parseOnUpload')}
            </span>
            <span className="text-xs text-text-tertiary">
              {t('knowledge.documents.upload.parseOnUploadDescription')}
            </span>
          </div>
          <Switch
            checked={parseOnUpload}
            onCheckedChange={setParseOnUpload}
            disabled={uploading}
          />
        </div>

        <div className="flex justify-end space-x-3 border-t border-border-subtle pt-4">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {t('knowledge.common.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            loading={uploading}
            disabled={
              uploadFiles.length === 0 ||
              uploadFiles.every((f) => f.status === 'success')
            }
          >
            {uploading
              ? t('knowledge.documents.upload.uploading')
              : uploadFiles.some((f) => f.status === 'success')
                ? t('knowledge.documents.upload.uploadRemaining', {
                    count: uploadFiles.filter((f) => f.status !== 'success')
                      .length,
                  })
                : t('knowledge.documents.upload.uploadCount', {
                    count: uploadFiles.length,
                  })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
