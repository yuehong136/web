import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-accent)]">
              <FileText className="h-5 w-5 text-[var(--color-text-on-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>
                {t('knowledge.metadata.editor.editMetadata')}
              </DialogTitle>
              <DialogDescription className="truncate">
                {docName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-200px)] space-y-4 overflow-y-auto px-6 py-4">
          {/* 编辑器 */}
          <DocumentMetadataEditor
            value={localMeta}
            onChange={setLocalMeta}
            fieldDefinitions={fieldDefinitions}
            disabled={isSaving}
          />

          {/* 提示信息 */}
          {fieldDefinitions.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-[var(--color-surface-secondary)] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {t('knowledge.metadata.modal.settingTip')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('knowledge.common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving
              ? t('knowledge.metadata.editor.saving')
              : t('knowledge.common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
