import React, { useState, useCallback } from 'react'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminUser } from '../types'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  onSubmit: (userId: string, newPassword: string) => void
  isLoading?: boolean
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleClose = useCallback(() => {
    setNewPassword('')
    setConfirmPassword('')
    setErrors({})
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!newPassword) errs.newPassword = '请输入新密码'
    else if (newPassword.length < 8) errs.newPassword = '密码至少 8 位'
    if (!confirmPassword) errs.confirmPassword = '请确认密码'
    else if (newPassword !== confirmPassword) errs.confirmPassword = '两次密码不一致'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (user) onSubmit(user.email, newPassword)
  }, [newPassword, confirmPassword, user, onSubmit])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'rgba(245, 158, 11, 0.12)' }}
            >
              <KeyRound className="h-4 w-4 text-text-warning" />
            </span>
            修改密码
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="mx-space-lg flex items-center gap-space-sm rounded-xl bg-background-subtle px-space-md py-space-sm">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0"
              style={{ background: 'rgba(var(--twc-primary), 0.15)' }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-text-accent">
                  {(user.nickname || user.email)[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.nickname || user.email}
              </p>
              {user.nickname && (
                <p className="text-xs text-text-tertiary truncate">{user.email}</p>
              )}
            </div>
          </div>
        )}

        <div className="px-space-lg py-space-sm">
          <form onSubmit={handleSubmit} className="space-y-space-md">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary">
                新密码 <span className="text-text-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder="至少 8 位"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: '' })) }}
                error={errors.newPassword}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary">
                确认密码 <span className="text-text-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })) }}
                error={errors.confirmPassword}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="gap-space-sm">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit as any} disabled={isLoading}>
            {isLoading ? '保存中...' : '保存密码'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
