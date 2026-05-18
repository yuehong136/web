import { memo, useMemo } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from '../button'
import { FileCard } from './file-card'
import type { FileUploaderTexts, UploadFile } from './types'

interface FileListProps {
  files: UploadFile[]
  maxFileCount: number
  onRemove: (index: number) => void
  onRetry?: (index: number) => void
  onClearAll: () => void
  showProgress: boolean
  compact: boolean
  listMaxHeight: string
  texts: FileUploaderTexts
}

export const FileList = memo(function FileList({
  files,
  maxFileCount,
  onRemove,
  onRetry,
  onClearAll,
  showProgress,
  compact,
  listMaxHeight,
  texts,
}: FileListProps) {
  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0)
    const uploadingCount = files.filter((f) => f.status === 'uploading').length
    const successCount = files.filter((f) => f.status === 'success').length
    const errorCount = files.filter((f) => f.status === 'error').length
    return { totalSize, uploadingCount, successCount, errorCount }
  }, [files])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-300">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h4
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {texts.selectedFiles(files.length, maxFileCount)}
          </h4>
          <div className="flex items-center gap-2 text-xs">
            {stats.uploadingCount > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 dark:bg-blue-900/30"
                style={{ color: 'var(--color-text-accent)' }}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                {stats.uploadingCount}
              </span>
            )}
            {stats.successCount > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 dark:bg-green-900/30"
                style={{ color: 'var(--color-text-success)' }}
              >
                <CheckCircle2 className="h-3 w-3" />
                {stats.successCount}
              </span>
            )}
            {stats.errorCount > 0 && (
              <span
                className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-900/30"
                style={{ color: 'var(--color-text-error)' }}
              >
                <AlertCircle className="h-3 w-3" />
                {stats.errorCount}
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs transition-colors hover:text-red-500"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          {texts.clearAll}
        </Button>
      </div>

      <div
        className={cn(
          'space-y-2 overflow-y-auto pr-1 scrollbar-thin',
          listMaxHeight,
        )}
        style={{
          scrollbarColor: 'var(--color-components-scrollbar-thumb) transparent',
        }}
      >
        {files.map((file, index) => (
          <FileCard
            key={file.uid || `${file.name}-${index}`}
            file={file}
            index={index}
            onRemove={onRemove}
            onRetry={onRetry}
            showProgress={showProgress}
            compact={compact}
            texts={texts}
          />
        ))}
      </div>

      <div
        className="flex items-center justify-between px-1 pt-3 text-xs"
        style={{
          color: 'var(--color-text-tertiary)',
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <span className="flex items-center gap-1">
          <span>{texts.totalSize}</span>
          <span
            className="font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {formatBytes(stats.totalSize)}
          </span>
        </span>
        {files.length < maxFileCount && (
          <span>{texts.remainingFiles(maxFileCount - files.length)}</span>
        )}
      </div>
    </div>
  )
})
