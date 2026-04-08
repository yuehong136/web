import { Button } from '@/components/ui/button'
import { useUploadCanvasFile } from '@/hooks/use-agent-request'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
        const uploadedFiles = await Promise.all(
          selectedFiles.map((file) =>
            uploadCanvasFile({
              canvasId,
              file,
            }),
          ),
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
    [canvasId, files, multiple, onChange, uploadCanvasFile],
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
        variant="outline"
        size={compact ? 'sm' : 'default'}
        onClick={handleClick}
        className={cn('border-dashed', compact ? 'w-auto' : 'w-full')}
        disabled={isLoading}
      >
        <Upload className="mr-space-xs size-4" />
        {buttonLabel || t('common.uploadFile', '上传文件')}
      </Button>

      {files.length > 0 && (
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
