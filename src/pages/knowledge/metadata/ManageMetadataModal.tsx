import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Settings2,
  AlertCircle,
  Database,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MetadataFieldRow } from '@/components/knowledge/MetadataFieldRow'
import { MetadataFieldEditorModal } from './MetadataFieldEditorModal'
import {
  useMetadataSummary,
  useBatchUpdateMetadata,
  useUpdateKBMetadataSettings,
  useUpdateDocumentMetadataSettings,
  summaryToTableData,
  tableDataToSettings,
  settingsToTableData,
} from '@/hooks/use-metadata'
import type { MetadataTableData, MetadataFieldDefinition } from '@/types/api'
import { MetadataManageType } from '@/types/api'

// ============================================================================
// 删除确认文案配置 - 根据模式区分全局/单文件
// ============================================================================

type DeleteTextConfig = {
  fieldTitle: string
  fieldWarn: string
  valueTitle: string
  valueWarn: string
}

const getDeleteTextConfig = (
  mode: (typeof MetadataManageType)[keyof typeof MetadataManageType],
  t: ReturnType<typeof useTranslation>['t'],
): DeleteTextConfig => {
  const isGlobalMode =
    mode === MetadataManageType.MANAGE || mode === MetadataManageType.SETTING

  if (isGlobalMode) {
    return {
      fieldTitle: t('knowledge.metadata.delete.fieldTitle'),
      fieldWarn: t('knowledge.metadata.delete.globalFieldWarn'),
      valueTitle: t('knowledge.metadata.delete.valueTitle'),
      valueWarn: t('knowledge.metadata.delete.globalValueWarn'),
    }
  } else {
    // UPDATE_SINGLE 或 SINGLE_FILE_SETTING
    return {
      fieldTitle: t('knowledge.metadata.delete.fieldTitle'),
      fieldWarn: t('knowledge.metadata.delete.singleFieldWarn'),
      valueTitle: t('knowledge.metadata.delete.valueTitle'),
      valueWarn: t('knowledge.metadata.delete.singleValueWarn'),
    }
  }
}

const EMPTY_SETTINGS: MetadataFieldDefinition[] = []

interface ManageMetadataModalProps {
  /**
   * 是否显示
   */
  open: boolean
  /**
   * 关闭回调
   */
  onClose: () => void
  /**
   * 知识库 ID
   */
  kbId: string
  /**
   * 管理模式
   */
  mode: (typeof MetadataManageType)[keyof typeof MetadataManageType]
  /**
   * 初始数据（用于 Setting 模式）
   */
  initialSettings?: MetadataFieldDefinition[]
  /**
   * 文档 ID（用于 SingleFileSetting 模式）
   */
  documentId?: string
  /**
   * 保存成功回调
   */
  onSuccess?: (data?: MetadataFieldDefinition[]) => void
  /**
   * 跳转到模板设置回调（仅 MANAGE 模式使用）
   */
  onNavigateToSettings?: () => void
}

// 删除确认对话框内容
interface DeleteConfirmState {
  visible: boolean
  title: string
  name: string
  warnText: string
  onConfirm: () => void
}

/**
 * Metadata 管理主模态框
 * 支持四种模式：
 * - MANAGE: 查看和管理知识库所有文档的 metadata 汇总
 * - SETTING: 编辑知识库 metadata 字段模板
 * - UPDATE_SINGLE: 编辑单文档 metadata 值
 * - SINGLE_FILE_SETTING: 编辑单文档的 metadata 字段模板
 */
export const ManageMetadataModal: React.FC<ManageMetadataModalProps> = ({
  open,
  onClose,
  kbId,
  mode,
  initialSettings = EMPTY_SETTINGS,
  documentId,
  onSuccess,
  onNavigateToSettings,
}) => {
  const { t } = useTranslation()
  const isSettingMode =
    mode === MetadataManageType.SETTING ||
    mode === MetadataManageType.SINGLE_FILE_SETTING
  const isManageMode = mode === MetadataManageType.MANAGE
  const isSingleFileSettingMode =
    mode === MetadataManageType.SINGLE_FILE_SETTING

  // 表格数据状态
  const [tableData, setTableData] = useState<MetadataTableData[]>([])

  // 字段编辑器状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingData, setEditingData] = useState<MetadataTableData | null>(null)

  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    visible: false,
    title: '',
    name: '',
    warnText: '',
    onConfirm: () => {},
  })

  // 操作记录（用于 Manage 模式的批量更新）
  const [pendingDeletes, setPendingDeletes] = useState<
    Array<{ key: string; value?: string }>
  >([])
  const [pendingUpdates, setPendingUpdates] = useState<
    Array<{ key: string; match: string; value: string }>
  >([])

  // 数据获取（仅 Manage 模式）
  const { data: summaryData, isLoading } = useMetadataSummary(
    kbId,
    isManageMode && open,
  )

  // Mutations
  const batchUpdateMutation = useBatchUpdateMetadata()
  const updateKBSettingsMutation = useUpdateKBMetadataSettings()
  const updateDocSettingsMutation = useUpdateDocumentMetadataSettings()

  // 初始化数据
  useEffect(() => {
    if (!open) return

    if (isSettingMode) {
      setTableData(settingsToTableData(initialSettings))
    } else if (isManageMode && summaryData?.summary) {
      setTableData(summaryToTableData(summaryData.summary))
    }
  }, [open, isSettingMode, isManageMode, initialSettings, summaryData])

  // 重置状态
  useEffect(() => {
    if (!open) {
      setPendingDeletes([])
      setPendingUpdates([])
      setEditingIndex(null)
      setEditingData(null)
    }
  }, [open])

  // 已存在的字段名
  const existingKeys = useMemo(
    () => tableData.map((item) => item.field),
    [tableData],
  )

  // 隐藏删除确认对话框
  const hideDeleteConfirm = useCallback(() => {
    setDeleteConfirm({
      visible: false,
      title: '',
      name: '',
      warnText: '',
      onConfirm: () => {},
    })
  }, [])

  // 显示删除确认对话框
  const showDeleteConfirm = useCallback(
    (title: string, name: string, warnText: string, onConfirm: () => void) => {
      setDeleteConfirm({
        visible: true,
        title,
        name,
        warnText,
        onConfirm: () => {
          hideDeleteConfirm()
          onConfirm()
        },
      })
    },
    [hideDeleteConfirm],
  )

  // 添加字段
  const handleAddField = useCallback(() => {
    setEditingIndex(tableData.length)
    setEditingData({
      field: '',
      description: '',
      values: [],
      restrictDefinedValues: false,
    })
    setEditorOpen(true)
  }, [tableData.length])

  // 编辑字段
  const handleEditField = useCallback(
    (index: number) => {
      setEditingIndex(index)
      setEditingData(tableData[index])
      setEditorOpen(true)
    },
    [tableData],
  )

  // 获取删除文案配置
  const deleteTextConfig = useMemo(
    () => getDeleteTextConfig(mode, t),
    [mode, t],
  )

  // 删除字段
  const handleDeleteField = useCallback(
    (index: number) => {
      const item = tableData[index]
      showDeleteConfirm(
        deleteTextConfig.fieldTitle,
        item.field,
        deleteTextConfig.fieldWarn,
        () => {
          if (isManageMode) {
            setPendingDeletes((prev) => [...prev, { key: item.field }])
          }
          setTableData((prev) => prev.filter((_, i) => i !== index))
        },
      )
    },
    [isManageMode, tableData, showDeleteConfirm, deleteTextConfig],
  )

  // 删除单个值
  const handleRemoveValue = useCallback(
    (fieldIndex: number, value: string) => {
      const item = tableData[fieldIndex]
      showDeleteConfirm(
        deleteTextConfig.valueTitle,
        value,
        deleteTextConfig.valueWarn,
        () => {
          if (isManageMode) {
            setPendingDeletes((prev) => [...prev, { key: item.field, value }])
          }
          setTableData((prev) =>
            prev.map((item, i) =>
              i === fieldIndex
                ? { ...item, values: item.values.filter((v) => v !== value) }
                : item,
            ),
          )
        },
      )
    },
    [isManageMode, tableData, showDeleteConfirm, deleteTextConfig],
  )

  // 保存字段编辑
  const handleSaveField = useCallback(
    (data: MetadataTableData) => {
      setTableData((prev) => {
        if (editingIndex !== null && editingIndex < prev.length) {
          // 编辑现有字段
          return prev.map((item, i) => (i === editingIndex ? data : item))
        } else {
          // 添加新字段 - 检查是否存在同名字段并合并
          const existingIndex = prev.findIndex(
            (item) => item.field === data.field,
          )
          if (existingIndex >= 0) {
            // 合并值
            const existing = prev[existingIndex]
            const mergedValues = [
              ...new Set([...existing.values, ...data.values]),
            ]
            return prev.map((item, i) =>
              i === existingIndex ? { ...data, values: mergedValues } : item,
            )
          }
          return [...prev, data]
        }
      })
      setEditorOpen(false)
      setEditingIndex(null)
      setEditingData(null)
    },
    [editingIndex],
  )

  // 保存所有更改
  const handleSave = useCallback(async () => {
    try {
      if (isManageMode) {
        // Manage 模式：批量更新/删除
        if (pendingDeletes.length > 0 || pendingUpdates.length > 0) {
          await batchUpdateMutation.mutateAsync({
            kb_id: kbId,
            deletes: pendingDeletes,
            updates: pendingUpdates,
          })
        }
        onSuccess?.()
        onClose()
      } else if (isSingleFileSettingMode && documentId) {
        // 单文档设置模式
        const settings = tableDataToSettings(tableData)
        await updateDocSettingsMutation.mutateAsync({
          doc_id: documentId,
          metadata: settings,
        })
        onSuccess?.(settings)
        onClose()
      } else if (isSettingMode) {
        // 知识库设置模式
        const settings = tableDataToSettings(tableData)
        await updateKBSettingsMutation.mutateAsync({
          kb_id: kbId,
          metadata: settings,
          enable_metadata: true,
        })
        onSuccess?.(settings)
        onClose()
      }
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }, [
    isManageMode,
    isSettingMode,
    isSingleFileSettingMode,
    tableData,
    kbId,
    documentId,
    pendingDeletes,
    pendingUpdates,
    batchUpdateMutation,
    updateKBSettingsMutation,
    updateDocSettingsMutation,
    onSuccess,
    onClose,
  ])

  // 获取标题配置
  const getModalConfig = () => {
    switch (mode) {
      case MetadataManageType.MANAGE:
        return {
          title: t('knowledge.metadata.modal.manageTitle'),
          subtitle: t('knowledge.metadata.modal.manageSubtitle'),
        }
      case MetadataManageType.SETTING:
        return {
          title: t('knowledge.metadata.modal.settingTitle'),
          subtitle: t('knowledge.metadata.modal.settingSubtitle'),
        }
      case MetadataManageType.SINGLE_FILE_SETTING:
        return {
          title: t('knowledge.metadata.modal.singleFileSettingTitle'),
          subtitle: t('knowledge.metadata.modal.singleFileSettingSubtitle'),
        }
      case MetadataManageType.UPDATE_SINGLE:
        return {
          title: t('knowledge.metadata.modal.updateSingleTitle'),
          subtitle: t('knowledge.metadata.modal.updateSingleSubtitle'),
        }
      default:
        return {
          title: t('knowledge.metadata.modal.fallbackTitle'),
          subtitle: '',
        }
    }
  }

  const { title, subtitle } = getModalConfig()
  const isSaving =
    updateKBSettingsMutation.isPending ||
    updateDocSettingsMutation.isPending ||
    batchUpdateMutation.isPending

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl">
          {/* 头部 */}
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  isSettingMode
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
                )}
              >
                {isSettingMode ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <Database className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <DialogTitle>{title}</DialogTitle>
                {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
              </div>
            </div>
          </DialogHeader>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 scrollbar-thin">
            {/* 工具栏 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {t('knowledge.metadata.modal.fieldList')}
                </span>
                {tableData.length > 0 && (
                  <span className="bg-surface-secondary inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium text-text-tertiary">
                    {tableData.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isManageMode && onNavigateToSettings && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-text-accent"
                    onClick={() => {
                      onClose()
                      onNavigateToSettings()
                    }}
                  >
                    <Settings2 className="mr-1.5 h-4 w-4" />
                    {t('knowledge.metadata.modal.templateSettings')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  disabled={isSaving}
                  className="hover:border-surface-accent hover:text-surface-accent"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('knowledge.metadata.modal.addField')}
                </Button>
              </div>
            </div>

            {/* 表格容器 */}
            <div
              className={cn(
                'overflow-hidden rounded-xl border border-border-default',
                'bg-surface-primary shadow-sm',
              )}
            >
              {/* 表头 */}
              <div className="bg-surface-secondary/40 border-border-default/60 flex items-center border-b">
                <div className="w-[140px] shrink-0 px-4 py-2.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t('knowledge.metadata.modal.fieldName')}
                  </span>
                </div>
                {isSettingMode && (
                  <div className="w-[160px] shrink-0 px-4 py-2.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                      {t('knowledge.metadata.modal.description')}
                    </span>
                  </div>
                )}
                <div className="flex-1 px-4 py-2.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {isSettingMode
                      ? t('knowledge.metadata.modal.optionalValues')
                      : t('knowledge.metadata.modal.values')}
                  </span>
                </div>
                <div className="w-[88px] shrink-0 px-4 py-2.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {t('knowledge.metadata.modal.actions')}
                  </span>
                </div>
              </div>

              {/* 数据行 */}
              <div className="max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-default">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                    <div className="relative mb-3 h-10 w-10">
                      <div className="absolute inset-0 rounded-full border-2 border-border-default" />
                      <div className="border-surface-accent absolute inset-0 animate-spin rounded-full border-2 border-t-transparent" />
                    </div>
                    <span className="text-sm">
                      {t('knowledge.metadata.modal.loading')}
                    </span>
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="from-surface-secondary to-surface-tertiary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm">
                      <Database className="h-7 w-7 text-text-tertiary" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-text-secondary">
                      {t('knowledge.metadata.modal.emptyTitle')}
                    </p>
                    <p className="max-w-[200px] text-xs text-text-tertiary">
                      {t('knowledge.metadata.modal.emptyDescription')}
                    </p>
                  </div>
                ) : (
                  tableData.map((item, index) => (
                    <MetadataFieldRow
                      key={`${item.field}-${index}`}
                      field={item.field}
                      description={item.description}
                      values={item.values.map((v) => ({ value: v }))}
                      showDescription={isSettingMode}
                      allowRemoveValue={isManageMode}
                      onRemoveValue={(value) => handleRemoveValue(index, value)}
                      onEdit={() => handleEditField(index)}
                      onDelete={() => handleDeleteField(index)}
                      disabled={isSaving}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 提示信息 - 增强设计 */}
            {isManageMode && tableData.length > 0 && (
              <div className="bg-surface-accent/5 border-surface-accent/15 mt-4 flex items-start gap-2.5 rounded-lg border p-3">
                <div className="bg-surface-accent/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <AlertCircle className="text-surface-accent h-3.5 w-3.5" />
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {t('knowledge.metadata.modal.manageTip')}
                </p>
              </div>
            )}

            {/* Setting 模式提示 */}
            {isSettingMode && tableData.length > 0 && (
              <div className="bg-status-info/5 border-status-info/15 mt-4 flex items-start gap-2.5 rounded-lg border p-3">
                <Sparkles className="text-status-info mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed text-text-secondary">
                  {t('knowledge.metadata.modal.settingTip')}
                </p>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              {t('knowledge.common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={isSaving}>
              {t('knowledge.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 字段编辑器 */}
      <MetadataFieldEditorModal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false)
          setEditingIndex(null)
          setEditingData(null)
        }}
        initialData={editingData || undefined}
        existingKeys={existingKeys.filter((k) => k !== editingData?.field)}
        mode={mode}
        onSave={handleSaveField}
      />

      {/* 删除确认对话框 - 增强设计 */}
      <AlertDialog
        open={deleteConfirm.visible}
        onOpenChange={(open) => !open && hideDeleteConfirm()}
      >
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="bg-status-error/10 flex h-10 w-10 items-center justify-center rounded-full">
                <AlertTriangle className="text-status-error h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-base">
                {deleteConfirm.title}
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <div className="space-y-3 pl-[52px]">
              {/* 被删除项显示 */}
              <div className="bg-surface-secondary inline-flex items-center rounded-md border border-border-default px-3 py-1.5">
                <span className="max-w-[260px] truncate text-sm font-medium text-text-primary">
                  {deleteConfirm.name}
                </span>
              </div>
              {/* 警告提示 */}
              <div className="bg-status-warning/5 border-status-warning/20 flex items-start gap-2 rounded-md border p-2.5">
                <AlertCircle className="text-status-warning mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed text-text-secondary">
                  {deleteConfirm.warnText}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel>
              {t('knowledge.common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteConfirm.onConfirm}
            >
              {t('knowledge.metadata.modal.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
