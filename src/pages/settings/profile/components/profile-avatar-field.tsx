import { useTranslation } from 'react-i18next'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ProfileData } from '@/pages/settings/profile/types'

export const ProfileAvatarField = ({
  profile,
  isEditing,
  saving,
  onChange,
}: {
  profile: ProfileData
  isEditing: boolean
  saving: boolean
  onChange: (avatar: string) => void
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-space-base">
      {isEditing ? (
        <AvatarUpload
          value={profile.avatar}
          onChange={onChange}
          size={64}
          loading={saving}
          tips=""
        />
      ) : (
        <Avatar className="h-16 w-16 shrink-0 rounded-radius-lg">
          <AvatarImage src={profile.avatar || undefined} alt="" />
          <AvatarFallback className="rounded-radius-lg bg-background-subtle text-lg font-medium text-text-primary">
            {(profile.userName || profile.email)
              .trim()
              .charAt(0)
              .toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      {isEditing && (
        <p className="text-xs text-text-secondary">
          {t('settings.profile.avatarHint')}
        </p>
      )}
    </div>
  )
}
