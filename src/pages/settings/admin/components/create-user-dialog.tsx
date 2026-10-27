import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { CreateUserParams } from '../types'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateUserParams) => void
  isLoading?: boolean
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // 存 i18n key 而非文案，切换语言后错误提示随之更新
  const [errors, setErrors] = useState<Record<string, string>>({})
  const errorText = (field: string) =>
    errors[field] ? t(errors[field]) : undefined

  const validate = useCallback(() => {
    const errs: Record<string, string> = {}
    if (!email) errs.email = 'settings.admin.validation.emailRequired'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'settings.admin.validation.emailInvalid'
    if (!password) errs.password = 'settings.admin.validation.passwordRequired'
    else if (password.length < 8)
      errs.password = 'settings.admin.validation.passwordLength'
    if (!confirmPassword)
      errs.confirmPassword = 'settings.admin.validation.confirmPasswordRequired'
    else if (password !== confirmPassword)
      errs.confirmPassword = 'settings.admin.validation.passwordMismatch'
    return errs
  }, [email, password, confirmPassword])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const errs = validate()
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }
      onSubmit({ username: email, password, role: isAdmin ? 'admin' : 'user' })
    },
    [validate, onSubmit, email, password, isAdmin],
  )

  const handleClose = useCallback(() => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setIsAdmin(false)
    setErrors({})
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12">
              <UserPlus className="h-4 w-4 text-text-accent" />
            </span>
            {t('settings.admin.actions.createUser')}
          </DialogTitle>
        </DialogHeader>

        <form id="create-user-form" onSubmit={handleSubmit}>
          <div className="space-y-space-lg px-space-lg pt-space-sm pb-space-lg">
            {/* Email */}
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                {t('settings.admin.form.email')}{' '}
                <span className="text-status-error">*</span>
              </label>
              <Input
                type="email"
                inputSize="sm"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: '' }))
                }}
                error={errorText('email')}
              />
            </div>

            {/* Password */}
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                {t('settings.admin.form.password')}{' '}
                <span className="text-status-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder={t('settings.admin.form.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: '' }))
                }}
                error={errorText('password')}
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

            {/* Confirm Password */}
            <div className="space-y-space-xs">
              <label className="text-sm font-medium text-text-secondary">
                {t('settings.admin.form.confirmPassword')}{' '}
                <span className="text-status-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder={t(
                  'settings.admin.form.confirmPasswordPlaceholder',
                )}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                }}
                error={errorText('confirmPassword')}
              />
            </div>

            {/* Admin Toggle */}
            <label
              className="flex cursor-pointer items-center gap-space-sm rounded-radius-xl border border-border-default bg-surface-secondary px-space-md py-space-base transition-colors hover:bg-surface-tertiary"
              onClick={() => setIsAdmin((v) => !v)}
            >
              <div
                className={cn(
                  'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                  isAdmin
                    ? 'bg-state-focus'
                    : 'border border-border-default bg-background-default',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-background-surface shadow-xs transition-transform',
                    isAdmin ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {t('settings.admin.createUser.makeAdmin')}
                </p>
                <p className="text-xs text-text-tertiary">
                  {t('settings.admin.createUser.makeAdminHint')}
                </p>
              </div>
            </label>
          </div>
        </form>

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
            form="create-user-form"
            disabled={isLoading}
          >
            {isLoading
              ? t('settings.admin.createUser.submitting')
              : t('settings.admin.createUser.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
