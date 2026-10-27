import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
import { EntityAvatar } from '@/components/patterns/entity-avatar'

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
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // 存 i18n key 而非文案，切换语言后错误提示随之更新
  const [errors, setErrors] = useState<Record<string, string>>({})
  const errorText = (field: string) =>
    errors[field] ? t(errors[field]) : undefined

  const handleClose = useCallback(() => {
    setNewPassword('')
    setConfirmPassword('')
    setErrors({})
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const errs: Record<string, string> = {}
      if (!newPassword)
        errs.newPassword = 'settings.admin.validation.newPasswordRequired'
      else if (newPassword.length < 8)
        errs.newPassword = 'settings.admin.validation.passwordLength'
      if (!confirmPassword)
        errs.confirmPassword =
          'settings.admin.validation.confirmPasswordRequired'
      else if (newPassword !== confirmPassword)
        errs.confirmPassword = 'settings.admin.validation.passwordMismatch'
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }
      if (user) onSubmit(user.email, newPassword)
    },
    [newPassword, confirmPassword, user, onSubmit],
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-warning-subtle">
              <KeyRound className="h-4 w-4 text-status-warning" />
            </span>
            {t('settings.admin.changePassword.title')}
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="mx-space-lg flex items-center gap-space-sm rounded-radius-xl bg-surface-secondary px-space-md py-space-base">
            <EntityAvatar
              name={user.nickname || user.email}
              seed={user.email}
              shape="circle"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {user.nickname || user.email}
              </p>
              {user.nickname && (
                <p className="truncate text-xs text-text-tertiary">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="px-space-lg pt-space-sm pb-space-lg">
          <form
            id="change-password-form"
            onSubmit={handleSubmit}
            className="space-y-space-lg"
          >
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                {t('settings.admin.form.newPassword')}{' '}
                <span className="text-status-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder={t('settings.admin.form.passwordPlaceholder')}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, newPassword: '' }))
                }}
                error={errorText('newPassword')}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-text-tertiary transition-colors hover:text-text-secondary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                {t('settings.admin.form.confirmPassword')}{' '}
                <span className="text-status-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder={t(
                  'settings.admin.form.confirmNewPasswordPlaceholder',
                )}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                }}
                error={errorText('confirmPassword')}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="gap-space-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            type="submit"
            form="change-password-form"
            disabled={isLoading}
          >
            {isLoading
              ? t('common.saving')
              : t('settings.admin.changePassword.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
