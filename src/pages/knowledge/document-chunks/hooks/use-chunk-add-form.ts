import { useCallback, useState } from 'react'
import type { UploadFile } from '@/components/ui/file-uploader'
import { fileToBase64 } from '@/lib/utils'

export const useChunkAddForm = () => {
  const [addChunkModalOpen, setAddChunkModalOpen] = useState(false)
  const [content, setContent] = useState('')
  const [importantKwd, setImportantKwd] = useState<string[]>([])
  const [questionKwd, setQuestionKwd] = useState<string[]>([])
  const [image, setImage] = useState<UploadFile[]>([])

  const reset = useCallback(() => {
    setContent('')
    setImportantKwd([])
    setQuestionKwd([])
    setImage([])
  }, [])

  const open = useCallback(() => {
    setAddChunkModalOpen(true)
  }, [])

  const close = useCallback(() => {
    setAddChunkModalOpen(false)
    setContent('')
    setImportantKwd([])
    setQuestionKwd([])
    setImage([])
  }, [])

  const canSubmit = content.trim().length > 0

  const toPayloadAsync = useCallback(
    async () => ({
      content: content.trim(),
      important_kwd: importantKwd,
      question_kwd: questionKwd,
      image_base64: image.length > 0 ? await fileToBase64(image[0]) : undefined,
    }),
    [content, image, importantKwd, questionKwd],
  )

  return {
    addChunkModalOpen,
    content,
    importantKwd,
    questionKwd,
    image,
    setContent,
    setImportantKwd,
    setQuestionKwd,
    setImage,
    open,
    close,
    reset,
    canSubmit,
    toPayloadAsync,
  }
}

export type ChunkAddForm = ReturnType<typeof useChunkAddForm>
