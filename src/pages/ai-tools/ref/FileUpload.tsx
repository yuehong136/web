import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Upload } from 'lucide-react'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/lib/toast'
import { documentAPI } from '@/api/document'
import { cn, formatBytes } from '@/lib/utils'

export interface PlaceholderData {
  [key: string]: string
}

export interface ProcessedFile {
  placeholders: PlaceholderData
  file: string
}

interface FileUploadProps {
  onFileUploaded: (file: File) => void
  onFileProcessed: (data: ProcessedFile) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_SIZE = 10 * 1024 * 1024

/**
 * Step 1: one drop zone with its help text inside. The zone takes drops; the
 * button inside opens the file picker, so the keyboard path is a plain
 * button rather than a focusable drop area.
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onFileProcessed,
  isLoading,
  setIsLoading,
}) => {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error(t('aiTools.autoFill.upload.invalidType'))
      return false
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('aiTools.autoFill.upload.tooLarge'))
      return false
    }
    return true
  }

  const processFile = async (file: File) => {
    if (!validateFile(file)) return
    setSelectedFile(file)
    onFileUploaded(file)
    setIsLoading(true)
    try {
      const result = await documentAPI.processDocx(file)
      onFileProcessed({
        placeholders: result.placeholders || {},
        file: result.file,
      })
      toast.success(t('aiTools.autoFill.upload.parsed'))
    } catch (error) {
      console.error(error)
      toast.error(t('aiTools.autoFill.upload.failed'))
      setSelectedFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { [DOCX_MIME]: ['.docx'] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isLoading,
    onDrop: (accepted, rejected) => {
      const file = accepted[0] ?? rejected[0]?.file
      if (file) void processFile(file)
    },
  })

  const example = `{{${t('aiTools.autoFill.upload.placeholderName')}}}`

  return (
    <div
      {...getRootProps({
        'aria-busy': isLoading,
        className: cn(
          'flex flex-col items-center gap-space-md rounded-radius-xl border border-dashed px-space-lg py-space-2xl text-center transition-colors motion-reduce:transition-none',
          isDragActive
            ? 'border-accent-solid bg-accent-soft'
            : 'border-line-strong bg-transparent hover:border-fg-disabled',
        ),
      })}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <span className="relative flex">
          <FileKindTile
            name={selectedFile?.name ?? 'docx'}
            size="lg"
            className="size-12 rounded-radius-lg text-xs"
          />
          {selectedFile ? (
            <CheckCircle2
              aria-hidden="true"
              className="absolute -right-space-xs -bottom-space-xs size-icon-sm rounded-radius-full bg-surface text-success-fg"
            />
          ) : null}
        </span>
      )}
      <div className="flex flex-col gap-space-2xs" aria-live="polite">
        <p className="text-base font-medium text-fg">
          {isLoading
            ? t('aiTools.autoFill.upload.parsing')
            : selectedFile
              ? selectedFile.name
              : t('aiTools.autoFill.upload.dropTitle')}
        </p>
        {isLoading ? (
          <p className="text-sm text-fg-muted">
            {t('aiTools.autoFill.upload.parsingHint')}
          </p>
        ) : selectedFile ? (
          <p className="text-sm text-fg-muted tabular-nums">
            {formatBytes(selectedFile.size)}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant={selectedFile ? 'outline' : 'default'}
        onClick={open}
        disabled={isLoading}
      >
        <Upload aria-hidden="true" />
        {selectedFile
          ? t('aiTools.autoFill.upload.replace')
          : t('aiTools.autoFill.upload.choose')}
      </Button>
      <div className="flex flex-col gap-space-2xs text-xs text-fg-subtle">
        <p>{t('aiTools.autoFill.upload.formatHelp')}</p>
        <p>{t('aiTools.autoFill.upload.placeholderHelp', { example })}</p>
      </div>
    </div>
  )
}

export default FileUpload
