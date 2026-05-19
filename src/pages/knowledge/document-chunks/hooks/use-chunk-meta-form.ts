import { useCallback, useState } from 'react'
import type { ChunkListDocument, MetadataEntry } from '../types'

export const useChunkMetaForm = () => {
  const [metaModalOpen, setMetaModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<MetadataEntry[]>([])
  const [nextMetaId, setNextMetaId] = useState(1)

  const startAnnotation = useCallback((docInfo: ChunkListDocument | null) => {
    const metaArray = Object.entries(docInfo?.meta_fields || {}).map(
      ([key, value], index) => ({
        id: `meta_${index + 1}`,
        key,
        value,
      }),
    )
    setEditingMeta(metaArray)
    setNextMetaId(metaArray.length + 1)
    setMetaModalOpen(true)
  }, [])

  const close = useCallback(() => {
    setMetaModalOpen(false)
    setEditingMeta([])
  }, [])

  const addField = useCallback(() => {
    setEditingMeta((prev) => [
      ...prev,
      { id: `meta_${nextMetaId}`, key: `field_${nextMetaId}`, value: '' },
    ])
    setNextMetaId((prev) => prev + 1)
  }, [nextMetaId])

  const removeField = useCallback((id: string) => {
    setEditingMeta((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateKey = useCallback((id: string, key: string) => {
    setEditingMeta((prev) =>
      prev.map((item) => (item.id === id ? { ...item, key } : item)),
    )
  }, [])

  const updateValue = useCallback((id: string, value: unknown) => {
    setEditingMeta((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item)),
    )
  }, [])

  const toPayload = useCallback(
    (): Record<string, unknown> =>
      editingMeta.reduce(
        (acc, item) => {
          if (item.key.trim()) acc[item.key] = item.value
          return acc
        },
        {} as Record<string, unknown>,
      ),
    [editingMeta],
  )

  return {
    metaModalOpen,
    editingMeta,
    startAnnotation,
    close,
    addField,
    removeField,
    updateKey,
    updateValue,
    toPayload,
  }
}

export type ChunkMetaForm = ReturnType<typeof useChunkMetaForm>
