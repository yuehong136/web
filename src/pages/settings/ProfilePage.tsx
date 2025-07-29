import React, { useState, useEffect } from 'react'
import { User, Camera, Save, Loader2, Mail, Globe, Clock, Palette } from 'lucide-react'
import { authAPI } from '@/api/auth'
import type { UserProfile, UpdateUserProfileRequest } from '@/types/api'
import { toast } from '@/lib/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { CustomSelect } from '@/components/ui/custom-select'

// 主题选项
const themeOptions = [
  { value: 'light', label: '明亮', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'auto', label: '跟随系统', icon: '🔄' }
]

// 语言选项
const languageOptions = [
  { value: 'zh-CN', label: '简体中文', icon: '🇨🇳' },
  { value: 'zh-TW', label: '繁體中文', icon: '🇹🇼' },
  { value: 'en-US', label: 'English', icon: '🇺🇸' },
  { value: 'ja-JP', label: '日本語', icon: '🇯🇵' },
  { value: 'ko-KR', label: '한국어', icon: '🇰🇷' }
]

// 时区选项
const timezoneOptions = [
  { value: 'UTC+8\tAsia/Shanghai', label: 'UTC+8 亚洲/上海', icon: '🇨🇳' },
  { value: 'UTC+8\tAsia/Hong_Kong', label: 'UTC+8 亚洲/香港', icon: '🇭🇰' },
  { value: 'UTC+8\tAsia/Taipei', label: 'UTC+8 亚洲/台北', icon: '🇹🇼' },
  { value: 'UTC+9\tAsia/Tokyo', label: 'UTC+9 亚洲/东京', icon: '🇯🇵' },
  { value: 'UTC+9\tAsia/Seoul', label: 'UTC+9 亚洲/首尔', icon: '🇰🇷' },
  { value: 'UTC-8\tAmerica/Los_Angeles', label: 'UTC-8 美洲/洛杉矶', icon: '🇺🇸' },
  { value: 'UTC-5\tAmerica/New_York', label: 'UTC-5 美洲/纽约', icon: '🇺🇸' },
  { value: 'UTC+0\tEurope/London', label: 'UTC+0 欧洲/伦敦', icon: '🇬🇧' },
  { value: 'UTC+1\tEurope/Berlin', label: 'UTC+1 欧洲/柏林', icon: '🇩🇪' }
]

export const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nickname: '',
    avatar: '',
    language: 'zh-CN',
    timezone: 'UTC+8\tAsia/Shanghai',
    theme: 'light'
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // 加载用户档案
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true)
        const profile = await authAPI.getUserProfile()
        setUserProfile(profile)
        setFormData({
          nickname: profile.nickname || '',
          avatar: profile.avatar || '',
          language: profile.language || 'zh-CN',
          timezone: profile.timezone || 'UTC+8\tAsia/Shanghai',
          theme: 'light' // 主题可能需要从其他地方获取
        })
        setAvatarPreview(profile.avatar || null)
      } catch (err) {
        setError('加载用户档案失败')
        console.error('Failed to load user profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  // 处理头像文件选择
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB限制
        const errorMessage = '头像文件大小不能超过5MB'
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }
      
      setAvatarFile(file)
      
      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理取消按钮
  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        nickname: userProfile.nickname || '',
        avatar: userProfile.avatar || '',
        language: userProfile.language || 'zh-CN',
        timezone: userProfile.timezone || 'UTC+8\tAsia/Shanghai',
        theme: 'light'
      })
      setAvatarPreview(userProfile.avatar || null)
      setAvatarFile(null)
      setError(null)
    }
  }

  // 处理表单提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    // 基本验证
    if (!formData.nickname.trim()) {
      const errorMessage = '用户名不能为空'
      setError(errorMessage)
      toast.error(errorMessage)
      setSaving(false)
      return
    }

    try {
      // 这里可以添加头像上传逻辑
      let avatarUrl = formData.avatar
      if (avatarFile) {
        // TODO: 实现头像上传到服务器的逻辑
        // avatarUrl = await uploadAvatar(avatarFile)
      }

      const updateData: UpdateUserProfileRequest = {
        nickname: formData.nickname,
        avatar: avatarUrl,
        language: formData.language,
        timezone: formData.timezone
      }

      const updatedProfile = await authAPI.updateUserProfile(updateData)
      setUserProfile(updatedProfile)
      
      // 显示成功消息
      toast.success('档案更新成功！')
      
    } catch (err) {
      const errorMessage = '更新档案失败，请稍后重试'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to update profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题和操作按钮 */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <User className="h-6 w-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">个人资料</h2>
            </div>
            <p className="text-gray-600">在此更新您的照片和个人详细信息。</p>
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
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 用户名 */}
              <div>
                <Input
                  label="用户名"
                  required
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="请输入用户名"
                />
              </div>

              {/* 头像 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  头像 <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-4">这将显示在您的个人资料上。</p>
                
                <div className="flex items-center space-x-6">
                  <Avatar 
                    src={avatarPreview} 
                    fallback={<User className="h-8 w-8" />}
                    size="xl"
                    className="h-20 w-20"
                  />
                  
                  <div className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer text-center">
                      <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">上传</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 主题 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Palette className="h-4 w-4 inline mr-2" />
                  主题 <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={themeOptions}
                  value={formData.theme}
                  onChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
                  placeholder="选择主题"
                />
              </div>

              {/* 语言 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Globe className="h-4 w-4 inline mr-2" />
                  语言 <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={languageOptions}
                  value={formData.language}
                  onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  placeholder="选择语言"
                />
              </div>

              {/* 时区 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Clock className="h-4 w-4 inline mr-2" />
                  时区 <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={timezoneOptions}
                  value={formData.timezone}
                  onChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  placeholder="选择时区"
                />
              </div>

              {/* 邮箱地址 - 只读 */}
              <div>
                <Input
                  label="邮箱地址"
                  value={userProfile?.email || ''}
                  disabled
                  leftIcon={<Mail className="h-4 w-4" />}
                  helpText="一旦注册，电子邮件将无法更改。"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}