import type { DropzoneProps, FileRejection } from 'react-dropzone'

export type { FileRejection }

export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error'

export type UploadMode = 'files' | 'folder'

export interface UploadFile extends File {
  preview?: string
  status?: FileUploadStatus
  progress?: number
  error?: string
  uid?: string
}

export interface UploadProgressInfo {
  file: UploadFile
  progress: number
  status: FileUploadStatus
}

export interface FileUploaderTexts {
  fileTab: React.ReactNode
  folderTab: React.ReactNode
  dropActiveTitle: React.ReactNode
  fileDropTitle: React.ReactNode
  folderDropTitle: React.ReactNode
  fileDropDescription: React.ReactNode
  folderDropDescription: React.ReactNode
  selectFile: React.ReactNode
  selectFolder: React.ReactNode
  selectedFiles: (count: number, maxFileCount: number) => React.ReactNode
  clearAll: React.ReactNode
  totalSize: React.ReactNode
  remainingFiles: (count: number) => React.ReactNode
  uploadSuccess: React.ReactNode
  uploadFailed: React.ReactNode
  uploading: React.ReactNode
  retryUpload: React.ReactNode
  removeFile: React.ReactNode
  tooManyFiles: (maxFileCount: number) => string
}

export interface FileUploaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title' | 'onChange'
> {
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
  texts?: Partial<FileUploaderTexts>
}
