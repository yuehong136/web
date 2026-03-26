import React, { memo, useState } from 'react'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from '../button'
import { Progress } from '../progress'
import { Tooltip } from '../tooltip'
import { getFileIcon, getFileColor } from './utils'
import type { UploadFile } from './types'

interface FileCardProps {
  file: UploadFile
  index: number
  onRemove: (index: number) => void
  onRetry?: (index: number) => void
  showProgress?: boolean
  compact?: boolean
}

export const FileCard = memo(function FileCard({ file, index, onRemove, onRetry, showProgress, compact }: FileCardProps) {
  const IconComponent = getFileIcon(file.name)
  const colors = getFileColor(file.name)
  const ext = file.name?.split('.').pop()?.toUpperCase() || 'FILE'

  const isImage = file.type?.startsWith('image/') ?? false
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl transition-all duration-300",
        "hover:shadow-md border border-transparent",
        compact ? "p-2" : "p-3",
        file.status === 'error' && "ring-1 ring-red-200/50 bg-red-50/30 dark:bg-red-950/10",
        file.status === 'success' && "ring-1 ring-green-200/50 bg-green-50/30 dark:bg-green-950/10",
        file.status === 'uploading' && "ring-1 ring-blue-200/50 bg-blue-50/30 dark:bg-blue-950/10",
        !file.status || file.status === 'pending' ? "hover:border-[var(--color-border-default)]" : ""
      )}
      style={{
        backgroundColor: file.status === 'pending' || !file.status
          ? 'var(--color-background-subtle)'
          : undefined,
      }}
    >
      {/* 文件图标/缩略图 */}
      <div
        className={cn(
          "relative flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105",
          compact ? "w-10 h-10" : "w-12 h-12"
        )}
        style={{ backgroundColor: colors.bg }}
      >
        {isImage && file.preview && !imgError ? (
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <IconComponent
            className={compact ? "w-5 h-5" : "w-6 h-6"}
            style={{ color: colors.text }}
          />
        )}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 px-1 py-0.5 font-bold rounded uppercase",
            compact ? "text-[8px]" : "text-[9px]"
          )}
          style={{
            backgroundColor: colors.accent,
            color: 'white',
            lineHeight: '1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          {ext.slice(0, 4)}
        </span>
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0 space-y-1">
        <Tooltip content={file.name}>
          <p
            className={cn(
              "font-medium truncate",
              compact ? "text-xs max-w-[200px]" : "text-sm max-w-[280px]"
            )}
            style={{ color: 'var(--color-text-primary)' }}
          >
            {file.name}
          </p>
        </Tooltip>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn("tabular-nums", compact ? "text-[10px]" : "text-xs")}
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {formatBytes(file.size)}
          </span>
          {file.status === 'success' && (
            <span className="flex items-center gap-1 text-xs animate-in fade-in slide-in-from-left-1 duration-300" style={{ color: 'var(--color-text-success)' }}>
              <CheckCircle2 className="w-3 h-3" />
              <span className={compact ? "hidden" : ""}>上传成功</span>
            </span>
          )}
          {file.status === 'error' && (
            <span className="flex items-center gap-1 text-xs animate-in fade-in slide-in-from-left-1 duration-300" style={{ color: 'var(--color-text-error)' }}>
              <AlertCircle className="w-3 h-3" />
              <span className={compact ? "hidden" : ""}>{file.error || '上传失败'}</span>
            </span>
          )}
          {file.status === 'uploading' && (
            <span className="flex items-center gap-1 text-xs animate-in fade-in slide-in-from-left-1 duration-300" style={{ color: 'var(--color-text-accent)' }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className={compact ? "hidden" : ""}>
                {typeof file.progress === 'number' ? `${Math.round(file.progress)}%` : '上传中...'}
              </span>
            </span>
          )}
        </div>
        {showProgress && file.status === 'uploading' && typeof file.progress === 'number' && (
          <div className="pt-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <Progress
              value={file.progress}
              className="h-1.5"
              style={{ '--progress-foreground': 'var(--color-text-accent)' } as React.CSSProperties}
            />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {file.status === 'error' && onRetry && (
          <Tooltip content="重试上传">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRetry(index)}
              className="h-7 w-7"
              style={{ color: 'var(--color-text-accent)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content="移除文件">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(index)}
            className="h-7 w-7"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <X className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      {/* 悬浮发光效果 */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.bg} 0%, transparent 70%)`,
        }}
      />
    </div>
  )
})
