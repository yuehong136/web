'use client'

import React, { memo, useState, useRef, useCallback } from 'react'
import { Upload, FolderUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'
import { useFileUploader } from './hooks'
import { DropzoneArea } from './dropzone-area'
import { FileList } from './file-list'
import { DEFAULT_ACCEPTED_FILE_TYPES, DEFAULT_MAX_SIZE, DEFAULT_MAX_FILE_COUNT } from './constants'
import type { FileUploaderProps, UploadMode } from './types'

// Re-exports
export type { UploadFile, FileUploadStatus, UploadProgressInfo, FileRejection, FileUploaderProps } from './types'
export { DEFAULT_ACCEPTED_FILE_TYPES } from './constants'

export const FileUploader = memo(function FileUploader(props: FileUploaderProps) {
  const {
    value,
    onValueChange,
    accept = DEFAULT_ACCEPTED_FILE_TYPES,
    maxSize = DEFAULT_MAX_SIZE,
    maxFileCount = DEFAULT_MAX_FILE_COUNT,
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
    enableFolderUpload = true,
    ...rest
  } = props

  const [uploadMode, setUploadMode] = useState<UploadMode>('files')
  const folderInputRef = useRef<HTMLInputElement>(null)

  const {
    files,
    onDrop,
    processFilesFromFolder,
    handleRemove,
    handleRetry,
    handleClearAll,
    reachesMaxFileCount,
    isDisabled: hookDisabled,
  } = useFileUploader({ value, onValueChange, maxFileCount, onFilesRejected, onRetry })

  const isDisabled = disabled || hookDisabled

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    processFilesFromFolder(fileList)
    e.target.value = ''
  }, [processFilesFromFolder])

  const triggerFolderSelect = useCallback(() => {
    if (!isDisabled) {
      folderInputRef.current?.click()
    }
  }, [isDisabled])

  const showDropzone = !(hideDropzoneOnMaxFileCount && reachesMaxFileCount)

  return (
    <div className={cn("relative flex flex-col gap-4", className)} {...rest}>
      {showDropzone && (
        enableFolderUpload ? (
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as UploadMode)}>
            <TabsList className="w-fit">
              <TabsTrigger value="files" className="gap-1.5">
                <Upload className="w-4 h-4" />
                文件上传
              </TabsTrigger>
              <TabsTrigger value="folder" className="gap-1.5">
                <FolderUp className="w-4 h-4" />
                文件夹上传
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files">
              <DropzoneArea
                mode="files"
                onDrop={onDrop}
                accept={accept}
                maxSize={maxSize}
                maxFiles={maxFileCount - files.length}
                multiple={multiple}
                isDisabled={isDisabled}
                dropzoneHeight={dropzoneHeight}
                title={title}
                description={description}
                maxFileCount={maxFileCount}
              />
            </TabsContent>

            <TabsContent value="folder">
              <DropzoneArea
                mode="folder"
                onDrop={onDrop}
                onFolderClick={triggerFolderSelect}
                maxSize={maxSize}
                maxFiles={maxFileCount - files.length}
                multiple={multiple}
                isDisabled={isDisabled}
                dropzoneHeight={dropzoneHeight}
                maxFileCount={maxFileCount}
              />
              <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFolderSelect}
                // @ts-expect-error webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                directory=""
              />
            </TabsContent>
          </Tabs>
        ) : (
          <DropzoneArea
            mode="files"
            onDrop={onDrop}
            accept={accept}
            maxSize={maxSize}
            maxFiles={maxFileCount - files.length}
            multiple={multiple}
            isDisabled={isDisabled}
            dropzoneHeight={dropzoneHeight}
            title={title}
            description={description}
            maxFileCount={maxFileCount}
          />
        )
      )}

      {files.length > 0 && (
        <FileList
          files={files}
          maxFileCount={maxFileCount}
          onRemove={handleRemove}
          onRetry={onRetry ? handleRetry : undefined}
          onClearAll={handleClearAll}
          showProgress={showProgress}
          compact={compact}
          listMaxHeight={listMaxHeight}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
})

export default FileUploader
