import type { DropzoneProps, FileRejection } from 'react-dropzone'

export type { FileRejection }

/**
 * 文件上传状态
 */
export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error'

/**
 * 上传模式
 */
export type UploadMode = 'files' | 'folder'

/**
 * 带状态的文件对象
 */
export interface UploadFile extends File {
  preview?: string
  status?: FileUploadStatus
  progress?: number
  error?: string
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

export interface FileUploaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'onChange'> {
  value?: UploadFile[]
  onValueChange?: (files: UploadFile[]) => void
  accept?: DropzoneProps['accept']
  maxSize?: number
  maxFileCount?: number
  multiple?: boolean
  disabled?: boolean
  title?: React.ReactNode
  description?: React.ReactNode
  onFilesRejected?: (rejectedFiles: FileRejection[]) => void
  showProgress?: boolean
  dropzoneHeight?: string
  hideDropzoneOnMaxFileCount?: boolean
  compact?: boolean
  listMaxHeight?: string
  onRetry?: (file: UploadFile, index: number) => void
  enableFolderUpload?: boolean
}
