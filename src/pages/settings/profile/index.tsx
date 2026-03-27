import React from 'react'
import { AppScene, PageLoadingState } from '@/components/patterns'
import { useProfile } from '@/hooks/use-profile'
import { BasicInfoSection } from './components/basic-info-section'
import { PasswordChangeDialog } from './components/password-change-dialog'
import { ProfileIdentityHero } from './components/profile-identity-hero'
import { SecuritySection } from './components/security-section'
import { ProfileMode } from './types'

export const ProfilePage: React.FC = () => {
  const {
    profile,
    draft,
    profileErrors,
    loading,
    savingProfile,
    changingPassword,
    mode,
    startEditing,
    startChangingPassword,
    cancelEditing,
    closePasswordDialog,
    updateDraft,
    saveProfile,
    changePassword,
  } = useProfile()

  if (loading) {
    return (
      <PageLoadingState
        scene={AppScene.CONSOLE}
        title="个人资料加载中"
        description="正在同步您的账户资料和安全信息。"
      />
    )
  }

  const isEditing = mode === ProfileMode.EDIT_PROFILE
  const isChangingPassword = mode === ProfileMode.CHANGE_PASSWORD

  return (
    <>
      <div className="flex min-h-full flex-col gap-space-lg bg-components-settings-content-bg p-space-lg">
        <ProfileIdentityHero
          profile={profile}
          draft={draft}
          isEditing={isEditing}
          saving={savingProfile}
          onEdit={startEditing}
          onAvatarChange={(avatar) => updateDraft({ avatar })}
        />

        <BasicInfoSection
          profile={profile}
          draft={draft}
          errors={profileErrors}
          isEditing={isEditing}
          saving={savingProfile}
          onDraftChange={updateDraft}
          onCancel={cancelEditing}
          onSave={saveProfile}
        />

        <SecuritySection
          disabled={isEditing}
          onChangePassword={startChangingPassword}
        />
      </div>

      <PasswordChangeDialog
        open={isChangingPassword}
        loading={changingPassword}
        onClose={closePasswordDialog}
        onSubmit={changePassword}
      />
    </>
  )
}

export default ProfilePage
