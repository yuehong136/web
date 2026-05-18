import { useState, useCallback, useEffect, useRef } from 'react'
import type { FileRejection } from 'react-dropzone'
import type { FileUploaderTexts, UploadFile, FileUploadStatus } from './types'

interface UseFileUploaderOptions {
  value?: UploadFile[]
  onValueChange?: (files: UploadFile[]) => void
  maxFileCount: number
  onFilesRejected?: (rejected: FileRejection[]) => void
  onRetry?: (file: UploadFile, index: number) => void
  texts: FileUploaderTexts
}

export function useFileUploader({
  value,
  onValueChange,
  maxFileCount,
  onFilesRejected,
  onRetry,
  texts,
}: UseFileUploaderOptions) {
  const [files, setFilesInternal] = useState<UploadFile[]>(value ?? [])
  const fileIdCounter = useRef(0)

  useEffect(() => {
    if (value !== undefined) {
      setFilesInternal(value)
    }
  }, [value])

  const generateFileId = useCallback(() => {
    return `file-${Date.now()}-${++fileIdCounter.current}`
  }, [])

  const setFiles = useCallback(
    (newFiles: UploadFile[]) => {
      setFilesInternal(newFiles)
      onValueChange?.(newFiles)
    },
    [onValueChange],
  )

  const reachesMaxFileCount = files.length >= maxFileCount
  const isDisabled = files.length >= maxFileCount

  const processAcceptedFiles = useCallback(
    (acceptedFiles: File[]): UploadFile[] => {
      const availableSlots = maxFileCount - files.length
      if (availableSlots <= 0) return []

      const filesToAdd = acceptedFiles.slice(0, availableSlots)

      const existingFiles = new Map(
        files.map((f) => [`${f.name}-${f.size}`, true]),
      )
      const uniqueFiles = filesToAdd.filter(
        (f) => !existingFiles.has(`${f.name}-${f.size}`),
      )

      return uniqueFiles.map((file) => {
        return Object.assign(file, {
          preview: file.type?.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
          status: 'pending' as FileUploadStatus,
          progress: 0,
          uid: generateFileId(),
        })
      })
    },
    [files, maxFileCount, generateFileId],
  )

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const availableSlots = maxFileCount - files.length
      if (availableSlots <= 0) {
        onFilesRejected?.([
          {
            file: acceptedFiles[0],
            errors: [
              {
                code: 'too-many-files',
                message: texts.tooManyFiles(maxFileCount),
              },
            ],
          },
        ])
        return
      }

      const newFiles = processAcceptedFiles(acceptedFiles)
      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)

      if (rejectedFiles.length > 0) {
        onFilesRejected?.(rejectedFiles)
      }
    },
    [
      files,
      maxFileCount,
      setFiles,
      onFilesRejected,
      processAcceptedFiles,
      texts,
    ],
  )

  const processFilesFromFolder = useCallback(
    (folderFiles: File[]) => {
      const newFiles = processAcceptedFiles(folderFiles)
      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles]
        setFiles(updatedFiles)
      }
    },
    [files, setFiles, processAcceptedFiles],
  )

  const handleRemove = useCallback(
    (index: number) => {
      const file = files[index]
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)
    },
    [files, setFiles],
  )

  const handleRetry = useCallback(
    (index: number) => {
      const file = files[index]
      if (onRetry) {
        onRetry(file, index)
      }
    },
    [files, onRetry],
  )

  const handleClearAll = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
  }, [files, setFiles])

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    files,
    onDrop,
    processFilesFromFolder,
    handleRemove,
    handleRetry,
    handleClearAll,
    reachesMaxFileCount,
    isDisabled,
  }
}
