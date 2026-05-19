import { useCallback, useMemo, useState } from 'react'
import type { MetadataTableData } from '@/types/api'

export interface UseFieldEditorStateReturn {
  open: boolean
  editingIndex: number | null
  editingData: MetadataTableData | null
  openForAdd: (nextIndex: number) => void
  openForEdit: (index: number, data: MetadataTableData) => void
  close: () => void
}

export function useFieldEditorState(): UseFieldEditorStateReturn {
  const [open, setOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<MetadataTableData | null>(null)

  const openForAdd = useCallback((nextIndex: number) => {
    setEditingIndex(nextIndex)
    setEditingData({
      field: '',
      description: '',
      values: [],
      restrictDefinedValues: false,
    })
    setOpen(true)
  }, [])

  const openForEdit = useCallback((index: number, data: MetadataTableData) => {
    setEditingIndex(index)
    setEditingData(data)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setEditingIndex(null)
    setEditingData(null)
  }, [])

  return useMemo(
    () => ({ open, editingIndex, editingData, openForAdd, openForEdit, close }),
    [open, editingIndex, editingData, openForAdd, openForEdit, close],
  )
}
