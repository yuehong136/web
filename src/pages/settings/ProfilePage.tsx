// src/pages/settings/ProfilePage.tsx
// 用户概要页面 - 参考 ragflow 实现

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, PenLine, User, Clock, Lock, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarUpload } from '@/components/ui/avatar-upload'
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
import { cn } from '@/lib/utils'
import { useProfile, EditType, modalTitle, TimezoneList, type IEditType } from '@/hooks/use-profile'

// 基础表单 Schema
const baseSchema = z.object({
  userName: z.string().min(1, { message: '用户名不能为空' }).trim(),
  timeZone: z.string().min(1, { message: '请选择时区' }).trim(),
})

// 用户名编辑 Schema
const nameSchema = baseSchema.extend({
  currPasswd: z.string().optional(),
  newPasswd: z.string().optional(),
  confirmPasswd: z.string().optional(),
})

// 密码编辑 Schema
const passwordSchema = baseSchema
  .extend({
    currPasswd: z.string({ required_error: '请输入当前密码' }).trim().min(1, { message: '请输入当前密码' }),
    newPasswd: z.string({ required_error: '请输入新密码' }).trim().min(8, { message: '新密码至少需要8个字符' }),
    confirmPasswd: z.string({ required_error: '请确认新密码' }).trim().min(8, { message: '确认密码至少需要8个字符' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPasswd && data.confirmPasswd && data.newPasswd !== data.confirmPasswd) {
      ctx.addIssue({
        path: ['confirmPasswd'],
        message: '两次输入的密码不一致',
        code: z.ZodIssueCode.custom,
      })
    }
  })

type FormData = z.infer<typeof baseSchema> & {
  currPasswd?: string
  newPasswd?: string
  confirmPasswd?: string
}

// 表单字段展示组件
interface FormFieldDisplayProps {
  label: string
  value: string
  onEdit?: () => void
  editable?: boolean
  description?: string
}

const FormFieldDisplay: React.FC<FormFieldDisplayProps> = ({
  label,
  value,
  onEdit,
  editable = true,
  description,
}) => (
  <div className="flex items-start gap-4">
    <label className="w-[190px] text-sm font-medium text-text-primary shrink-0">
      {label}
    </label>
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'text-sm text-text-primary flex-1 rounded-md py-1.5 px-3',
            editable && 'border border-border'
          )}
        >
          {value || '-'}
        </div>
        {editable && onEdit && (
          <Button
            variant="ghost"
            type="button"
            onClick={onEdit}
            className="text-sm text-text-secondary flex gap-1.5 px-2 border border-border hover:bg-card"
            size="sm"
          >
            <PenLine className="w-3 h-3" /> 编辑
          </Button>
        )}
      </div>
      {description && (
        <span className="text-text-tertiary text-xs">{description}</span>
      )}
    </div>
  </div>
)

export const ProfilePage: React.FC = () => {
  const {
    profile,
    loading,
    submitLoading,
    isEditing,
    editType,
    editForm,
    handleEditClick,
    handleCancel,
    handleSave,
    handleAvatarUpload,
  } = useProfile()

  // 密码显示状态
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false
  })

  // 表单
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

  // 同步编辑表单数据
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

  // 提交处理
  const onSubmit = (data: FormData) => {
    handleSave({
      userName: data.userName,
      timeZone: data.timeZone,
      currPasswd: data.currPasswd,
      newPasswd: data.newPasswd,
      confirmPasswd: data.confirmPasswd,
      avatar: profile.avatar,
      email: profile.email,
    })
  }

  // 关闭弹窗时重置密码显示状态
  const handleDialogClose = () => {
    handleCancel()
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {/* 卡片容器 */}
      <div className="m-4 border border-border rounded-lg bg-background">
        {/* 标题区域 */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-medium text-text-primary">概要</h2>
          <p className="text-sm text-text-secondary mt-1.5">
            在此更新您的照片和个人详细信息
          </p>
        </div>

        {/* 表单内容 */}
        <div className="p-6">
          <div className="max-w-3xl space-y-8">
            {/* 用户名 */}
            <FormFieldDisplay
              label="用户名"
              value={profile.userName}
              onEdit={() => handleEditClick(EditType.editName)}
            />

            {/* 头像 */}
            <div className="flex items-start gap-4">
              <label className="w-[190px] text-sm font-medium text-text-primary shrink-0">
                头像
              </label>
              <AvatarUpload
                value={profile.avatar}
                onChange={handleAvatarUpload}
                tips="支持 JPG、PNG 格式，最大 5MB"
                loading={submitLoading}
              />
            </div>

            {/* 时区 */}
            <FormFieldDisplay
              label="时区"
              value={profile.timeZone}
              onEdit={() => handleEditClick(EditType.editTimeZone)}
            />

            {/* 邮箱 */}
            <FormFieldDisplay
              label="邮箱"
              value={profile.email}
              editable={false}
              description="一旦注册，电子邮件将无法更改"
            />

            {/* 密码 */}
            <FormFieldDisplay
              label="密码"
              value={profile.currPasswd || '********'}
              onEdit={() => handleEditClick(EditType.editPassword)}
            />
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
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
                    <p className="text-xs text-red-500">{form.formState.errors.userName.message}</p>
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
                    <p className="text-xs text-red-500">{form.formState.errors.timeZone.message}</p>
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
                      <p className="text-xs text-red-500">{form.formState.errors.currPasswd.message}</p>
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
                      <p className="text-xs text-red-500">{form.formState.errors.newPasswd.message}</p>
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
                      <p className="text-xs text-red-500">{form.formState.errors.confirmPasswd.message}</p>
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
    </div>
  )
}

export default ProfilePage
