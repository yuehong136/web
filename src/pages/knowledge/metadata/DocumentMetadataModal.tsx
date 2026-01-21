import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DocumentMetadataEditor } from '@/components/knowledge/DocumentMetadataEditor'
import { useUpdateDocumentMeta } from '@/hooks/use-metadata'
import { FileText, Loader2, Info } from 'lucide-react'
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
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-accent)] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[var(--color-text-on-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>编辑元数据</DialogTitle>
              <DialogDescription className="truncate">{docName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 编辑器 */}
          <DocumentMetadataEditor
            value={localMeta}
            onChange={setLocalMeta}
            fieldDefinitions={fieldDefinitions}
            disabled={isSaving}
          />

          {/* 提示信息 */}
          {fieldDefinitions.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-secondary)]">
              <Info className="h-4 w-4 text-[var(--color-text-tertiary)] mt-0.5 shrink-0" />
              <p className="text-[var(--color-text-tertiary)] text-sm">
                字段列表来自知识库的元数据模板设置
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
