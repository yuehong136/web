/**
 * 邀请成员对话框组件
 * 容器组件 - 包含表单逻辑
 */

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, UserPlus, Loader2 } from 'lucide-react'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (email: string) => Promise<void>
  isLoading?: boolean
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('请输入邮箱地址')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('请输入有效的邮箱地址')
      return
    }

    try {
      await onInvite(trimmedEmail)
      setEmail('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '邀请失败，请重试')
    }
  }

  const handleClose = () => {
    setEmail('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            邀请成员
          </DialogTitle>
          <DialogDescription>
            输入成员的邮箱地址发送邀请，对方需要接受邀请后才能加入团队
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入成员邮箱"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                leftIcon={<Mail className="h-4 w-4" />}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-status-error-text)' }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  发送邀请
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

InviteMemberDialog.displayName = 'InviteMemberDialog'
