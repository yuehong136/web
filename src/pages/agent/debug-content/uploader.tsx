import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FileUploadDirectUploadProps {
  value?: any
  onChange?: (value: any) => void
  className?: string
  accept?: string
  multiple?: boolean
}

export function FileUploadDirectUpload({
  value,
  onChange,
  className,
  accept = '*',
  multiple = false,
}: FileUploadDirectUploadProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length > 0) {
        setFiles((prev) => (multiple ? [...prev, ...selectedFiles] : selectedFiles))
        // 通知父组件
        onChange?.(multiple ? [...files, ...selectedFiles] : selectedFiles)
      }
    },
    [files, multiple, onChange],
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
        onClick={handleClick}
        className="w-full border-dashed"
      >
        <Upload className="mr-space-xs size-4" />
        {t('common.uploadFile', '上传文件')}
      </Button>

      {files.length > 0 && (
        <div className="space-y-space-xs">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between px-space-sm py-space-xs bg-surface-secondary rounded-radius-sm"
            >
              <span className="text-sm truncate flex-1">{file.name}</span>
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
