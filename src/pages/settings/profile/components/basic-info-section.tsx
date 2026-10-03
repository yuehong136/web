import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimezoneList } from '@/hooks/use-profile'
import { ProfileAvatarField } from '@/pages/settings/profile/components/profile-avatar-field'
import { ProfileFieldRow } from '@/pages/settings/profile/components/profile-field-row'
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
  onDraftChange: (patch: Partial<ProfileData>) => void
  onCancel: () => void
  onSave: () => void
}

export const BasicInfoSection = ({
  profile,
  draft,
  errors,
  isEditing,
  saving,
  onDraftChange,
  onCancel,
  onSave,
}: BasicInfoSectionProps) => {
  const { t } = useTranslation()
  return (
    <SectionCard
      title={t('settings.profile.accountInfo')}
      headingLevel={2}
      padding="none"
    >
      <div className="px-space-lg">
        <dl className="divide-y divide-border-subtle">
          <ProfileFieldRow
            label={t('settings.profile.avatar')}
            value={
              <ProfileAvatarField
                profile={isEditing ? draft : profile}
                isEditing={isEditing}
                saving={saving}
                onChange={(avatar) => onDraftChange({ avatar })}
              />
            }
          />
          <ProfileFieldRow
            label={t('settings.profile.displayName')}
            value={
              isEditing ? (
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
              ) : (
                profile.userName
              )
            }
          />
          <ProfileFieldRow
            label={t('settings.profile.email')}
            value={<span className="break-all">{profile.email}</span>}
            hint={t('settings.profile.emailHint')}
          />
          <ProfileFieldRow
            label={t('settings.profile.timeZone')}
            value={
              isEditing ? (
                <div>
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
                profile.timeZone
              )
            }
          />
        </dl>
        {isEditing && (
          <div className="flex flex-wrap justify-end gap-space-sm border-t border-border-subtle py-space-base">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={onSave} loading={saving}>
              {t('settings.profile.saveChanges')}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
