import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import { conversationAPI } from '@/api/conversation'
import { APIError } from '@/api/client'
import { te } from '@/api/client-types'
import { isUploadedFileInfo } from '@/api/conversation-upload'
import type { UploadFile, UploadedFileInfo } from '@/config/chat'
import {
  AttachmentPreviewMode,
  readAttachmentPreview,
} from './attachment-preview'

enum AttachmentUploadStatus {
  Uploading = 'uploading',
  Done = 'done',
  Error = 'error',
}

/** Composer ownership: removing a row ends its request and its local preview. */
export function useAttachmentUpload(previewMode: AttachmentPreviewMode) {
  const [files, updateFiles] = useState<UploadFile[]>([])
  const instanceId = useId()
  const sequence = useRef(0)
  const filesRef = useRef<UploadFile[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const objectURLs = useRef(new Map<string, string>())
  const mounted = useRef(true)
  const removed = useRef(new Set<string>())

  const releasePreview = useCallback((uid: string) => {
    const url = objectURLs.current.get(uid)
    if (url) URL.revokeObjectURL(url)
    objectURLs.current.delete(uid)
  }, [])

  const setFiles = useCallback(
    (action: SetStateAction<UploadFile[]>) => {
      if (!mounted.current) return
      const next = (
        typeof action === 'function' ? action(filesRef.current) : action
      ).filter((file) => !removed.current.has(file.uid))
      const retained = new Set(next.map((file) => file.uid))
      for (const file of filesRef.current) {
        if (!retained.has(file.uid)) {
          removed.current.add(file.uid)
          controllers.current.get(file.uid)?.abort()
          controllers.current.delete(file.uid)
          releasePreview(file.uid)
        }
      }
      filesRef.current = next
      updateFiles(next)
    },
    [releasePreview],
  )

  useEffect(() => {
    mounted.current = true
    const requests = controllers.current
    const previews = objectURLs.current
    return () => {
      mounted.current = false
      requests.forEach((controller) => controller.abort())
      requests.clear()
      previews.forEach((url) => URL.revokeObjectURL(url))
      previews.clear()
    }
  }, [])

  const upload = useCallback(
    async (file: File): Promise<UploadedFileInfo | null> => {
      if (!mounted.current) return null
      const uid = `file-${instanceId}-${++sequence.current}`
      const controller = new AbortController()
      controllers.current.set(uid, controller)
      const active = () =>
        mounted.current &&
        !controller.signal.aborted &&
        controllers.current.get(uid) === controller
      setFiles((prev) => [
        ...prev,
        {
          uid,
          name: file.name,
          size: file.size,
          type: file.type,
          status: AttachmentUploadStatus.Uploading,
          percent: 0,
          originFileObj: file,
        },
      ])
      try {
        let thumbUrl: string | undefined
        if (file.type.startsWith('image/')) {
          if (previewMode === AttachmentPreviewMode.DataURL) {
            thumbUrl = await readAttachmentPreview(file, controller.signal)
          } else {
            thumbUrl = URL.createObjectURL(file)
            objectURLs.current.set(uid, thumbUrl)
          }
        }
        if (!active()) return null
        if (thumbUrl)
          setFiles((prev) =>
            prev.map((row) => (row.uid === uid ? { ...row, thumbUrl } : row)),
          )
        const result = await conversationAPI.uploadInfo(
          file,
          (percent) => {
            if (active())
              setFiles((prev) =>
                prev.map((row) =>
                  row.uid === uid ? { ...row, percent } : row,
                ),
              )
          },
          controller.signal,
        )
        if (!active()) return null
        setFiles((prev) =>
          prev.map((row) =>
            row.uid === uid
              ? {
                  ...row,
                  status: AttachmentUploadStatus.Done,
                  percent: 100,
                  response: result,
                }
              : row,
          ),
        )
        return result
      } catch (error) {
        if (!active()) return null
        if (error instanceof APIError && error.code === 'CANCELLED') {
          setFiles((prev) => prev.filter((row) => row.uid !== uid))
          return null
        }
        releasePreview(uid)
        // UI feedback is fixed and translated; never display backend error details.
        const key =
          error instanceof APIError && error.status === 401
            ? 'unauthorized'
            : error instanceof APIError && error.code === 'TIMEOUT'
              ? 'timeout'
              : error instanceof APIError && error.code === 'NETWORK_ERROR'
                ? 'network'
                : 'serverError'
        const safeError =
          error instanceof APIError
            ? new APIError(error.status, error.code, te(key))
            : new APIError(0, 'UPLOAD_ERROR', te(key))
        setFiles((prev) =>
          prev.map((row) =>
            row.uid === uid
              ? {
                  ...row,
                  status: AttachmentUploadStatus.Error,
                  error: safeError,
                  thumbUrl:
                    previewMode === AttachmentPreviewMode.ObjectURL
                      ? undefined
                      : row.thumbUrl,
                }
              : row,
          ),
        )
        return null
      } finally {
        controllers.current.delete(uid)
      }
    },
    [instanceId, previewMode, releasePreview, setFiles],
  )

  const removeFile = useCallback(
    (uid: string) => {
      setFiles((prev) => prev.filter((file) => file.uid !== uid))
    },
    [setFiles],
  )
  const cancelAll = useCallback(() => {
    setFiles((prev) =>
      prev.filter((file) => file.status !== AttachmentUploadStatus.Uploading),
    )
  }, [setFiles])
  const clearFiles = useCallback(() => setFiles([]), [setFiles])
  const uploadMultiple = useCallback(
    (list: File[]) => Promise.all(list.map((file) => upload(file))),
    [upload],
  )
  const retry = useCallback(
    (uid: string) => {
      const file = filesRef.current.find((row) => row.uid === uid)
      if (
        !file ||
        file.status !== AttachmentUploadStatus.Error ||
        !file.originFileObj
      )
        return Promise.resolve(null)
      removeFile(uid)
      return upload(file.originFileObj)
    },
    [removeFile, upload],
  )
  const getUploadedFiles = useCallback(
    (): UploadedFileInfo[] =>
      files
        .filter(
          (file): file is UploadFile & { response: UploadedFileInfo } =>
            file.status === AttachmentUploadStatus.Done &&
            isUploadedFileInfo(file.response),
        )
        .map((file) => ({
          ...file.response,
          preview_url:
            previewMode === AttachmentPreviewMode.DataURL
              ? (file.thumbUrl ?? file.response.preview_url ?? null)
              : (file.response.preview_url ?? null),
        })),
    [files, previewMode],
  )

  return {
    files,
    setFiles,
    upload,
    uploadMultiple,
    removeFile,
    clearFiles,
    cancel: removeFile,
    cancelAll,
    retry,
    getUploadedFiles,
    uploading: files.some(
      (file) => file.status === AttachmentUploadStatus.Uploading,
    ),
    hasError: files.some(
      (file) => file.status === AttachmentUploadStatus.Error,
    ),
    allDone:
      files.length > 0 &&
      files.every((file) => file.status === AttachmentUploadStatus.Done),
    doneCount: files.filter(
      (file) => file.status === AttachmentUploadStatus.Done,
    ).length,
  }
}
