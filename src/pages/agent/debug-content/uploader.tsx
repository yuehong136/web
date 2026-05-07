import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'
import { useUploadCanvasFile } from '@/hooks/use-agent-request'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface FileUploadDirectUploadProps {
  canvasId?: string
  value?: unknown
  onChange?: (value: unknown) => void
  className?: string
  accept?: string
  multiple?: boolean
  compact?: boolean
  buttonLabel?: string
  buttonVariant?: ButtonProps['variant']
  buttonSize?: ButtonProps['size']
  buttonClassName?: string
  disabled?: boolean
  iconOnly?: boolean
  showFileList?: boolean
  triggerIcon?: ReactNode
  maxFiles?: number
}

const normalizeUploadResults = (result: unknown): Record<string, unknown>[] => {
  if (Array.isArray(result)) {
    return result.filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object',
    )
  }

  if (result && typeof result === 'object') {
    return [result as Record<string, unknown>]
  }

  return []
}

export function FileUploadDirectUpload({
  canvasId,
  value,
  onChange,
  className,
  accept = '*',
  multiple = false,
  compact = false,
  buttonLabel,
  buttonVariant = 'outline',
  buttonSize,
  buttonClassName,
  disabled = false,
  iconOnly = false,
  showFileList = true,
  triggerIcon,
  maxFiles,
}: FileUploadDirectUploadProps) {
  const { t } = useTranslation()
  const { uploadCanvasFile, isLoading } = useUploadCanvasFile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (Array.isArray(value)) {
      setFiles(value)
      return
    }

    if (value && typeof value === 'object') {
      setFiles([value as Record<string, unknown>])
      return
    }

    setFiles([])
  }, [value])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvasId) {
        toast.error('缺少画布 ID，无法上传文件')
        e.target.value = ''
        return
      }

      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length === 0) {
        return
      }

      try {
        const remainingSlots =
          multiple && typeof maxFiles === 'number'
            ? Math.max(maxFiles - files.length, 0)
            : undefined
        const uploadFiles =
          remainingSlots === undefined
            ? selectedFiles
            : selectedFiles.slice(0, remainingSlots)

        if (uploadFiles.length === 0) {
          toast.error(`最多只能上传 ${maxFiles} 个文件`)
          return
        }

        const uploadedFiles = normalizeUploadResults(
          await uploadCanvasFile({
            canvasId,
            file: multiple ? uploadFiles : uploadFiles[0],
          }),
        )

        const nextFiles = multiple
          ? [...files, ...uploadedFiles]
          : uploadedFiles.slice(0, 1)

        setFiles(nextFiles)
        onChange?.(nextFiles)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : '上传文件失败',
        )
      } finally {
        e.target.value = ''
      }
    },
    [canvasId, files, maxFiles, multiple, onChange, uploadCanvasFile],
  )

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)
      onChange?.(newFiles)
    },
    [files, onChange],
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className={cn('space-y-space-sm', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize || (compact ? 'sm' : 'default')}
        onClick={handleClick}
        className={cn(
          buttonVariant === 'outline' && 'border-dashed',
          compact ? 'w-auto' : 'w-full',
          iconOnly && 'px-0',
          buttonClassName,
        )}
        disabled={disabled || isLoading}
        aria-label={iconOnly ? buttonLabel || t('common.uploadFile', '上传文件') : undefined}
        title={iconOnly ? buttonLabel || t('common.uploadFile', '上传文件') : undefined}
      >
        {triggerIcon || (
          <Upload className={cn('size-4', !iconOnly && 'mr-space-xs')} />
        )}
        {iconOnly ? null : buttonLabel || t('common.uploadFile', '上传文件')}
      </Button>

      {showFileList && files.length > 0 && (
        <div className={cn(compact ? 'flex flex-wrap gap-space-xs' : 'space-y-space-xs')}>
          {files.map((file, index) => (
            <div
              key={`${String(file.name || file.id || index)}-${index}`}
              className="flex items-center justify-between px-space-sm py-space-xs bg-surface-secondary rounded-radius-sm"
            >
              <span className="text-sm truncate flex-1">
                {String(file.name || file.id || `文件 ${index + 1}`)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="p-0 h-auto"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
