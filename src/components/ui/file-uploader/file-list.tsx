import React, { memo, useMemo } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from '../button'
import { FileCard } from './file-card'
import type { UploadFile } from './types'

interface FileListProps {
  files: UploadFile[]
  maxFileCount: number
  onRemove: (index: number) => void
  onRetry?: (index: number) => void
  onClearAll: () => void
  showProgress: boolean
  compact: boolean
  listMaxHeight: string
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
}: FileListProps) {
  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0)
    const uploadingCount = files.filter(f => f.status === 'uploading').length
    const successCount = files.filter(f => f.status === 'success').length
    const errorCount = files.filter(f => f.status === 'error').length
    return { totalSize, uploadingCount, successCount, errorCount }
  }, [files])

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 列表头部 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h4
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            已选择 {files.length} 个文件
            {maxFileCount < Infinity && (
              <span style={{ color: 'var(--color-text-tertiary)' }}>
                {' '}/ {maxFileCount}
              </span>
            )}
          </h4>
          <div className="flex items-center gap-2 text-xs">
            {stats.uploadingCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30" style={{ color: 'var(--color-text-accent)' }}>
                <Loader2 className="w-3 h-3 animate-spin" />
                {stats.uploadingCount}
              </span>
            )}
            {stats.successCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30" style={{ color: 'var(--color-text-success)' }}>
                <CheckCircle2 className="w-3 h-3" />
                {stats.successCount}
              </span>
            )}
            {stats.errorCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30" style={{ color: 'var(--color-text-error)' }}>
                <AlertCircle className="w-3 h-3" />
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
          className="text-xs hover:text-red-500 transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          清空全部
        </Button>
      </div>

      {/* 文件卡片列表 */}
      <div
        className={cn(
          "space-y-2 overflow-y-auto scrollbar-thin pr-1",
          listMaxHeight
        )}
        style={{
          scrollbarColor: 'var(--color-components-scrollbar-thumb) transparent'
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
          />
        ))}
      </div>

      {/* 统计信息 */}
      <div
        className="flex items-center justify-between px-1 pt-3 text-xs"
        style={{
          color: 'var(--color-text-tertiary)',
          borderTop: '1px solid var(--color-border-subtle)'
        }}
      >
        <span className="flex items-center gap-1">
          <span>总大小:</span>
          <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {formatBytes(stats.totalSize)}
          </span>
        </span>
        {files.length < maxFileCount && (
          <span>
            还可添加 <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{maxFileCount - files.length}</span> 个文件
          </span>
        )}
      </div>
    </div>
  )
})
