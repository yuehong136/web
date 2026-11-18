import { memo, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from '../button'
import { Progress } from '../progress'
import { Tooltip } from '../tooltip'
import { getFileIcon, getFileColor } from './utils'
import type { FileUploaderTexts, UploadFile } from './types'

interface FileCardProps {
  file: UploadFile
  index: number
  onRemove: (index: number) => void
  onRetry?: (index: number) => void
  showProgress?: boolean
  compact?: boolean
  texts: FileUploaderTexts
}

export const FileCard = memo(function FileCard({
  file,
  index,
  onRemove,
  onRetry,
  showProgress,
  compact,
  texts,
}: FileCardProps) {
  const IconComponent = getFileIcon(file.name)
  const colors = getFileColor(file.name)
  const ext = file.name?.split('.').pop()?.toUpperCase() || 'FILE'

  const isImage = file.type?.startsWith('image/') ?? false
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-xl transition-all duration-300',
        'border border-transparent hover:shadow-md',
        compact ? 'p-2' : 'p-3',
        file.status === 'error' && 'bg-danger-soft ring-1 ring-danger-line',
        file.status === 'success' && 'bg-success-soft ring-1 ring-success-line',
        file.status === 'uploading' && 'bg-info-soft ring-1 ring-info-line',
        !file.status || file.status === 'pending'
          ? 'hover:border-[var(--color-line)]'
          : '',
      )}
      style={{
        backgroundColor:
          file.status === 'pending' || !file.status
            ? 'var(--color-sunken)'
            : undefined,
      }}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg transition-transform duration-200 group-hover:scale-105',
          compact ? 'h-10 w-10' : 'h-12 w-12',
        )}
        style={{ backgroundColor: colors.bg }}
      >
        {isImage && file.preview && !imgError ? (
          <img
            src={file.preview}
            alt={file.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <IconComponent
            className={compact ? 'h-5 w-5' : 'h-6 w-6'}
            style={{ color: colors.text }}
          />
        )}
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 rounded px-1 py-0.5 font-bold uppercase',
            compact ? 'text-[8px]' : 'text-[9px]',
          )}
          style={{
            backgroundColor: colors.accent,
            color: colors.bg,
            lineHeight: '1',
            boxShadow: 'var(--elevation-low)',
          }}
        >
          {ext.slice(0, 4)}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <Tooltip content={file.name}>
          <p
            className={cn(
              'truncate font-medium',
              compact ? 'max-w-[200px] text-xs' : 'max-w-[280px] text-sm',
            )}
            style={{ color: 'var(--color-fg)' }}
          >
            {file.name}
          </p>
        </Tooltip>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn('tabular-nums', compact ? 'text-[10px]' : 'text-xs')}
            style={{ color: 'var(--color-fg-subtle)' }}
          >
            {formatBytes(file.size)}
          </span>
          {file.status === 'success' && (
            <span className="animate-in fade-in slide-in-from-left-1 flex items-center gap-1 text-xs text-fg duration-300">
              <CheckCircle2 className="h-3 w-3 text-success-fg" />
              <span className={compact ? 'hidden' : ''}>
                {texts.uploadSuccess}
              </span>
            </span>
          )}
          {file.status === 'error' && (
            <span className="animate-in fade-in slide-in-from-left-1 flex items-center gap-1 text-xs text-fg duration-300">
              <AlertCircle className="h-3 w-3 text-danger-fg" />
              <span className={compact ? 'hidden' : ''}>
                {file.error || texts.uploadFailed}
              </span>
            </span>
          )}
          {file.status === 'uploading' && (
            <span className="animate-in fade-in slide-in-from-left-1 flex items-center gap-1 text-xs text-fg duration-300">
              <Loader2 className="h-3 w-3 animate-spin text-info-fg" />
              <span className={compact ? 'hidden' : ''}>
                {typeof file.progress === 'number'
                  ? `${Math.round(file.progress)}%`
                  : texts.uploading}
              </span>
            </span>
          )}
        </div>
        {showProgress &&
          file.status === 'uploading' &&
          typeof file.progress === 'number' && (
            <div className="animate-in fade-in slide-in-from-bottom-1 pt-1 duration-300">
              <Progress
                value={file.progress}
                className="h-1.5 [&>div]:bg-info-fg"
              />
            </div>
          )}
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {file.status === 'error' && onRetry && (
          <Tooltip content={texts.retryUpload}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRetry(index)}
              className="h-7 w-7"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={texts.removeFile}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(index)}
            className="h-7 w-7"
            style={{ color: 'var(--color-fg-subtle)' }}
          >
            <X className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.bg} 0%, transparent 70%)`,
        }}
      />
    </div>
  )
})
