import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useMetadataSummary,
  useBatchUpdateMetadata,
  useUpdateKBMetadataSettings,
  useUpdateDocumentMetadataSettings,
  summaryToTableData,
  tableDataToSettings,
  settingsToTableData,
} from '@/hooks/use-metadata'
import {
  MetadataManageType,
  type MetadataFieldDefinition,
  type MetadataTableData,
} from '@/types/api'
import {
  getDeleteTextConfig,
  isSettingMode as checkSettingMode,
} from '../utils'
import { useDeleteConfirm } from './use-delete-confirm'
import { useFieldEditorState } from './use-field-editor-state'

const EMPTY_SETTINGS: MetadataFieldDefinition[] = []

interface UseMetadataEditorOptions {
  open: boolean
  onClose: () => void
  kbId: string
  mode: MetadataManageType
  initialSettings?: MetadataFieldDefinition[]
  documentId?: string
  onSuccess?: (data?: MetadataFieldDefinition[]) => void
}

export interface UseMetadataEditorReturn {
  tableData: MetadataTableData[]
  existingKeys: string[]
  isLoading: boolean
  isSaving: boolean
  isSettingMode: boolean
  isManageMode: boolean
  isSingleFileSettingMode: boolean
  fieldEditor: ReturnType<typeof useFieldEditorState>
  deleteConfirm: ReturnType<typeof useDeleteConfirm>
  handlers: {
    addField: () => void
    editField: (index: number) => void
    deleteField: (index: number) => void
    removeValue: (fieldIndex: number, value: string) => void
    saveField: (data: MetadataTableData) => void
    save: () => Promise<void>
  }
}

export function useMetadataEditor(
  options: UseMetadataEditorOptions,
): UseMetadataEditorReturn {
  const {
    open,
    onClose,
    kbId,
    mode,
    initialSettings = EMPTY_SETTINGS,
    documentId,
    onSuccess,
  } = options
  const { t } = useTranslation()

  const isSettingMode = checkSettingMode(mode)
  const isManageMode = mode === MetadataManageType.MANAGE
  const isUpdateSingleMode = mode === MetadataManageType.UPDATE_SINGLE
  const isValueManageMode = isManageMode || isUpdateSingleMode
  const isSingleFileSettingMode =
    mode === MetadataManageType.SINGLE_FILE_SETTING

  const [tableData, setTableData] = useState<MetadataTableData[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<
    Array<{ key: string; value?: string }>
  >([])
  const [pendingUpdates, setPendingUpdates] = useState<
    Array<{ key: string; match: string; value: string }>
  >([])

  const fieldEditor = useFieldEditorState()
  const deleteConfirm = useDeleteConfirm()

  const { data: summaryData, isLoading } = useMetadataSummary(
    kbId,
    isValueManageMode && open,
    isUpdateSingleMode && documentId ? [documentId] : undefined,
  )

  const batchUpdateMutation = useBatchUpdateMetadata()
  const updateKBSettingsMutation = useUpdateKBMetadataSettings()
  const updateDocSettingsMutation = useUpdateDocumentMetadataSettings()

  useEffect(() => {
    if (!open) return
    if (isSettingMode) {
      setTableData(settingsToTableData(initialSettings))
    } else if (isValueManageMode && summaryData?.summary) {
      setTableData(summaryToTableData(summaryData.summary))
    }
  }, [open, isSettingMode, isValueManageMode, initialSettings, summaryData])

  useEffect(() => {
    if (open) return
    setPendingDeletes([])
    setPendingUpdates([])
    fieldEditor.close()
  }, [open, fieldEditor])

  const existingKeys = useMemo(
    () => tableData.map((item) => item.field),
    [tableData],
  )

  const deleteTextConfig = useMemo(
    () => getDeleteTextConfig(mode, t),
    [mode, t],
  )

  const addField = useCallback(() => {
    fieldEditor.openForAdd(tableData.length)
  }, [fieldEditor, tableData.length])

  const editField = useCallback(
    (index: number) => {
      const item = tableData[index]
      if (!item) return
      fieldEditor.openForEdit(index, item)
    },
    [fieldEditor, tableData],
  )

  const deleteField = useCallback(
    (index: number) => {
      const item = tableData[index]
      if (!item) return
      deleteConfirm.show(
        deleteTextConfig.fieldTitle,
        item.field,
        deleteTextConfig.fieldWarn,
        () => {
          if (isValueManageMode) {
            setPendingDeletes((prev) => [...prev, { key: item.field }])
          }
          setTableData((prev) => prev.filter((_, i) => i !== index))
        },
      )
    },
    [deleteConfirm, deleteTextConfig, isValueManageMode, tableData],
  )

  const removeValue = useCallback(
    (fieldIndex: number, value: string) => {
      const item = tableData[fieldIndex]
      if (!item) return
      deleteConfirm.show(
        deleteTextConfig.valueTitle,
        value,
        deleteTextConfig.valueWarn,
        () => {
          if (isValueManageMode) {
            setPendingDeletes((prev) => [...prev, { key: item.field, value }])
          }
          setTableData((prev) =>
            prev.map((it, i) =>
              i === fieldIndex
                ? { ...it, values: it.values.filter((v) => v !== value) }
                : it,
            ),
          )
        },
      )
    },
    [deleteConfirm, deleteTextConfig, isValueManageMode, tableData],
  )

  const saveField = useCallback(
    (data: MetadataTableData) => {
      setTableData((prev) => {
        const editingIndex = fieldEditor.editingIndex
        if (editingIndex !== null && editingIndex < prev.length) {
          return prev.map((item, i) => (i === editingIndex ? data : item))
        }
        const existingIndex = prev.findIndex(
          (item) => item.field === data.field,
        )
        if (existingIndex >= 0) {
          const existing = prev[existingIndex]
          const mergedValues = [
            ...new Set([...existing.values, ...data.values]),
          ]
          return prev.map((item, i) =>
            i === existingIndex ? { ...data, values: mergedValues } : item,
          )
        }
        return [...prev, data]
      })
      fieldEditor.close()
    },
    [fieldEditor],
  )

  const save = useCallback(async () => {
    try {
      if (isValueManageMode) {
        if (pendingDeletes.length > 0 || pendingUpdates.length > 0) {
          await batchUpdateMutation.mutateAsync({
            kb_id: kbId,
            doc_ids:
              isUpdateSingleMode && documentId ? [documentId] : undefined,
            deletes: pendingDeletes,
            updates: pendingUpdates,
          })
        }
        onSuccess?.()
        onClose()
      } else if (isSingleFileSettingMode && documentId) {
        const settings = tableDataToSettings(tableData)
        await updateDocSettingsMutation.mutateAsync({
          kb_id: kbId,
          doc_id: documentId,
          metadata: settings,
        })
        onSuccess?.(settings)
        onClose()
      } else if (isSettingMode) {
        const settings = tableDataToSettings(tableData)
        await updateKBSettingsMutation.mutateAsync({
          kb_id: kbId,
          metadata: settings,
          enable_metadata: true,
        })
        onSuccess?.(settings)
        onClose()
      }
    } catch {
      // mutations surface errors via toast; swallow here to keep modal open
    }
  }, [
    batchUpdateMutation,
    documentId,
    isSettingMode,
    isSingleFileSettingMode,
    isUpdateSingleMode,
    isValueManageMode,
    kbId,
    onClose,
    onSuccess,
    pendingDeletes,
    pendingUpdates,
    tableData,
    updateDocSettingsMutation,
    updateKBSettingsMutation,
  ])

  const isSaving =
    updateKBSettingsMutation.isPending ||
    updateDocSettingsMutation.isPending ||
    batchUpdateMutation.isPending

  return {
    tableData,
    existingKeys,
    isLoading,
    isSaving,
    isSettingMode,
    isManageMode,
    isSingleFileSettingMode,
    fieldEditor,
    deleteConfirm,
    handlers: {
      addField,
      editField,
      deleteField,
      removeValue,
      saveField,
      save,
    },
  }
}
