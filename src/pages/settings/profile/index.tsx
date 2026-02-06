import React from 'react'
import { Loader2 } from 'lucide-react'

import { AvatarUpload } from '@/components/ui/avatar-upload'
import { useProfile, EditType } from '@/hooks/use-profile'
import { FormFieldDisplay } from './components/form-field-display'
import { EditDialog } from './components/edit-dialog'

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
      <div className="m-4 border border-border-default rounded-lg bg-components-settings-section-bg">
        {/* 标题区域 */}
        <div className="p-6 border-b border-border-default">
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
              <label className="w-48 text-sm font-medium text-text-primary shrink-0">
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
      <EditDialog
        isEditing={isEditing}
        editType={editType}
        editForm={editForm}
        submitLoading={submitLoading}
        profile={{ avatar: profile.avatar, email: profile.email }}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default ProfilePage
