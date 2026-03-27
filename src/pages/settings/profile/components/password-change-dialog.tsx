import React, { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { passwordChangeSchema, type PasswordChangeFormData } from '../types'

interface PasswordChangeDialogProps {
  open: boolean
  loading: boolean
  onClose: () => void
  onSubmit: (data: PasswordChangeFormData) => Promise<boolean>
}

export const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
}) => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  })

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currPasswd: '',
      newPasswd: '',
      confirmPasswd: '',
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
      setShowPasswords({ current: false, next: false, confirm: false })
    }
  }, [form, open])

  const handleSubmit = form.handleSubmit(async (data) => {
    const success = await onSubmit(data)

    if (success) {
      form.reset()
      onClose()
    }
  })

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-center gap-space-base">
            <div className="flex h-10 w-10 items-center justify-center rounded-radius-xl bg-surface-accent text-text-on-accent">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-space-xs">
              <DialogTitle>修改密码</DialogTitle>
              <DialogDescription>
                为了保护您的账户安全，请先验证当前密码，再设置新的登录密码。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-lg px-space-lg pb-space-lg">
          <Input
            label="当前密码"
            type={showPasswords.current ? 'text' : 'password'}
            autoComplete="current-password"
            {...form.register('currPasswd')}
            error={form.formState.errors.currPasswd?.message}
            rightIcon={(
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                className="text-text-tertiary transition-colors hover:text-text-secondary"
                aria-label={showPasswords.current ? '隐藏当前密码' : '显示当前密码'}
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          />

          <Input
            label="新密码"
            type={showPasswords.next ? 'text' : 'password'}
            autoComplete="new-password"
            {...form.register('newPasswd')}
            error={form.formState.errors.newPasswd?.message}
            helpText="新密码至少需要 8 个字符。"
            rightIcon={(
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                className="text-text-tertiary transition-colors hover:text-text-secondary"
                aria-label={showPasswords.next ? '隐藏新密码' : '显示新密码'}
              >
                {showPasswords.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          />

          <Input
            label="确认新密码"
            type={showPasswords.confirm ? 'text' : 'password'}
            autoComplete="new-password"
            {...form.register('confirmPasswd')}
            error={form.formState.errors.confirmPasswd?.message}
            rightIcon={(
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                className="text-text-tertiary transition-colors hover:text-text-secondary"
                aria-label={showPasswords.confirm ? '隐藏确认密码' : '显示确认密码'}
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          />

          <DialogFooter className="px-0 pb-0">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              取消
            </Button>
            <Button type="submit" loading={loading}>
              保存密码
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
