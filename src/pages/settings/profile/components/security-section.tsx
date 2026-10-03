import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ProfileFieldRow } from '@/pages/settings/profile/components/profile-field-row'

export const SecuritySection = ({
  disabled = false,
  onChangePassword,
}: {
  disabled?: boolean
  onChangePassword: () => void
}) => {
  const { t } = useTranslation()
  return (
    <SectionCard
      title={t('settings.profile.security')}
      headingLevel={2}
      padding="none"
    >
      <dl className="px-space-lg">
        <ProfileFieldRow
          label={t('settings.profile.password')}
          value={
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <p className="max-w-sm text-sm text-text-secondary">
                {t('settings.profile.passwordHint')}
              </p>
              <Button
                variant="outline"
                type="button"
                onClick={onChangePassword}
                disabled={disabled}
              >
                {t('settings.profile.changePassword')}
              </Button>
            </div>
          }
        />
      </dl>
    </SectionCard>
  )
}
