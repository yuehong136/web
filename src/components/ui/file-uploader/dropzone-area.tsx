import { memo } from 'react'
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from 'react-dropzone'
import { Upload, CloudUpload, FolderUp, Sparkles } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from '../button'
import type { FileUploaderTexts, UploadMode } from './types'

interface DropzoneAreaProps {
  mode: UploadMode
  onDrop: (accepted: File[], rejected: FileRejection[]) => void
  onFolderClick?: () => void
  accept?: DropzoneProps['accept']
  maxSize: number
  maxFiles: number
  multiple: boolean
  isDisabled: boolean
  dropzoneHeight: string
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
  maxFileCount: number
  texts: FileUploaderTexts
}

export const DropzoneArea = memo(function DropzoneArea({
  mode,
  onDrop,
  onFolderClick,
  accept,
  maxSize,
  maxFiles,
  multiple,
  isDisabled,
  dropzoneHeight,
  title,
  description,
  className,
  maxFileCount,
  texts,
}: DropzoneAreaProps) {
  const isFolderMode = mode === 'folder'
  const resolvedTitle = !isFolderMode
    ? title || texts.fileDropTitle
    : texts.folderDropTitle
  const resolvedDescription = !isFolderMode
    ? description || texts.fileDropDescription
    : texts.folderDropDescription

  return (
    <Dropzone
      onDrop={onDrop}
      accept={isFolderMode ? undefined : accept}
      maxSize={maxSize}
      maxFiles={maxFiles}
      multiple={multiple}
      disabled={isDisabled}
      noClick={isFolderMode}
      noDrag={isFolderMode}
    >
      {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
        <div
          {...getRootProps(
            isFolderMode
              ? {
                  onClick: (e) => {
                    e.stopPropagation()
                    onFolderClick?.()
                  },
                }
              : undefined,
          )}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-500 focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background-surface focus-visible:outline-hidden',
            dropzoneHeight,
            !isFolderMode &&
              isDragActive &&
              !isDragReject &&
              'scale-[1.01] border-transparent',
            !isFolderMode &&
              isDragReject &&
              'border-status-error bg-status-error-10',
            isDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
            className,
          )}
          style={{
            backgroundColor:
              !isFolderMode && isDragReject
                ? 'var(--color-status-error-10)'
                : !isFolderMode && isDragActive
                  ? 'var(--color-state-selected-bg)'
                  : 'var(--color-components-upload-bg)',
            borderColor:
              !isFolderMode && isDragReject
                ? 'var(--color-status-error)'
                : !isFolderMode && isDragActive
                  ? 'var(--color-state-selected)'
                  : 'var(--color-components-upload-border)',
          }}
        >
          {!isFolderMode && <input {...getInputProps()} />}

          {!isFolderMode && isDragActive && !isDragReject && (
            <>
              <div
                className="pointer-events-none absolute inset-0 animate-pulse"
                style={{
                  background:
                    'radial-gradient(ellipse at center, var(--color-state-selected-bg) 0%, transparent 70%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, var(--color-state-selected) 25%, var(--color-state-selected) 75%, transparent 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'xor',
                  WebkitMaskComposite: 'xor',
                  padding: '2px',
                  borderRadius: 'inherit',
                }}
              />
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="absolute animate-bounce opacity-30"
                    style={{
                      color: 'var(--color-state-selected-text)',
                      width: '16px',
                      height: '16px',
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${1 + i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          <div className="z-10 flex flex-col items-center justify-center gap-4 px-6 py-8 text-center">
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500',
                !isFolderMode &&
                  isDragActive &&
                  !isDragReject &&
                  'scale-125 rotate-6',
              )}
              style={{
                backgroundColor:
                  !isFolderMode && isDragReject
                    ? 'var(--color-status-error-10)'
                    : !isFolderMode && isDragActive
                      ? 'var(--color-state-selected-bg)'
                      : 'var(--color-background-default)',
                boxShadow:
                  !isFolderMode && isDragActive && !isDragReject
                    ? '0 16px 48px -8px var(--color-state-selected-bg)'
                    : '0 4px 16px -2px rgba(0,0,0,0.08)',
              }}
            >
              {!isFolderMode && isDragActive ? (
                <CloudUpload
                  className={cn(
                    'h-8 w-8 animate-bounce',
                    isDragReject
                      ? 'text-status-error'
                      : 'text-state-selected-text',
                  )}
                />
              ) : isFolderMode ? (
                <FolderUp
                  className="h-7 w-7 transition-all duration-300"
                  style={{ color: 'var(--color-components-upload-icon)' }}
                />
              ) : (
                <Upload
                  className="h-7 w-7 transition-all duration-300 group-hover:scale-110"
                  style={{ color: 'var(--color-components-upload-icon)' }}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p
                className={cn(
                  'font-semibold transition-all duration-300',
                  !isFolderMode && isDragActive && !isDragReject
                    ? 'text-lg'
                    : 'text-base',
                )}
                style={{
                  color:
                    !isFolderMode && isDragReject
                      ? 'var(--color-components-badge-error-text)'
                      : !isFolderMode && isDragActive
                        ? 'var(--color-state-selected-text)'
                        : 'var(--color-components-upload-text)',
                }}
              >
                {!isFolderMode && isDragActive && !isDragReject
                  ? texts.dropActiveTitle
                  : resolvedTitle}
              </p>
              <p
                className="max-w-md text-sm leading-relaxed"
                style={{
                  color: 'var(--color-components-upload-text-secondary)',
                }}
              >
                {resolvedDescription || (
                  <>
                    Upload up to{' '}
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {formatBytes(maxSize)}
                    </span>{' '}
                    and{' '}
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {maxFileCount}
                    </span>{' '}
                    files at a time.
                  </>
                )}
              </p>
            </div>

            {(isFolderMode || (!isFolderMode && !isDragActive)) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
                disabled={isDisabled}
              >
                {isFolderMode ? (
                  <>
                    <FolderUp className="mr-2 h-4 w-4" />
                    {texts.selectFolder}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {texts.selectFile}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </Dropzone>
  )
})
