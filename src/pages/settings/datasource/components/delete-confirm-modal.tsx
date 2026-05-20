'use client'

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteConfirmModalProps {
  visible: boolean
  loading: boolean
  sourceName: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 删除数据源确认模态框 - 使用项目设计令牌
 */
export function DeleteConfirmModal({
  visible,
  loading,
  sourceName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent size="sm" className="gap-0 overflow-hidden p-0">
        {/* 警示头部 */}
        <DialogHeader className="px-6 pb-4 pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-status-error-10">
              <AlertTriangle className="h-6 w-6 text-status-error" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <DialogTitle className="text-base font-semibold text-text-primary">
                {t('datasource.deleteConfirmTitle')}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-text-secondary">
                {t('datasource.deleteConfirmMessage', { name: '' })}
                <span className="font-semibold text-text-primary">
                  {' '}
                  {sourceName}
                </span>
                ？
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 底部操作 */}
        <DialogFooter className="border-t border-border-default bg-background-subtle px-6 py-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-9 px-5 text-sm font-medium"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="h-9 gap-2 px-5 text-sm font-medium"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
