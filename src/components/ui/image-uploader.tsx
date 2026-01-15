'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Replace, Trash2 } from 'lucide-react'
import Dropzone, { type DropzoneProps, type FileRejection } from 'react-dropzone'
import { cn, formatBytes } from '@/lib/utils'
import { Button } from './button'
import { Progress } from './progress'
import { Tooltip } from './tooltip'

/**
 * 检查文件是否包含预览 URL
 */
function isFileWithPreview(file: File): file is File & { preview: string } {
  return 'preview' in file && typeof file.preview === 'string'
}

/**
 * 图片上传组件 Props
 */
export interface ImageUploaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * 当前选择的文件列表
   */
  value?: File[]
  
  /**
   * 文件变化回调
   */
  onValueChange?: (files: File[]) => void
  
  /**
   * 上传进度（可选）
   */
  progresses?: Record<string, number>
  
  /**
   * 接受的文件类型
   * @default { 'image/png': [], 'image/jpeg': [], 'image/webp': [] }
   */
  accept?: DropzoneProps['accept']
  
  /**
   * 最大文件大小（字节）
   * @default 10MB
   */
  maxSize?: DropzoneProps['maxSize']
  
  /**
   * 最大文件数量
   * @default 1
   */
  maxFileCount?: number
  
  /**
   * 达到最大文件数量时是否隐藏上传区域
   * @default true
   */
  hideDropzoneOnMaxFileCount?: boolean
  
  /**
   * 是否允许多文件上传
   * @default false
   */
  multiple?: boolean
  
  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean
  
  /**
   * 标题
   */
  title?: React.ReactNode
  
  /**
   * 描述文字
   */
  description?: React.ReactNode
  
  /**
   * 上传区域高度样式
   * @default 'h-48'
   */
  dropzoneHeight?: string
  
  /**
   * 文件被拒绝时的回调
   */
  onFilesRejected?: (rejectedFiles: FileRejection[]) => void
  
  /**
   * 显示模式
   * - default: 默认完整上传区域
   * - compact: 紧凑替换模式（适合已有图片时使用）
   * @default 'default'
   */
  variant?: 'default' | 'compact'
}

/**
 * 图片上传组件
 * 
 * 基于 react-dropzone 实现的图片上传组件，支持拖拽上传、预览和删除。
 * 主要用于图片类型分块（Image Chunk）的编辑场景。
 */
export function ImageUploader(props: ImageUploaderProps) {
  const {
    value,
    onValueChange,
    progresses,
    accept = {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
      'image/gif': [],
    },
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFileCount = 1,
    hideDropzoneOnMaxFileCount = true,
    multiple = false,
    disabled = false,
    className,
    title,
    description,
    dropzoneHeight = 'h-40',
    onFilesRejected,
    variant = 'default',
    ...dropzoneProps
  } = props

  // 使用内部状态管理文件列表
  const [files, setFilesInternal] = React.useState<File[]>(value ?? [])

  // 同步外部 value 到内部状态
  React.useEffect(() => {
    if (value !== undefined) {
      setFilesInternal(value)
    }
  }, [value])

  // 更新文件列表
  const setFiles = React.useCallback((newFiles: File[]) => {
    setFilesInternal(newFiles)
    onValueChange?.(newFiles)
  }, [onValueChange])

  const reachesMaxFileCount = files.length >= maxFileCount

  // 处理文件拖放
  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        console.warn('只能上传一个文件')
        return
      }

      if (files.length + acceptedFiles.length > maxFileCount) {
        console.warn(`最多只能上传 ${maxFileCount} 个文件`)
        return
      }

      // 为新文件创建预览 URL
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      )

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)

      if (rejectedFiles.length > 0) {
        onFilesRejected?.(rejectedFiles)
        rejectedFiles.forEach(({ file, errors }) => {
          console.warn(`文件 ${file.name} 被拒绝:`, errors.map(e => e.message).join(', '))
        })
      }
    },
    [files, maxFileCount, multiple, setFiles, onFilesRejected],
  )

  // 移除文件
  const onRemove = React.useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }, [files, setFiles])

  // 组件卸载时清理预览 URL
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDisabled = disabled || files.length >= maxFileCount

  // 紧凑模式 - 适合已有图片时的替换场景
  if (variant === 'compact') {
    return (
      <div className="relative flex flex-col gap-3 overflow-hidden">
        {/* 已选择的文件 - 大图预览 */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="relative group rounded-lg overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--color-background-default)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                {/* 图片预览 */}
                <div className="aspect-video flex items-center justify-center p-3">
                  {isFileWithPreview(file) && (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  )}
                </div>
                
                {/* 文件信息和操作 */}
                <div className="px-3 pb-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <Tooltip content={file.name}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {file.name}
                      </p>
                    </Tooltip>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-text-error hover:text-text-error hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    移除
                  </Button>
                </div>
                
                {/* 进度条 */}
                {typeof progresses?.[file.name] === 'number' && (
                  <div className="px-3 pb-3">
                    <Progress value={progresses[file.name]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 紧凑上传区域 */}
        {!(hideDropzoneOnMaxFileCount && reachesMaxFileCount) && (
          <Dropzone
            onDrop={onDrop}
            accept={accept}
            maxSize={maxSize}
            maxFiles={maxFileCount}
            multiple={maxFileCount > 1 || multiple}
            disabled={isDisabled}
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                className={cn(
                  'group relative flex items-center justify-center gap-3 cursor-pointer rounded-lg border border-dashed px-4 py-3 transition',
                  isDragActive 
                    ? 'border-text-accent bg-state-hover' 
                    : 'border-border-default hover:border-text-accent hover:bg-state-hover',
                  isDisabled && 'pointer-events-none opacity-60',
                  className,
                )}
                style={{
                  backgroundColor: isDragActive ? 'var(--color-state-hover)' : 'transparent',
                }}
                {...dropzoneProps}
              >
                <input {...getInputProps()} />
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: isDragActive ? 'var(--color-primary-subtle)' : 'var(--color-background-subtle)',
                  }}
                >
                  {isDragActive ? (
                    <Upload className="w-4 h-4" style={{ color: 'var(--color-text-accent)' }} />
                  ) : (
                    <Replace className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium" style={{ color: isDragActive ? 'var(--color-text-accent)' : 'var(--color-text-secondary)' }}>
                    {isDragActive ? '释放以上传' : (title || '上传新图片替换')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {description || 'PNG、JPG、WebP、GIF，最大 10MB'}
                  </p>
                </div>
              </div>
            )}
          </Dropzone>
        )}
      </div>
    )
  }

  // 默认模式 - 完整上传区域
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden">
      {/* 已选择的文件 - 卡片式预览 */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="relative group rounded-lg overflow-hidden"
              style={{ 
                backgroundColor: 'var(--color-background-default)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              {/* 图片预览 */}
              <div className="aspect-video flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                {isFileWithPreview(file) && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded shadow-sm"
                  />
                )}
              </div>
              
              {/* 文件信息和操作 */}
              <div className="p-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                    {isFileWithPreview(file) && (
                      <img
                        src={file.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Tooltip content={file.name}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {file.name}
                      </p>
                    </Tooltip>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-text-error hover:text-text-error hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  移除
                </Button>
              </div>
              
              {/* 进度条 */}
              {typeof progresses?.[file.name] === 'number' && (
                <div className="px-3 pb-3">
                  <Progress value={progresses[file.name]} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 拖拽上传区域 */}
      {!(hideDropzoneOnMaxFileCount && reachesMaxFileCount) && (
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          maxSize={maxSize}
          maxFiles={maxFileCount}
          multiple={maxFileCount > 1 || multiple}
          disabled={isDisabled}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={cn(
                'group relative grid w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-5 py-6 text-center transition-all duration-200',
                dropzoneHeight,
                isDragActive 
                  ? 'border-text-accent bg-primary-subtle scale-[1.01]' 
                  : 'border-border-default hover:border-text-accent hover:bg-state-hover',
                isDisabled && 'pointer-events-none opacity-60',
                className,
              )}
              style={{
                backgroundColor: isDragActive ? 'var(--color-primary-subtle)' : 'var(--color-background-subtle)',
              }}
              {...dropzoneProps}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-3">
                {/* 图标容器 */}
                <div 
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200",
                    isDragActive ? "scale-110" : "group-hover:scale-105"
                  )}
                  style={{ 
                    backgroundColor: isDragActive ? 'var(--color-text-accent)' : 'var(--color-background-default)',
                    boxShadow: isDragActive 
                      ? '0 8px 24px rgba(var(--color-primary-rgb), 0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  {isDragActive ? (
                    <Upload className="w-6 h-6 text-white" />
                  ) : (
                    <ImageIcon className="w-6 h-6" style={{ color: 'var(--color-text-tertiary)' }} />
                  )}
                </div>
                
                {/* 文字内容 */}
                <div className="flex flex-col gap-1">
                  <p 
                    className="text-sm font-medium transition-colors"
                    style={{ color: isDragActive ? 'var(--color-text-accent)' : 'var(--color-text-primary)' }}
                  >
                    {isDragActive ? '释放以上传图片' : (title || '点击或拖拽图片到此处')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {description || `支持 PNG、JPG、WebP、GIF，最大 ${formatBytes(maxSize)}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Dropzone>
      )}
    </div>
  )
}

export default ImageUploader
