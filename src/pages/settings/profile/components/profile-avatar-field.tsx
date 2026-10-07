import { useTranslation } from 'react-i18next'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import type { ProfileData } from '@/pages/settings/profile/types'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'

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
  const { seed } = useCurrentUserAvatar()
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
        <EntityAvatar
          name={profile.userName || profile.email}
          src={profile.avatar}
          seed={seed}
          size="2xl"
          shape="circle"
        />
      )}
      {isEditing && (
        <p className="text-xs text-text-secondary">
          {t('settings.profile.avatarHint')}
        </p>
      )}
    </div>
  )
}
