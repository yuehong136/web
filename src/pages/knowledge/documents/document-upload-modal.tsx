import { useState, useCallback, useEffect, useRef } from 'react'
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
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { reconcileDocumentUploads } from './upload-feedback'

const DOCUMENT_UPLOAD_MAX_SIZE = 1024 * 1024 * 1024
const DOCUMENT_UPLOAD_MAX_FILE_COUNT = 32

// Keep the native File intact; spreading it loses its prototype-backed fields.
type DocumentUploadEntry = Pick<UploadFile, 'status' | 'progress'> & {
  file: UploadFile
  errorKey?: string
}

interface DocumentUploadModalProps {
  open: boolean
  onClose: () => void
  kbId: string
  onSuccess: () => void
}

export function DocumentUploadModal(props: DocumentUploadModalProps) {
  return props.open ? (
    <DocumentUploadSession key={props.kbId} {...props} />
  ) : null
}

function DocumentUploadSession({
  open,
  onClose,
  kbId,
  onSuccess,
}: DocumentUploadModalProps) {
  const { t } = useTranslation()
  const [uploadFiles, setUploadFiles] = useState<DocumentUploadEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [parseOnUpload, setParseOnUpload] = useState(true)
  const [notice, setNotice] = useState<{
    key: string
    values?: Record<string, number>
  }>()
  const active = useRef(false)
  const busy = useRef(false)
  const attempt = useRef(0)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      attempt.current += 1
    }
  }, [])
  const allSucceeded =
    uploadFiles.length > 0 &&
    uploadFiles.every((entry) => entry.status === 'success')
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
    setUploadFiles((previous) =>
      files.map(
        (file) =>
          previous.find((entry) => entry.file === file) ?? {
            file,
            status: file.status,
            progress: file.progress,
          },
      ),
    )
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
          return t('knowledge.documents.upload.fileRejected', {
            name: file.name,
          })
        })
        toast.error(errorMessages.join('; '))
      })
    },
    [t],
  )

  const performUpload = async (files: UploadFile[]) => {
    if (!kbId || !files.length || busy.current) return
    busy.current = true
    const currentAttempt = ++attempt.current
    const isCurrent = () => active.current && attempt.current === currentAttempt
    setUploading(true)
    setNotice(undefined)
    const requested = new Set(files)
    setUploadFiles((previous) =>
      previous.map((entry) =>
        requested.has(entry.file)
          ? { ...entry, status: 'uploading', progress: 0, errorKey: undefined }
          : entry,
      ),
    )
    try {
      const response = await knowledgeAPI.document.upload(kbId, files)
      if (!isCurrent()) return
      const result = reconcileDocumentUploads(files, response)
      const confirmedFiles = new Set(result.confirmed.map(({ file }) => file))
      const errorKey = result.valid
        ? 'knowledge.documents.upload.notConfirmed'
        : 'knowledge.documents.upload.serverResponseError'
      setUploadFiles((previous) =>
        previous.map((entry) =>
          !requested.has(entry.file)
            ? entry
            : confirmedFiles.has(entry.file)
              ? {
                  ...entry,
                  status: 'success',
                  progress: 100,
                  errorKey: undefined,
                }
              : { ...entry, status: 'error', progress: 0, errorKey },
        ),
      )
      if (result.confirmed.length) {
        toast.success(
          t('knowledge.documents.upload.success', {
            count: result.confirmed.length,
          }),
        )
      }
      if (result.unconfirmed.length) {
        const message = t(
          result.valid
            ? 'knowledge.documents.upload.partial'
            : 'knowledge.documents.upload.serverResponseErrorToast',
          {
            successCount: result.confirmed.length,
            errorCount: result.unconfirmed.length,
          },
        )
        setNotice({
          key: result.valid
            ? 'knowledge.documents.upload.partial'
            : 'knowledge.documents.upload.serverResponseErrorToast',
          values: {
            successCount: result.confirmed.length,
            errorCount: result.unconfirmed.length,
          },
        })
        toast.error(message)
      }
      if (parseOnUpload && result.confirmed.length) {
        const ids = result.confirmed.map(({ document }) => document.id)
        try {
          await knowledgeAPI.document.parse(kbId, ids)
          if (!isCurrent()) return
          toast.success(
            t('knowledge.documents.toasts.parseStarted', { count: ids.length }),
          )
        } catch {
          if (!isCurrent()) return
          const message = t('knowledge.documents.upload.autoParseError')
          setNotice({ key: 'knowledge.documents.upload.autoParseError' })
          toast.error(message)
        }
      }
      if (isCurrent() && result.confirmed.length) onSuccess()
    } catch (error) {
      if (!isCurrent()) return
      const errorKey =
        getMutationErrorNotice(error)?.messageKey ??
        'knowledge.documents.upload.failed'
      setUploadFiles((previous) =>
        previous.map((entry) =>
          requested.has(entry.file)
            ? { ...entry, status: 'error', progress: 0, errorKey }
            : entry,
        ),
      )
      const recovery = t('knowledge.documents.upload.retryHint')
      setNotice({ key: 'knowledge.documents.upload.retryHint' })
      toast.error(recovery)
    } finally {
      if (isCurrent()) {
        busy.current = false
        setUploading(false)
      }
    }
  }

  const handleUpload = () =>
    performUpload(
      uploadFiles
        .filter((entry) => entry.status !== 'success')
        .map(({ file }) => file),
    )
  const handleRetryUpload = (_file: UploadFile, index: number) => {
    const entry = uploadFiles[index]
    if (entry && entry.status !== 'success') void performUpload([entry.file])
  }

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
      <div className="flex flex-col gap-space-lg">
        <FileUploader
          value={uploadFiles.map(({ file, errorKey, ...feedback }) =>
            Object.assign(file, feedback, {
              error: errorKey ? t(errorKey) : undefined,
            }),
          )}
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

        {notice && (
          <div
            role="alert"
            className="rounded-radius-md border border-status-warning/30 bg-status-warning-subtle p-space-md text-sm text-text-primary"
          >
            {t(notice.key, notice.values)}
          </div>
        )}
        <div className="flex items-center justify-between gap-space-md rounded-radius-lg bg-background-subtle p-space-md">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">
              {t('knowledge.documents.upload.parseOnUpload')}
            </span>
            <span className="text-xs text-text-tertiary">
              {t('knowledge.documents.upload.parseOnUploadDescription')}
            </span>
          </div>
          <Switch
            aria-label={t('knowledge.documents.upload.parseOnUpload')}
            checked={parseOnUpload}
            onCheckedChange={setParseOnUpload}
            disabled={uploading}
          />
        </div>

        <div className="flex justify-end gap-space-sm border-t border-border-subtle pt-space-md">
          <Button
            variant={allSucceeded ? 'default' : 'outline'}
            onClick={handleClose}
            disabled={uploading}
          >
            {allSucceeded ? t('common.close') : t('knowledge.common.cancel')}
          </Button>
          {!allSucceeded && (
            <Button
              onClick={() => {
                void handleUpload()
              }}
              loading={uploading}
              disabled={uploadFiles.length === 0}
            >
              {uploading
                ? t('knowledge.documents.upload.uploading')
                : uploadFiles.some((entry) => entry.status === 'success')
                  ? t('knowledge.documents.upload.uploadRemaining', {
                      count: uploadFiles.filter(
                        (entry) => entry.status !== 'success',
                      ).length,
                    })
                  : t('knowledge.documents.upload.uploadCount', {
                      count: uploadFiles.length,
                    })}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
