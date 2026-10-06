import { useCallback, useState } from 'react'
import { fileToBase64 } from '@/lib/utils'
import type { ChunkData } from '../types'

export const useChunkEditForm = (ownerKey: string) => {
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingChunkContent, setEditingChunkContent] = useState('')
  const [editingImportantKwd, setEditingImportantKwd] = useState<string[]>([])
  const [editingQuestionKwd, setEditingQuestionKwd] = useState<string[]>([])
  const [editingImage, setEditingImage] = useState<File[]>([])
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false)
  const [session, setSession] = useState(0)

  const populate = useCallback((chunk: ChunkData) => {
    setSession((value) => value + 1)
    setSelectedChunk(chunk)
    setEditingChunkContent(chunk.content_with_weight)
    setEditingImportantKwd(chunk.important_kwd || [])
    setEditingQuestionKwd(chunk.question_kwd || [])
    setEditingImage([])
    setIsMarkdownPreview(false)
  }, [])

  const selectChunk = useCallback(
    (chunk: ChunkData) => {
      populate(chunk)
      setIsEditMode(false)
    },
    [populate],
  )

  const startEdit = useCallback(
    (chunk: ChunkData) => {
      populate(chunk)
      setIsEditMode(true)
    },
    [populate],
  )

  const reset = useCallback(() => {
    setSession((value) => value + 1)
    setIsEditMode(false)
    setSelectedChunk(null)
    setEditingChunkContent('')
    setEditingImportantKwd([])
    setEditingQuestionKwd([])
    setEditingImage([])
    setIsMarkdownPreview(false)
  }, [])

  const [previousOwner, setPreviousOwner] = useState(ownerKey)
  if (previousOwner !== ownerKey) {
    setPreviousOwner(ownerKey)
    reset()
  }

  const clearSelected = reset

  const canSubmit = editingChunkContent.trim().length > 0 && !!selectedChunk

  const toPayloadAsync = useCallback(async () => {
    if (!selectedChunk) return null
    const imageBase64 =
      editingImage.length > 0 ? await fileToBase64(editingImage[0]) : undefined
    if (editingImage.length > 0 && !imageBase64)
      throw new Error('Image conversion produced no data')
    return {
      chunkId: selectedChunk.chunk_id,
      content: editingChunkContent.trim(),
      important_kwd: editingImportantKwd,
      question_kwd: editingQuestionKwd,
      image_base64: imageBase64,
      ...(imageBase64 ? { image_update_mode: 'replace' as const } : {}),
      imageId: selectedChunk.img_id,
    }
  }, [
    selectedChunk,
    editingChunkContent,
    editingImportantKwd,
    editingQuestionKwd,
    editingImage,
  ])

  return {
    selectedChunk,
    session,
    isEditMode,
    editingChunkContent,
    editingImportantKwd,
    editingQuestionKwd,
    editingImage,
    isMarkdownPreview,
    setEditingChunkContent,
    setEditingImportantKwd,
    setEditingQuestionKwd,
    setEditingImage,
    setIsMarkdownPreview,
    populate,
    selectChunk,
    startEdit,
    reset,
    clearSelected,
    canSubmit,
    toPayloadAsync,
  }
}

export type ChunkEditForm = ReturnType<typeof useChunkEditForm>
