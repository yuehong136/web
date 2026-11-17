import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { uploadConfig } from '@/config/chat'
import { useMcpUpload } from '@/hooks/use-mcp-upload'
import { toast } from '@/lib/toast'

/**
 * Files for the next model or MCP turn. Uploads go through the shared
 * attachment upload; the turn sends the uploaded ids (`files`). App
 * conversations have no attachment contract here, so `enabled` is false while
 * an app is selected: the tray hides and app turns send no files. Files
 * dragged anywhere over `dropTarget` open the tray; dropped there, they
 * upload.
 */
export function useHomeAttachments(
  enabled: boolean,
  dropTarget: HTMLElement | null,
) {
  const { t } = useTranslation()
  const {
    files,
    uploading,
    hasError,
    doneCount,
    upload,
    removeFile,
    retry,
    clearFiles,
    getFileIds,
  } = useMcpUpload()
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)

  const add = useCallback(
    async (file: File) => {
      if (file.size > uploadConfig.maxSize) {
        toast.error(t('home.attachments.tooLarge', { name: file.name }))
        return
      }
      const result = await upload(file)
      if (result)
        toast.success(t('home.attachments.uploaded', { name: file.name }))
    },
    [t, upload],
  )

  const addPasted = useCallback(
    (list: FileList) => {
      if (!enabled || list.length === 0) return
      setOpen(true)
      for (const file of Array.from(list)) void add(file)
    },
    [add, enabled],
  )

  /** Clears the tray once a turn took the files. */
  const reset = useCallback(() => {
    clearFiles()
    setOpen(false)
  }, [clearFiles])

  // Files dragged anywhere over Home open the tray; dropped anywhere, they upload.
  useEffect(() => {
    const container = dropTarget
    if (!container || !enabled) return undefined
    let depth = 0
    const hold = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const enter = (event: DragEvent) => {
      hold(event)
      depth += 1
      if (event.dataTransfer?.types.includes('Files')) {
        setDragging(true)
        setOpen(true)
      }
    }
    const leave = (event: DragEvent) => {
      hold(event)
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const drop = (event: DragEvent) => {
      hold(event)
      depth = 0
      setDragging(false)
      const dropped = event.dataTransfer?.files
      if (dropped?.length) addPasted(dropped)
    }
    container.addEventListener('dragenter', enter)
    container.addEventListener('dragleave', leave)
    container.addEventListener('dragover', hold)
    container.addEventListener('drop', drop)
    return () => {
      container.removeEventListener('dragenter', enter)
      container.removeEventListener('dragleave', leave)
      container.removeEventListener('dragover', hold)
      container.removeEventListener('drop', drop)
      setDragging(false)
    }
  }, [addPasted, dropTarget, enabled])

  return {
    enabled,
    files,
    uploading,
    hasError,
    readyCount: doneCount,
    open: enabled && open,
    setOpen,
    dragging: enabled && dragging,
    add,
    addPasted,
    remove: removeFile,
    retry: (uid: string) => void retry(uid),
    reset,
    fileIds: getFileIds,
  }
}

export type HomeAttachments = ReturnType<typeof useHomeAttachments>

/** Provided by Home so both composers (welcome and docked) share one tray. */
export const HomeAttachmentsContext = createContext<HomeAttachments | null>(
  null,
)

export const useHomeAttachmentsContext = () =>
  useContext(HomeAttachmentsContext)
