/**
 * 团队确认对话框组件
 * 支持移除成员、退出团队、角色变更三种类型
 */

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'remove' | 'leave' | 'change-role' | null
  targetName: string
  roleChangeInfo?: { newRole: 'admin' | 'normal' } | null
  onConfirm: () => void
  isLoading: boolean
}

const dialogConfig = {
  remove: {
    title: '移除成员',
    getDescription: (name: string) =>
      `确定要将「${name}」从团队中移除吗？此操作不可撤销。`,
    confirmText: '移除',
    variant: 'destructive' as const,
  },
  leave: {
    title: '退出团队',
    getDescription: (name: string) =>
      `确定要退出「${name}」团队吗？退出后需要重新接受邀请才能加入。`,
    confirmText: '退出',
    variant: 'destructive' as const,
  },
  'change-role': {
    title: '更改角色',
    getDescription: (name: string, newRole?: string) =>
      newRole === 'admin'
        ? `确定要将「${name}」设为管理员吗？管理员可以邀请和移除成员。`
        : `确定要取消「${name}」的管理员权限吗？该成员将变为普通成员。`,
    confirmText: '确认',
    variant: 'default' as const,
  },
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  type,
  targetName,
  roleChangeInfo,
  onConfirm,
  isLoading,
}) => {
  if (!type) return null

  const config = dialogConfig[type]
  const description =
    type === 'change-role'
      ? dialogConfig['change-role'].getDescription(targetName, roleChangeInfo?.newRole)
      : config.getDescription(targetName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button variant={config.variant} onClick={onConfirm} disabled={isLoading}>
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

ConfirmDialog.displayName = 'ConfirmDialog'
