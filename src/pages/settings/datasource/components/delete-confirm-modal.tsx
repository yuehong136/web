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
      <DialogContent size="sm" className="p-0 gap-0 overflow-hidden">
        {/* 警示头部 */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full 
                            bg-state-error-10
                            flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-state-error" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <DialogTitle className="text-base font-semibold text-text-primary">
                {t('datasource.deleteConfirmTitle')}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-text-secondary leading-relaxed">
                {t('datasource.deleteConfirmMessage', { name: '' })}
                <span className="font-semibold text-text-primary"> {sourceName}</span>
                ？
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 底部操作 */}
        <DialogFooter className="px-6 py-4 bg-background-subtle border-t border-border-default">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={loading}
            className="px-5 h-9 text-sm font-medium"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={loading}
            className="px-5 h-9 text-sm font-medium gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
