import React, { useState, useCallback } from 'react'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const errs: Record<string, string> = {}
    if (!email) errs.email = '请输入邮箱'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = '邮箱格式不正确'
    if (!password) errs.password = '请输入密码'
    else if (password.length < 8) errs.password = '密码至少 8 位'
    if (!confirmPassword) errs.confirmPassword = '请确认密码'
    else if (password !== confirmPassword) errs.confirmPassword = '两次密码不一致'
    return errs
  }, [email, password, confirmPassword])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit({ username: email, password, role: isAdmin ? 'admin' : 'user' })
  }, [validate, onSubmit, email, password, isAdmin])

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
      <DialogContent size="sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12"
            >
              <UserPlus className="h-4 w-4 text-text-accent" />
            </span>
            新建用户
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-space-lg py-space-base space-y-space-md">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                邮箱 <span className="text-text-error">*</span>
              </label>
              <Input
                type="email"
                inputSize="sm"
                placeholder="user@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })) }}
                error={errors.email}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                密码 <span className="text-text-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder="至少 8 位"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })) }}
                error={errors.password}
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                确认密码 <span className="text-text-error">*</span>
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })) }}
                error={errors.confirmPassword}
              />
            </div>

            {/* Admin Toggle */}
            <label
              className="flex cursor-pointer items-center gap-space-sm rounded-xl border border-border-subtle bg-background-subtle px-space-md py-space-sm hover:bg-background-default transition-colors"
              onClick={() => setIsAdmin(v => !v)}
            >
              <div
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors flex-shrink-0',
                  isAdmin ? 'bg-primary' : 'bg-background-default border border-border-default'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    isAdmin ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">设为管理员</p>
                <p className="text-xs text-text-tertiary">管理员拥有系统全部权限</p>
              </div>
            </label>
          </div>
        </form>

        <DialogFooter className="gap-space-sm">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit as any} disabled={isLoading}>
            {isLoading ? '创建中...' : '创建用户'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
