import React, { useEffect, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User, Clock, Lock, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditType, modalTitle, TimezoneList, type IEditType } from '@/hooks/use-profile'
import { nameSchema, passwordSchema, type FormData } from '../types'

interface EditDialogProps {
  isEditing: boolean
  editType: IEditType | null
  editForm: { userName?: string; timeZone?: string } | null
  submitLoading: boolean
  profile: { avatar: string; email: string }
  onSave: (data: any) => void
  onCancel: () => void
}

export const EditDialog: React.FC<EditDialogProps> = memo(({
  isEditing,
  editType,
  editForm,
  submitLoading,
  profile,
  onSave,
  onCancel,
}) => {
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false
  })

  const form = useForm<FormData>({
    resolver: zodResolver(
      editType === EditType.editPassword ? passwordSchema : nameSchema
    ),
    defaultValues: {
      userName: '',
      timeZone: '',
      currPasswd: '',
      newPasswd: '',
      confirmPasswd: '',
    },
  })

  useEffect(() => {
    if (editForm && isEditing) {
      form.reset({
        userName: editForm.userName || '',
        timeZone: editForm.timeZone || '',
        currPasswd: '',
        newPasswd: '',
        confirmPasswd: '',
      })
    }
  }, [editForm, isEditing, form])

  const onSubmit = (data: FormData) => {
    onSave({
      userName: data.userName,
      timeZone: data.timeZone,
      currPasswd: data.currPasswd,
      newPasswd: data.newPasswd,
      confirmPasswd: data.confirmPasswd,
      avatar: profile.avatar,
      email: profile.email,
    })
  }

  const handleDialogClose = () => {
    onCancel()
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  return (
    <Dialog open={isEditing} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-accent)] flex items-center justify-center">
              {editType === EditType.editName && <User className="h-5 w-5 text-[var(--color-text-on-accent)]" />}
              {editType === EditType.editTimeZone && <Clock className="h-5 w-5 text-[var(--color-text-on-accent)]" />}
              {editType === EditType.editPassword && <Lock className="h-5 w-5 text-[var(--color-text-on-accent)]" />}
            </div>
            <div>
              <DialogTitle>{editType ? modalTitle[editType] : ''}</DialogTitle>
              <DialogDescription>
                {editType === EditType.editName && '更新您的显示名称'}
                {editType === EditType.editTimeZone && '选择您所在的时区'}
                {editType === EditType.editPassword && '设置新的登录密码'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="px-6 py-4 space-y-4">
            {/* 用户名编辑 */}
            {editType === EditType.editName && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                  用户名
                </label>
                <Input
                  {...form.register('userName')}
                  placeholder="请输入用户名"
                  className="bg-[var(--color-surface-secondary)]"
                />
                {form.formState.errors.userName && (
                  <p className="text-xs text-text-error">{form.formState.errors.userName.message}</p>
                )}
              </div>
            )}

            {/* 时区编辑 */}
            {editType === EditType.editTimeZone && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                  时区
                </label>
                <Select
                  value={form.watch('timeZone')}
                  onValueChange={(value) => form.setValue('timeZone', value)}
                >
                  <SelectTrigger className="w-full bg-[var(--color-surface-secondary)]">
                    <SelectValue placeholder="选择时区" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TimezoneList.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.timeZone && (
                  <p className="text-xs text-text-error">{form.formState.errors.timeZone.message}</p>
                )}
              </div>
            )}

            {/* 密码编辑 */}
            {editType === EditType.editPassword && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    当前密码 <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      {...form.register('currPasswd')}
                      placeholder="请输入当前密码"
                      className="pr-10 bg-[var(--color-surface-secondary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.currPasswd && (
                    <p className="text-xs text-text-error">{form.formState.errors.currPasswd.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    新密码 <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      {...form.register('newPasswd')}
                      placeholder="请输入新密码（至少8个字符）"
                      className="pr-10 bg-[var(--color-surface-secondary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.newPasswd && (
                    <p className="text-xs text-text-error">{form.formState.errors.newPasswd.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    确认新密码 <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      {...form.register('confirmPasswd')}
                      placeholder="请再次输入新密码"
                      className="pr-10 bg-[var(--color-surface-secondary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPasswd && (
                    <p className="text-xs text-text-error">{form.formState.errors.confirmPasswd.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleDialogClose} disabled={submitLoading}>
              取消
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

EditDialog.displayName = 'EditDialog'
