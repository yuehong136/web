import React, { useState, useEffect } from 'react'
import { PenLine, Loader2, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/api/auth'
import type { UserProfile, UpdateUserProfileRequest } from '@/types/api'
import { toast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// 时区选项
const TimezoneList = [
  'UTC+8\tAsia/Shanghai',
  'UTC+8\tAsia/Hong_Kong',
  'UTC+8\tAsia/Taipei',
  'UTC+9\tAsia/Tokyo',
  'UTC+9\tAsia/Seoul',
  'UTC-8\tAmerica/Los_Angeles',
  'UTC-5\tAmerica/New_York',
  'UTC+0\tEurope/London',
  'UTC+1\tEurope/Berlin',
]

// 编辑类型
enum EditType {
  editName = 'editName',
  editTimeZone = 'editTimeZone',
  editPassword = 'editPassword',
}

const modalTitles: Record<EditType, string> = {
  [EditType.editName]: '修改用户名',
  [EditType.editTimeZone]: '修改时区',
  [EditType.editPassword]: '修改密码',
}

// 表单字段组件
interface FormFieldProps {
  label: string
  value: string
  onEdit?: () => void
  editable?: boolean
  description?: string
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  value, 
  onEdit, 
  editable = true,
  description 
}) => (
  <div className="flex items-start gap-4">
    <label className="w-[190px] text-sm font-medium text-text-primary shrink-0">
      {label}
    </label>
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className={cn(
          "text-sm text-text-primary flex-1 rounded-md py-1.5 px-3",
          editable && "border border-border"
        )}>
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

// 头像上传组件
interface AvatarUploadProps {
  value?: string
  onChange: (file: File) => void
  tips?: string
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange, tips }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('头像文件大小不能超过5MB')
        return
      }
      onChange(file)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xl font-semibold">U</span>
          )}
        </div>
        <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center cursor-pointer hover:bg-card/80 transition-colors">
          <PenLine className="w-3 h-3 text-text-secondary" />
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>
      {tips && <span className="text-xs text-text-tertiary">{tips}</span>}
    </div>
  )
}

export const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editType, setEditType] = useState<EditType | null>(null)
  
  // 用户资料
  const [profile, setProfile] = useState({
    userName: '',
    email: '',
    avatar: '',
    timeZone: 'UTC+8\tAsia/Shanghai',
    currPasswd: '********'
  })

  // 编辑表单数据
  const [editForm, setEditForm] = useState({
    userName: '',
    timeZone: '',
    currPasswd: '',
    newPasswd: '',
    confirmPasswd: ''
  })

  // 密码显示状态
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // 加载用户档案
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const data = await authAPI.getUserProfile()
        setProfile({
          userName: data.nickname || data.username || '',
          email: data.email || '',
          avatar: data.avatar || '',
          timeZone: data.timezone || 'UTC+8\tAsia/Shanghai',
          currPasswd: '********'
        })
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  // 打开编辑弹窗
  const handleEditClick = (type: EditType) => {
    setEditType(type)
    setEditForm({
      userName: profile.userName,
      timeZone: profile.timeZone,
      currPasswd: '',
      newPasswd: '',
      confirmPasswd: ''
    })
  }

  // 关闭弹窗
  const handleCancel = () => {
    setEditType(null)
    setShowPasswords({ current: false, new: false, confirm: false })
  }

  // 保存修改
  const handleSave = async () => {
    if (!editType) return

    // 验证
    if (editType === EditType.editName && !editForm.userName.trim()) {
      toast.error('用户名不能为空')
      return
    }

    if (editType === EditType.editPassword) {
      if (!editForm.currPasswd) {
        toast.error('请输入当前密码')
        return
      }
      if (!editForm.newPasswd || editForm.newPasswd.length < 8) {
        toast.error('新密码至少需要8个字符')
        return
      }
      if (editForm.newPasswd !== editForm.confirmPasswd) {
        toast.error('两次输入的密码不一致')
        return
      }
    }

    try {
      setSaving(true)
      
      const updateData: UpdateUserProfileRequest = {
        nickname: editType === EditType.editName ? editForm.userName : profile.userName,
        timezone: editType === EditType.editTimeZone ? editForm.timeZone : profile.timeZone,
      }

      // TODO: 如果是修改密码，需要调用不同的 API
      if (editType === EditType.editPassword) {
        // await authAPI.changePassword(editForm.currPasswd, editForm.newPasswd)
        toast.success('密码修改成功')
      } else {
        await authAPI.updateUserProfile(updateData)
        setProfile(prev => ({
          ...prev,
          userName: updateData.nickname || prev.userName,
          timeZone: updateData.timezone || prev.timeZone
        }))
        toast.success('保存成功')
      }
      
      handleCancel()
    } catch (err) {
      toast.error('保存失败，请稍后重试')
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  // 头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      // TODO: 实现头像上传
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
      toast.success('头像更新成功')
    } catch (err) {
      toast.error('头像上传失败')
    }
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
            <FormField
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
              />
            </div>

            {/* 时区 */}
            <FormField
              label="时区"
              value={profile.timeZone}
              onEdit={() => handleEditClick(EditType.editTimeZone)}
            />

            {/* 邮箱 */}
            <FormField
              label="邮箱"
              value={profile.email}
              editable={false}
              description="一旦注册，电子邮件将无法更改"
            />

            {/* 密码 */}
            <FormField
              label="密码"
              value={profile.currPasswd}
              onEdit={() => handleEditClick(EditType.editPassword)}
            />
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      <Dialog open={!!editType} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent 
          className="sm:max-w-[480px]"
          title={editType ? modalTitles[editType] : ''}
        >
          <div className="space-y-6">
            {/* 用户名编辑 */}
            {editType === EditType.editName && (
              <div className="space-y-2">
                <label className="text-sm text-text-secondary">用户名</label>
                <Input
                  value={editForm.userName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="请输入用户名"
                />
              </div>
            )}

            {/* 时区编辑 */}
            {editType === EditType.editTimeZone && (
              <div className="space-y-2">
                <label className="text-sm text-text-secondary">时区</label>
                <select
                  value={editForm.timeZone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, timeZone: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {TimezoneList.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 密码编辑 */}
            {editType === EditType.editPassword && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">
                    当前密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={editForm.currPasswd}
                      onChange={(e) => setEditForm(prev => ({ ...prev, currPasswd: e.target.value }))}
                      placeholder="请输入当前密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">
                    新密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={editForm.newPasswd}
                      onChange={(e) => setEditForm(prev => ({ ...prev, newPasswd: e.target.value }))}
                      placeholder="请输入新密码（至少8个字符）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">
                    确认新密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={editForm.confirmPasswd}
                      onChange={(e) => setEditForm(prev => ({ ...prev, confirmPasswd: e.target.value }))}
                      placeholder="请再次输入新密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 按钮区域 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
