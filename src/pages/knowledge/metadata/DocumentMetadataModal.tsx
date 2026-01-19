import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DocumentMetadataEditor } from '@/components/knowledge/DocumentMetadataEditor'
import { useUpdateDocumentMeta } from '@/hooks/use-metadata'
import type { MetadataFieldDefinition } from '@/types/api'

interface DocumentMetadataModalProps {
  /**
   * 是否显示
   */
  open: boolean
  /**
   * 关闭回调
   */
  onClose: () => void
  /**
   * 文档 ID
   */
  docId: string
  /**
   * 文档名称
   */
  docName: string
  /**
   * 知识库 ID（用于刷新缓存）
   */
  kbId?: string
  /**
   * 当前 metadata 值
   */
  metaFields: Record<string, any>
  /**
   * 知识库定义的字段模板
   */
  fieldDefinitions?: MetadataFieldDefinition[]
  /**
   * 保存成功回调
   */
  onSuccess?: () => void
}

/**
 * 单文档 Metadata 编辑模态框
 */
export const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({
  open,
  onClose,
  docId,
  docName,
  kbId,
  metaFields,
  fieldDefinitions = [],
  onSuccess,
}) => {
  // 本地编辑状态
  const [localMeta, setLocalMeta] = useState<Record<string, any>>({})

  // Mutation
  const updateMetaMutation = useUpdateDocumentMeta()

  // 初始化
  useEffect(() => {
    if (open) {
      setLocalMeta(metaFields || {})
    }
  }, [open, metaFields])

  // 保存
  const handleSave = async () => {
    await updateMetaMutation.mutateAsync({
      docId,
      meta: localMeta,
      kbId,
    })
    onSuccess?.()
    onClose()
  }

  const isSaving = updateMetaMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent title={`编辑元数据 - ${docName}`} className="max-w-lg">
        <div className="flex flex-col gap-space-md">
          {/* 编辑器 */}
          <DocumentMetadataEditor
            value={localMeta}
            onChange={setLocalMeta}
            fieldDefinitions={fieldDefinitions}
            disabled={isSaving}
          />

          {/* 提示 */}
          {fieldDefinitions.length > 0 && (
            <p className="text-text-tertiary text-body-sm">
              提示：字段列表来自知识库的元数据模板设置
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-space-sm pt-space-md border-t border-border-default">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
