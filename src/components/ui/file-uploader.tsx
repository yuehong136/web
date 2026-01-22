'use client'

import * as React from 'react'
import { 
  Upload, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File,
  FileCode,
  FileVideo,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import Dropzone, { type DropzoneProps, type FileRejection } from 'react-dropzone'

// Re-export FileRejection for consumers
export type { FileRejection }
import { cn, formatBytes } from '@/lib/utils'
import { Button } from './button'
import { Progress } from './progress'
import { Tooltip } from './tooltip'

// ============================================================================
// 文件类型工具函数
// ============================================================================

/**
 * 根据文件扩展名获取对应的图标组件
 */
function getFileIcon(fileName: string | undefined) {
  if (!fileName) return File
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  // PDF 文档
  if (ext === 'pdf') {
    return FileText
  }
  // Word 文档
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return FileText
  }
  // 纯文本/Markdown
  if (['txt', 'md', 'mdx', 'log', 'conf'].includes(ext)) {
    return FileText
  }
  // 电子书/邮件
  if (['epub', 'eml'].includes(ext)) {
    return FileText
  }
  // 表格类型
  if (['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext)) {
    return FileSpreadsheet
  }
  // 图片类型
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext)) {
    return FileImage
  }
  // 代码/配置类型
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'htm', 'css', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'xml', 'yml', 'yaml', 'sql'].includes(ext)) {
    return FileCode
  }
  // 视频类型
  if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'rmvb'].includes(ext)) {
    return FileVideo
  }
  // 音频类型
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) {
    return FileAudio
  }
  // 演示文稿
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return FileText
  }
  // 默认
  return File
}

/**
 * 获取文件扩展名的显示颜色
 */
function getFileColor(fileName: string | undefined): { bg: string; text: string; accent: string } {
  if (!fileName) {
    return { 
      bg: 'rgba(107, 114, 128, 0.1)', 
      text: 'var(--color-text-tertiary)', 
      accent: 'var(--color-text-tertiary)' 
    }
  }
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  // 颜色主题定义
  const colors = {
    red: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', accent: '#ef4444' },      // PDF
    blue: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', accent: '#3b82f6' },    // Word, TypeScript
    green: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', accent: '#22c55e' },    // Excel, CSV
    gray: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', accent: '#6b7280' },   // 纯文本
    purple: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', accent: '#8b5cf6' },  // Markdown
    orange: { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316', accent: '#f97316' },  // PPT, HTML
    pink: { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', accent: '#ec4899' },    // 图片
    violet: { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', accent: '#a855f7' },  // 视频
    teal: { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6', accent: '#14b8a6' },    // 音频
    yellow: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308', accent: '#eab308' },   // JSON, JavaScript
    indigo: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', accent: '#6366f1' },  // XML, YAML
    amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', accent: '#f59e0b' },   // SQL
  }
  
  const colorMap: Record<string, { bg: string; text: string; accent: string }> = {
    // PDF
    pdf: colors.red,
    // Word 文档
    doc: colors.blue,
    docx: colors.blue,
    odt: colors.blue,
    rtf: colors.blue,
    // 表格
    xls: colors.green,
    xlsx: colors.green,
    csv: colors.green,
    tsv: colors.green,
    ods: colors.green,
    // 演示文稿
    ppt: colors.orange,
    pptx: colors.orange,
    odp: colors.orange,
    // 纯文本
    txt: colors.gray,
    log: colors.gray,
    conf: colors.gray,
    // Markdown
    md: colors.purple,
    mdx: colors.purple,
    // 电子书/邮件
    epub: colors.purple,
    eml: colors.gray,
    // 图片
    jpg: colors.pink,
    jpeg: colors.pink,
    png: colors.pink,
    gif: colors.pink,
    webp: colors.pink,
    bmp: colors.pink,
    tiff: colors.pink,
    tif: colors.pink,
    ico: colors.pink,
    svg: colors.pink,
    // 视频
    mp4: colors.violet,
    avi: colors.violet,
    mkv: colors.violet,
    mov: colors.violet,
    webm: colors.violet,
    flv: colors.violet,
    rmvb: colors.violet,
    // 音频
    mp3: colors.teal,
    wav: colors.teal,
    ogg: colors.teal,
    flac: colors.teal,
    aac: colors.teal,
    m4a: colors.teal,
    // 代码/配置
    json: colors.yellow,
    js: colors.yellow,
    jsx: colors.yellow,
    ts: colors.blue,
    tsx: colors.blue,
    html: colors.orange,
    htm: colors.orange,
    css: colors.blue,
    xml: colors.indigo,
    yml: colors.indigo,
    yaml: colors.indigo,
    sql: colors.amber,
    py: colors.blue,
    java: colors.orange,
    go: colors.teal,
    rs: colors.orange,
    cpp: colors.blue,
    c: colors.blue,
  }
  
  return colorMap[ext] || { 
    bg: 'rgba(107, 114, 128, 0.1)', 
    text: 'var(--color-text-tertiary)', 
    accent: 'var(--color-text-tertiary)' 
  }
}

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 文件上传状态
 */
export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error'

/**
 * 带状态的文件对象
 */
export interface UploadFile extends File {
  /** 图片预览URL */
  preview?: string
  /** 上传状态 */
  status?: FileUploadStatus
  /** 上传进度 0-100 */
  progress?: number
  /** 错误信息 */
  error?: string
  /** 唯一标识 */
  uid?: string
}

/**
 * 上传进度回调参数
 */
export interface UploadProgressInfo {
  file: UploadFile
  progress: number
  status: FileUploadStatus
}

// ============================================================================
// 子组件: 文件卡片
// ============================================================================

interface FileCardProps {
  file: UploadFile
  index: number
  onRemove: (index: number) => void
  onRetry?: (index: number) => void
  showProgress?: boolean
  compact?: boolean
}

function FileCard({ file, index, onRemove, onRetry, showProgress, compact }: FileCardProps) {
  const IconComponent = getFileIcon(file.name)
  const colors = getFileColor(file.name)
  const ext = file.name?.split('.').pop()?.toUpperCase() || 'FILE'
  
  // 判断是否是图片类型，用于显示缩略图
  const isImage = file.type?.startsWith('image/') ?? false
  const [imgError, setImgError] = React.useState(false)
  
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
        {/* 扩展名标签 */}
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
          
          {/* 状态指示器 */}
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
        
        {/* 进度条 */}
        {showProgress && file.status === 'uploading' && typeof file.progress === 'number' && (
          <div className="pt-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <Progress 
              value={file.progress} 
              className="h-1.5" 
              style={{
                '--progress-foreground': 'var(--color-text-accent)'
              } as React.CSSProperties}
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
      
      {/* 悬浮时的发光效果 */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.bg} 0%, transparent 70%)`,
        }}
      />
    </div>
  )
}

// ============================================================================
// 主组件: FileUploader
// ============================================================================

export interface FileUploaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'onChange'> {
  /**
   * 当前选择的文件列表
   */
  value?: UploadFile[]
  
  /**
   * 文件变化回调
   */
  onValueChange?: (files: UploadFile[]) => void
  
  /**
   * 接受的文件类型
   * @default 支持常见文档格式
   */
  accept?: DropzoneProps['accept']
  
  /**
   * 最大文件大小（字节）
   * @default 1GB
   */
  maxSize?: number
  
  /**
   * 最大文件数量
   * @default 32
   */
  maxFileCount?: number
  
  /**
   * 是否允许多文件上传
   * @default true
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
   * 文件被拒绝时的回调
   */
  onFilesRejected?: (rejectedFiles: FileRejection[]) => void
  
  /**
   * 是否显示上传进度
   */
  showProgress?: boolean
  
  /**
   * 拖拽区域高度
   */
  dropzoneHeight?: string
  
  /**
   * 达到最大文件数量时是否隐藏上传区域
   */
  hideDropzoneOnMaxFileCount?: boolean
  
  /**
   * 是否使用紧凑模式显示文件列表
   */
  compact?: boolean
  
  /**
   * 文件列表最大高度
   */
  listMaxHeight?: string
  
  /**
   * 重试上传回调
   */
  onRetry?: (file: UploadFile, index: number) => void
}

/**
 * 现代化文件上传组件
 * 
 * 特性：
 * - 支持拖拽上传
 * - 点击继续添加文件（累积模式）
 * - 精美的文件列表展示
 * - 上传进度显示
 * - 玻璃拟态 UI
 * - 丝滑动画效果
 */
/**
 * 默认支持的文件类型 - 参考 ragflow 的文件类型配置
 * 使用 undefined 接受所有文件类型，后端会进行实际的文件类型验证
 * 
 * 注意：react-dropzone 不支持 '*' 作为 MIME 类型
 * 如果需要接受所有文件，传入 undefined 或不传递 accept 属性
 */
export const DEFAULT_ACCEPTED_FILE_TYPES: Record<string, string[]> | undefined = undefined

export function FileUploader(props: FileUploaderProps) {
  const {
    value,
    onValueChange,
    accept = DEFAULT_ACCEPTED_FILE_TYPES,
    maxSize = 1024 * 1024 * 1024, // 1GB
    maxFileCount = 32,
    multiple = true,
    disabled = false,
    className,
    title,
    description,
    onFilesRejected,
    showProgress = true,
    dropzoneHeight = 'min-h-[200px]',
    hideDropzoneOnMaxFileCount = false,
    compact = false,
    listMaxHeight = 'max-h-[300px]',
    onRetry,
    ...rest
  } = props

  // 内部状态管理
  const [files, setFilesInternal] = React.useState<UploadFile[]>(value ?? [])
  const fileIdCounter = React.useRef(0)

  // 同步外部 value
  React.useEffect(() => {
    if (value !== undefined) {
      setFilesInternal(value)
    }
  }, [value])

  // 生成唯一文件ID
  const generateFileId = React.useCallback(() => {
    return `file-${Date.now()}-${++fileIdCounter.current}`
  }, [])

  // 更新文件列表
  const setFiles = React.useCallback((newFiles: UploadFile[]) => {
    setFilesInternal(newFiles)
    onValueChange?.(newFiles)
  }, [onValueChange])

  const reachesMaxFileCount = files.length >= maxFileCount

  // 处理文件拖放 - 累积添加模式
  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      
      // 检查是否会超过最大文件数
      const availableSlots = maxFileCount - files.length
      
      if (availableSlots <= 0) {
        onFilesRejected?.([{
          file: acceptedFiles[0],
          errors: [{ code: 'too-many-files', message: `最多只能上传 ${maxFileCount} 个文件` }]
        }])
        return
      }

      // 只取可用的文件数量
      const filesToAdd = acceptedFiles.slice(0, availableSlots)
      
      // 检查重复文件（基于文件名和大小）
      const existingFiles = new Map(files.map(f => [`${f.name}-${f.size}`, true]))
      const uniqueFiles = filesToAdd.filter(f => !existingFiles.has(`${f.name}-${f.size}`))
      
      if (uniqueFiles.length < filesToAdd.length) {
        const duplicateCount = filesToAdd.length - uniqueFiles.length
        console.warn(`跳过 ${duplicateCount} 个重复文件`)
      }

      // 为新文件添加初始状态和唯一ID
      const newFiles: UploadFile[] = uniqueFiles.map((file) => {
        const uploadFile = Object.assign(file, {
          preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          status: 'pending' as FileUploadStatus,
          progress: 0,
          uid: generateFileId(),
        })
        return uploadFile
      })

      // 累积添加文件
      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)

      // 处理被拒绝的文件
      if (rejectedFiles.length > 0) {
        onFilesRejected?.(rejectedFiles)
      }
      
      // 如果有文件因为数量限制被截断
      if (acceptedFiles.length > availableSlots) {
        const truncatedCount = acceptedFiles.length - availableSlots
        console.warn(`因数量限制，${truncatedCount} 个文件未被添加`)
      }
    },
    [files, maxFileCount, setFiles, onFilesRejected, generateFileId]
  )

  // 移除文件
  const handleRemove = React.useCallback((index: number) => {
    const file = files[index]
    // 清理预览 URL
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }, [files, setFiles])

  // 重试上传
  const handleRetry = React.useCallback((index: number) => {
    const file = files[index]
    if (onRetry) {
      onRetry(file, index)
    }
  }, [files, onRetry])

  // 清空所有文件
  const handleClearAll = React.useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
  }, [files, setFiles])

  // 清理预览 URL
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDisabled = disabled || files.length >= maxFileCount

  // 统计信息
  const stats = React.useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0)
    const uploadingCount = files.filter(f => f.status === 'uploading').length
    const successCount = files.filter(f => f.status === 'success').length
    const errorCount = files.filter(f => f.status === 'error').length
    const pendingCount = files.filter(f => f.status === 'pending' || !f.status).length
    
    return { totalSize, uploadingCount, successCount, errorCount, pendingCount }
  }, [files])

  return (
    <div className={cn("relative flex flex-col gap-4", className)} {...rest}>
      {/* 拖拽上传区域 */}
      {!(hideDropzoneOnMaxFileCount && reachesMaxFileCount) && (
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          maxSize={maxSize}
          maxFiles={maxFileCount - files.length}
          multiple={multiple}
          disabled={isDisabled}
        >
          {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
            <div
              {...getRootProps()}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden",
                dropzoneHeight,
                isDragActive && !isDragReject && "scale-[1.01] border-transparent",
                isDragReject && "border-red-400 bg-red-50/50 dark:bg-red-950/20",
                isDisabled && "pointer-events-none opacity-50 cursor-not-allowed",
              )}
              style={{
                backgroundColor: isDragActive 
                  ? 'var(--color-components-upload-bg-dragover)' 
                  : 'var(--color-components-upload-bg)',
                borderColor: isDragActive 
                  ? 'var(--color-text-accent)' 
                  : isDragReject 
                    ? 'var(--color-border-error)'
                    : 'var(--color-components-upload-border)',
              }}
            >
              <input {...getInputProps()} />
              
              {/* 动态背景装饰 - 拖拽时显示 */}
              {isDragActive && !isDragReject && (
                <>
                  {/* 渐变光晕 */}
                  <div 
                    className="absolute inset-0 animate-pulse pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, var(--color-state-focus-10) 0%, transparent 70%)'
                    }}
                  />
                  {/* 流动边框效果 */}
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, 
                        transparent 0%, 
                        var(--color-text-accent) 25%, 
                        var(--color-text-accent) 75%, 
                        transparent 100%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite linear',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'xor',
                      WebkitMaskComposite: 'xor',
                      padding: '2px',
                      borderRadius: 'inherit',
                    }}
                  />
                  {/* 浮动粒子效果 */}
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
                {/* 图标容器 */}
                <div 
                  className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500",
                    isDragActive && "scale-125 rotate-6"
                  )}
                  style={{ 
                    backgroundColor: isDragActive 
                      ? 'var(--color-text-accent)' 
                      : 'var(--color-background-default)',
                    boxShadow: isDragActive 
                      ? '0 16px 48px -8px rgba(var(--color-primary-rgb, 59, 130, 246), 0.4)'
                      : '0 4px 16px -2px rgba(0,0,0,0.08)'
                  }}
                >
                  {isDragActive ? (
                    <CloudUpload className="w-8 h-8 text-white animate-bounce" />
                  ) : (
                    <Upload 
                      className="w-7 h-7 transition-all duration-300 group-hover:scale-110" 
                      style={{ color: 'var(--color-components-upload-icon)' }} 
                    />
                  )}
                </div>
                
                {/* 文字内容 */}
                <div className="flex flex-col gap-2">
                  <p 
                    className={cn(
                      "font-semibold transition-all duration-300",
                      isDragActive ? "text-lg" : "text-base"
                    )}
                    style={{ 
                      color: isDragActive 
                        ? 'var(--color-text-accent)' 
                        : 'var(--color-components-upload-text)' 
                    }}
                  >
                    {isDragActive 
                      ? '✨ 释放文件立即上传' 
                      : (title || '点击或拖拽文件至此区域即可上传')
                    }
                  </p>
                  <p 
                    className="text-sm max-w-md leading-relaxed"
                    style={{ color: 'var(--color-components-upload-text-secondary)' }}
                  >
                    {description || (
                      <>
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
                
                {/* 快捷按钮 */}
                {!isDragActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
                    disabled={isDisabled}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    选择文件
                  </Button>
                )}
              </div>
            </div>
          )}
        </Dropzone>
      )}

      {/* 文件列表 */}
      {files.length > 0 && (
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
              
              {/* 状态指示器 */}
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
              onClick={handleClearAll}
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
                onRemove={handleRemove}
                onRetry={onRetry ? handleRetry : undefined}
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
      )}
      
      {/* 全局CSS动画 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default FileUploader
