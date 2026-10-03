import React from 'react'
import { useTranslation } from 'react-i18next'
import { PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AppScene,
  PageHeader,
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns'
import { useProfile } from '@/hooks/use-profile'
import { BasicInfoSection } from './components/basic-info-section'
import { PasswordChangeDialog } from './components/password-change-dialog'
import { SecuritySection } from './components/security-section'
import { ProfileMode } from './types'

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const editTrigger = React.useRef<HTMLButtonElement>(null)
  const [passwordReturnFocus, setPasswordReturnFocus] =
    React.useState<HTMLElement | null>(null)
  const {
    profile,
    draft,
    profileErrors,
    loading,
    isError,
    refetch,
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
        title={t('settings.profile.loading')}
        description={t('settings.profile.loadingDescription')}
      />
    )
  }

  if (isError)
    return (
      <PageErrorState
        scene={AppScene.CONSOLE}
        title={t('settings.profile.loadFailed')}
        description={t('settings.profile.loadFailedDescription')}
        retryLabel={t('common.retry')}
        onRetry={() => void refetch()}
      />
    )

  const isEditing = mode === ProfileMode.EDIT_PROFILE
  const isChangingPassword = mode === ProfileMode.CHANGE_PASSWORD

  return (
    <>
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-space-lg p-space-lg">
        <PageHeader
          title={t('settings.nav.profile')}
          description={t('settings.profileDescription')}
          titleSize="md"
          surface="plain"
          wrapActions
          actions={
            !isEditing && (
              <Button
                ref={editTrigger}
                variant="outline"
                onClick={startEditing}
                leftIcon={<PencilLine className="size-icon-sm" />}
              >
                {t('settings.profile.edit')}
              </Button>
            )
          }
        />

        <BasicInfoSection
          profile={profile}
          draft={draft}
          errors={profileErrors}
          isEditing={isEditing}
          saving={savingProfile}
          onDraftChange={updateDraft}
          onCancel={() => {
            cancelEditing()
            requestAnimationFrame(() => editTrigger.current?.focus())
          }}
          onSave={async () => {
            if (await saveProfile())
              requestAnimationFrame(() => editTrigger.current?.focus())
          }}
        />

        <SecuritySection
          disabled={isEditing}
          onChangePassword={() => {
            setPasswordReturnFocus(
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null,
            )
            startChangingPassword()
          }}
        />
      </div>

      <PasswordChangeDialog
        open={isChangingPassword}
        loading={changingPassword}
        onClose={closePasswordDialog}
        onSubmit={changePassword}
        returnFocus={passwordReturnFocus}
      />
    </>
  )
}

export default ProfilePage
