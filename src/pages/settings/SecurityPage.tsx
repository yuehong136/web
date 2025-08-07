import React, { useState } from 'react'
import { Shield, Save, Loader2, Eye, EyeOff, Lock } from 'lucide-react'
import { authAPI } from '@/api/auth'
import { toast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
      // 调用后端API更新密码
      const result = await authAPI.updateUserSettings({
        password: formData.currentPassword,
        new_password: formData.newPassword
      })

      // 详细调试信息
      console.log('=== API Response Debug ===')
      console.log('Full response:', result)
      console.log('retcode value:', result.retcode)
      console.log('retcode type:', typeof result.retcode)
      console.log('retcode === 0:', result.retcode === 0)
      console.log('retcode == 0:', result.retcode == 0)
      console.log('=========================')
      
      // 判断是否成功：retcode为0表示成功
      if (result.retcode === 0) {
        toast.success('密码修改成功！')
        // 清空表单
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setErrors({})
      } else {
        // 处理各种错误情况
        let errorMessage = '密码修改失败，请稍后重试'
        
        if (result.retcode === 109 || result.retmsg === 'Password error!') {
          // 密码错误
          errorMessage = '当前密码错误，请重新输入'
          setFormData(prev => ({ ...prev, currentPassword: '' }))
          setErrors({ currentPassword: '当前密码错误' })
        } else if (result.retmsg === 'Update failure!') {
          // 更新失败
          errorMessage = '密码修改失败，请稍后重试'
        } else if (result.retmsg) {
          // 使用后端返回的错误信息
          errorMessage = result.retmsg
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('API调用异常详情:', error)
      console.error('Error type:', typeof error)
      console.error('Error message:', error.message)
      if (error.response) {
        console.error('Error response:', error.response)
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
      }
      toast.error('密码修改失败，请检查网络连接后重试')
    } finally {
      setSaving(false)
    }
  }

  // 处理取消按钮
  const handleCancel = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setErrors({})
  }

  // 处理输入变化
  const handleInputChange = (field: keyof PasswordChangeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误信息
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题和操作按钮 */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-6 w-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">安全设置</h2>
            </div>
            <p className="text-gray-600">管理您的密码和账户安全选项。</p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex space-x-3 ml-6">
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
          </div>
        </div>
      </div>
      
      {/* 表单内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 密码修改区域 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  密码修改
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  为了保护您的账户安全，请定期更改密码。新密码至少需要8个字符。
                </p>

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
                          className="text-gray-400 hover:text-gray-600"
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
                          className="text-gray-400 hover:text-gray-600"
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
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}