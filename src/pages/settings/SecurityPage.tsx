import React, { useState } from 'react'
import { Shield, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/api/auth'
import { toast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SettingsPageHeader, SettingsSection } from './components'

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const SecurityPage: React.FC = () => {
  const [formData, setFormData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<PasswordChangeData>>({})

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordChangeData> = {}

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = '请输入当前密码'
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = '请输入新密码'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认新密码'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const result = await authAPI.updateUserSettings({
        password: formData.currentPassword,
        new_password: formData.newPassword
      })

      if (result.retcode === 0) {
        toast.success('密码修改成功！')
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setErrors({})
      } else {
        let errorMessage = '密码修改失败，请稍后重试'

        if (result.retcode === 109 || result.retmsg === 'Password error!') {
          errorMessage = '当前密码错误，请重新输入'
          setFormData(prev => ({ ...prev, currentPassword: '' }))
          setErrors({ currentPassword: '当前密码错误' })
        } else if (result.retmsg === 'Update failure!') {
          errorMessage = '密码修改失败，请稍后重试'
        } else if (result.retmsg) {
          errorMessage = result.retmsg
        }

        toast.error(errorMessage)
      }
    } catch (error: unknown) {
      console.error('API调用异常:', error)
      toast.error('密码修改失败，请检查网络连接后重试')
    } finally {
      setSaving(false)
    }
  }

  // 处理取消按钮
  const handleCancel = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setErrors({})
  }

  // 处理输入变化
  const handleInputChange = (field: keyof PasswordChangeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="h-full flex flex-col">
      <SettingsPageHeader
        icon={<Shield className="h-6 w-6" />}
        title="安全设置"
        description="管理您的密码和账户安全选项。"
        actions={
          <>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              loading={saving}
              leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </>
        }
      />

      {/* 表单内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <SettingsSection
                title="密码修改"
                description="为了保护您的账户安全，请定期更改密码。新密码至少需要8个字符。"
              >
                <div className="space-y-4">
                  {/* 当前密码 */}
                  <div>
                    <Input
                      label="当前密码"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="请输入当前密码"
                      error={errors.currentPassword}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="text-text-muted hover:text-text-secondary"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>

                  {/* 新密码 */}
                  <div>
                    <Input
                      label="新密码"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="请输入新密码"
                      error={errors.newPassword}
                      helpText=""
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-text-muted hover:text-text-secondary"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>

                  {/* 确认新密码 */}
                  <div>
                    <Input
                      label="确认新密码"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="请再次输入新密码"
                      error={errors.confirmPassword}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-text-muted hover:text-text-secondary"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>
                </div>
              </SettingsSection>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
