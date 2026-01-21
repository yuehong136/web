import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Settings2, AlertCircle, Database, AlertTriangle, Sparkles } from 'lucide-react'
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
import type {
  MetadataTableData,
  MetadataFieldDefinition,
} from '@/types/api'
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
  mode: (typeof MetadataManageType)[keyof typeof MetadataManageType]
): DeleteTextConfig => {
  const isGlobalMode = mode === MetadataManageType.MANAGE || mode === MetadataManageType.SETTING
  
  if (isGlobalMode) {
    return {
      fieldTitle: '删除元数据字段',
      fieldWarn: '此字段及其所有对应值将从所有关联文件中删除，此操作不可撤销。',
      valueTitle: '删除元数据值',
      valueWarn: '此值将从所有关联文件中删除，此操作不可撤销。',
    }
  } else {
    // UPDATE_SINGLE 或 SINGLE_FILE_SETTING
    return {
      fieldTitle: '删除元数据字段',
      fieldWarn: '此字段及其所有对应值将从此文件中删除。',
      valueTitle: '删除元数据值',
      valueWarn: '此值将从此文件中删除。',
    }
  }
}

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
  initialSettings = [],
  documentId,
  onSuccess,
  onNavigateToSettings,
}) => {
  const isSettingMode = mode === MetadataManageType.SETTING || mode === MetadataManageType.SINGLE_FILE_SETTING
  const isManageMode = mode === MetadataManageType.MANAGE
  const isSingleFileSettingMode = mode === MetadataManageType.SINGLE_FILE_SETTING

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
  const { data: summaryData, isLoading } = useMetadataSummary(kbId, isManageMode && open)

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
    [tableData]
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
    [hideDeleteConfirm]
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
    [tableData]
  )

  // 获取删除文案配置
  const deleteTextConfig = useMemo(() => getDeleteTextConfig(mode), [mode])

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
        }
      )
    },
    [isManageMode, tableData, showDeleteConfirm, deleteTextConfig]
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
                : item
            )
          )
        }
      )
    },
    [isManageMode, tableData, showDeleteConfirm, deleteTextConfig]
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
          const existingIndex = prev.findIndex((item) => item.field === data.field)
          if (existingIndex >= 0) {
            // 合并值
            const existing = prev[existingIndex]
            const mergedValues = [...new Set([...existing.values, ...data.values])]
            return prev.map((item, i) =>
              i === existingIndex ? { ...data, values: mergedValues } : item
            )
          }
          return [...prev, data]
        }
      })
      setEditorOpen(false)
      setEditingIndex(null)
      setEditingData(null)
    },
    [editingIndex]
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
          title: '管理元数据',
          subtitle: '查看并管理知识库中所有文档的元数据',
        }
      case MetadataManageType.SETTING:
        return {
          title: '元数据生成设置',
          subtitle: '定义元数据字段，新解析的文档将自动提取这些字段',
        }
      case MetadataManageType.SINGLE_FILE_SETTING:
        return {
          title: '文档元数据设置',
          subtitle: '为此文档单独配置元数据字段',
        }
      case MetadataManageType.UPDATE_SINGLE:
        return {
          title: '编辑元数据',
          subtitle: '编辑此文档的元数据值',
        }
      default:
        return {
          title: '元数据',
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
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
                isSettingMode 
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
              )}>
                {isSettingMode ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <DialogTitle>
                  {title}
                </DialogTitle>
                {subtitle && (
                  <DialogDescription>
                    {subtitle}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 scrollbar-thin">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">字段列表</span>
                {tableData.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-text-tertiary bg-surface-secondary rounded">
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
                    <Settings2 className="w-4 h-4 mr-1.5" />
                    模板设置
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddField} 
                  disabled={isSaving}
                  className="hover:border-surface-accent hover:text-surface-accent"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加字段
                </Button>
              </div>
            </div>

            {/* 表格容器 */}
            <div
              className={cn(
                'border border-border-default rounded-xl overflow-hidden',
                'bg-surface-primary shadow-sm'
              )}
            >
              {/* 表头 */}
              <div className="flex items-center bg-surface-secondary/40 border-b border-border-default/60">
                <div className="w-[140px] shrink-0 px-4 py-2.5">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    字段名
                  </span>
                </div>
                {isSettingMode && (
                  <div className="w-[160px] shrink-0 px-4 py-2.5">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                      描述
                    </span>
                  </div>
                )}
                <div className="flex-1 px-4 py-2.5">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    {isSettingMode ? '可选值' : '值'}
                  </span>
                </div>
                <div className="w-[88px] shrink-0 px-4 py-2.5">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    操作
                  </span>
                </div>
              </div>

              {/* 数据行 */}
              <div className="max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-border-default scrollbar-track-transparent">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                    <div className="relative w-10 h-10 mb-3">
                      <div className="absolute inset-0 rounded-full border-2 border-border-default" />
                      <div className="absolute inset-0 rounded-full border-2 border-surface-accent border-t-transparent animate-spin" />
                    </div>
                    <span className="text-sm">加载中...</span>
                  </div>
                ) : tableData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-secondary to-surface-tertiary flex items-center justify-center mb-4 shadow-sm">
                      <Database className="w-7 h-7 text-text-tertiary" />
                    </div>
                    <p className="text-sm font-medium text-text-secondary mb-1">
                      暂无元数据字段
                    </p>
                    <p className="text-xs text-text-tertiary max-w-[200px]">
                      点击上方「添加字段」按钮开始定义元数据
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
              <div className="flex items-start gap-2.5 mt-4 p-3 bg-surface-accent/5 border border-surface-accent/15 rounded-lg">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-accent/10 shrink-0 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-surface-accent" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  在此处删除字段或值将影响所有关联文档。如需修改字段定义模板，请前往知识库设置。
                </p>
              </div>
            )}

            {/* Setting 模式提示 */}
            {isSettingMode && tableData.length > 0 && (
              <div className="flex items-start gap-2.5 mt-4 p-3 bg-status-info/5 border border-status-info/15 rounded-lg">
                <Sparkles className="w-4 h-4 text-status-info shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  定义的字段将用于 AI 自动提取元数据。描述越清晰，提取效果越好。
                </p>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isSaving}
            >
              取消
            </Button>
            <Button 
              onClick={handleSave} 
              loading={isSaving}
            >
              保存
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
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-status-error/10">
                <AlertTriangle className="w-5 h-5 text-status-error" />
              </div>
              <AlertDialogTitle className="text-base">
                {deleteConfirm.title}
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pl-[52px]">
              {/* 被删除项显示 */}
              <div className="inline-flex items-center px-3 py-1.5 bg-surface-secondary border border-border-default rounded-md">
                <span className="font-medium text-text-primary text-sm truncate max-w-[260px]">
                  {deleteConfirm.name}
                </span>
              </div>
              {/* 警告提示 */}
              <div className="flex items-start gap-2 p-2.5 bg-status-warning/5 border border-status-warning/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  {deleteConfirm.warnText}
                </p>
              </div>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="text-sm">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConfirm.onConfirm}
              className="bg-status-error hover:bg-status-error/90 text-sm"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
