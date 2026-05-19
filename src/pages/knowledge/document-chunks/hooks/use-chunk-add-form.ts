import { useCallback, useState } from 'react'

export const useChunkAddForm = () => {
  const [addChunkModalOpen, setAddChunkModalOpen] = useState(false)
  const [content, setContent] = useState('')
  const [importantKwd, setImportantKwd] = useState<string[]>([])
  const [questionKwd, setQuestionKwd] = useState<string[]>([])

  const reset = useCallback(() => {
    setContent('')
    setImportantKwd([])
    setQuestionKwd([])
  }, [])

  const open = useCallback(() => {
    setAddChunkModalOpen(true)
  }, [])

  const close = useCallback(() => {
    setAddChunkModalOpen(false)
    setContent('')
    setImportantKwd([])
    setQuestionKwd([])
  }, [])

  const canSubmit = content.trim().length > 0

  const toPayload = useCallback(
    () => ({
      content: content.trim(),
      important_kwd: importantKwd,
      question_kwd: questionKwd,
    }),
    [content, importantKwd, questionKwd],
  )

  return {
    addChunkModalOpen,
    content,
    importantKwd,
    questionKwd,
    setContent,
    setImportantKwd,
    setQuestionKwd,
    open,
    close,
    reset,
    canSubmit,
    toPayload,
  }
}

export type ChunkAddForm = ReturnType<typeof useChunkAddForm>
