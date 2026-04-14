import React, { memo } from 'react'
import Dropzone, { type DropzoneProps, type FileRejection } from 'react-dropzone'
import { Upload, CloudUpload, FolderUp, Sparkles } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from '../button'
import type { UploadMode } from './types'

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
}: DropzoneAreaProps) {
  const isFolderMode = mode === 'folder'

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
              ? { onClick: (e) => { e.stopPropagation(); onFolderClick?.() } }
              : undefined,
          )}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden",
            dropzoneHeight,
            !isFolderMode && isDragActive && !isDragReject && "scale-[1.01] border-transparent",
            !isFolderMode && isDragReject && "border-red-400 bg-red-50/50 dark:bg-red-950/20",
            isDisabled && "pointer-events-none opacity-50 cursor-not-allowed",
            className,
          )}
          style={{
            backgroundColor: !isFolderMode && isDragActive
              ? 'var(--color-components-upload-bg-dragover)'
              : 'var(--color-components-upload-bg)',
            borderColor: !isFolderMode && isDragActive
              ? 'var(--color-text-accent)'
              : isDragReject
                ? 'var(--color-border-error)'
                : 'var(--color-components-upload-border)',
          }}
        >
          {!isFolderMode && <input {...getInputProps()} />}

          {/* 拖拽动效 - 仅文件模式 */}
          {!isFolderMode && isDragActive && !isDragReject && (
            <>
              <div
                className="absolute inset-0 animate-pulse pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, var(--color-state-focus-10) 0%, transparent 70%)'
                }}
              />
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, var(--color-text-accent) 25%, var(--color-text-accent) 75%, transparent 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'xor',
                  WebkitMaskComposite: 'xor',
                  padding: '2px',
                  borderRadius: 'inherit',
                }}
              />
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="absolute animate-bounce opacity-30"
                    style={{
                      color: 'var(--color-text-accent)',
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

          <div className="flex flex-col items-center justify-center gap-4 px-6 py-8 text-center z-10">
            {/* 图标 */}
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500",
                !isFolderMode && isDragActive && "scale-125 rotate-6"
              )}
              style={{
                backgroundColor: !isFolderMode && isDragActive
                  ? 'var(--color-text-accent)'
                  : 'var(--color-background-default)',
                boxShadow: !isFolderMode && isDragActive
                  ? '0 16px 48px -8px rgba(var(--color-primary-rgb, 59, 130, 246), 0.4)'
                  : '0 4px 16px -2px rgba(0,0,0,0.08)'
              }}
            >
              {!isFolderMode && isDragActive ? (
                <CloudUpload className="w-8 h-8 text-white animate-bounce" />
              ) : isFolderMode ? (
                <FolderUp
                  className="w-7 h-7 transition-all duration-300"
                  style={{ color: 'var(--color-components-upload-icon)' }}
                />
              ) : (
                <Upload
                  className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
                  style={{ color: 'var(--color-components-upload-icon)' }}
                />
              )}
            </div>

            {/* 文字 */}
            <div className="flex flex-col gap-2">
              <p
                className={cn(
                  "font-semibold transition-all duration-300",
                  !isFolderMode && isDragActive ? "text-lg" : "text-base"
                )}
                style={{
                  color: !isFolderMode && isDragActive
                    ? 'var(--color-text-accent)'
                    : 'var(--color-components-upload-text)'
                }}
              >
                {!isFolderMode && isDragActive
                  ? '释放文件立即上传'
                  : isFolderMode
                    ? (title || '点击选择文件夹')
                    : (title || '点击或拖拽文件至此区域即可上传')
                }
              </p>
              <p
                className="text-sm max-w-md leading-relaxed"
                style={{ color: 'var(--color-components-upload-text-secondary)' }}
              >
                {description || (
                  isFolderMode
                    ? '选择一个文件夹，自动上传其中包含的所有文件'
                    : <>
                        支持单次或批量上传。本地部署的单次上传文件总大小上限为{' '}
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {formatBytes(maxSize)}
                        </span>
                        ，单次批量上传文件数不超过{' '}
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {maxFileCount}
                        </span>
                        {' '}个
                      </>
                )}
              </p>
            </div>

            {/* 按钮 */}
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
                    <FolderUp className="w-4 h-4 mr-2" />
                    选择文件夹
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    选择文件
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
