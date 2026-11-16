import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatProfileTimezone, TimezoneList } from '@/hooks/use-profile'
import { ProfileAvatarField } from '@/pages/settings/profile/components/profile-avatar-field'
import type {
  ProfileData,
  ProfileFormErrors,
} from '@/pages/settings/profile/types'

interface BasicInfoSectionProps {
  profile: ProfileData
  draft: ProfileData
  errors: ProfileFormErrors
  isEditing: boolean
  saving: boolean
  actions?: ReactNode
  onDraftChange: (patch: Partial<ProfileData>) => void
  onCancel: () => void
  onSave: () => void
}

/** Account details as setting rows; Edit turns the values into fields. */
export const BasicInfoSection = ({
  profile,
  draft,
  errors,
  isEditing,
  saving,
  actions,
  onDraftChange,
  onCancel,
  onSave,
}: BasicInfoSectionProps) => {
  const { t } = useTranslation()
  return (
    <SettingSection title={t('settings.profile.accountInfo')} actions={actions}>
      <SettingRow
        label={t('settings.profile.avatar')}
        description={isEditing ? t('settings.profile.avatarHint') : undefined}
      >
        <ProfileAvatarField
          profile={isEditing ? draft : profile}
          isEditing={isEditing}
          saving={saving}
          onChange={(avatar) => onDraftChange({ avatar })}
        />
      </SettingRow>
      <SettingRow label={t('settings.profile.displayName')}>
        {isEditing ? (
          <div className="w-full sm:w-64">
            <Input
              aria-label={t('settings.profile.displayName')}
              value={draft.userName}
              onChange={(event) =>
                onDraftChange({ userName: event.target.value })
              }
              error={errors.userName ? t(errors.userName) : undefined}
              placeholder={t('settings.profile.namePlaceholder')}
              disabled={saving}
              inputSize="sm"
            />
          </div>
        ) : (
          <span
            className="block max-w-64 min-w-0 truncate text-sm text-text-primary"
            title={profile.userName}
          >
            {profile.userName || '—'}
          </span>
        )}
      </SettingRow>
      <SettingRow
        label={t('settings.profile.email')}
        description={t('settings.profile.emailHint')}
      >
        <span className="text-sm break-all text-text-primary">
          {profile.email}
        </span>
      </SettingRow>
      <SettingRow label={t('settings.profile.timeZone')}>
        {isEditing ? (
          <div className="w-full sm:w-64">
            <Select
              value={draft.timeZone}
              onValueChange={(timeZone) => onDraftChange({ timeZone })}
              disabled={saving}
            >
              <SelectTrigger aria-label={t('settings.profile.timeZone')}>
                <SelectValue
                  placeholder={t('settings.profile.timeZonePlaceholder')}
                />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {!TimezoneList.includes(draft.timeZone) && draft.timeZone && (
                  <SelectItem value={draft.timeZone}>
                    {formatProfileTimezone(draft.timeZone)}
                  </SelectItem>
                )}
                {TimezoneList.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timeZone && (
              <p className="mt-space-xs text-sm text-status-error">
                {t(errors.timeZone)}
              </p>
            )}
          </div>
        ) : (
          <span className="text-sm text-text-primary">
            {formatProfileTimezone(profile.timeZone) || '—'}
          </span>
        )}
      </SettingRow>
      {isEditing && (
        <div className="flex flex-wrap justify-end gap-space-sm border-t border-border-subtle pt-space-sm">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={onSave} loading={saving}>
            {t('settings.profile.saveChanges')}
          </Button>
        </div>
      )}
    </SettingSection>
  )
}
