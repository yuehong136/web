import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UploadFile } from '@/components/ui/file-uploader'
import { toast } from '@/lib/toast'
import { DOCUMENT_UPLOAD_MAX_FILE_COUNT, seedUploadFiles } from '../upload-seed'

/**
 * Opens the upload dialog, optionally with files dropped on the page. Files
 * over the dialog's limits are reported the way the dialog reports them.
 */
export function useDocumentDropUpload(setOpen: (open: boolean) => void) {
  const { t } = useTranslation()
  const [initialFiles, setInitialFiles] = useState<UploadFile[]>([])

  const openUpload = useCallback(
    (files?: File[]) => {
      if (files?.length) {
        const { accepted, tooLarge, overflow } = seedUploadFiles(files)
        for (const file of tooLarge)
          toast.error(
            t('knowledge.documents.upload.fileTooLarge', { name: file.name }),
          )
        if (overflow)
          toast.error(
            t('knowledge.documents.upload.tooManyFilesWithLimit', {
              count: DOCUMENT_UPLOAD_MAX_FILE_COUNT,
            }),
          )
        setInitialFiles(accepted)
      } else setInitialFiles([])
      setOpen(true)
    },
    [setOpen, t],
  )

  const closeUpload = useCallback(() => {
    setOpen(false)
    setInitialFiles([])
  }, [setOpen])

  return { initialFiles, openUpload, closeUpload }
}
