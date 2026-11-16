import { useTranslation } from 'react-i18next'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { SETTINGS_CARD } from '@/pages/settings/components/settings-card'
import { Button } from '@/components/ui/button'

export const SecuritySection = ({
  disabled = false,
  onChangePassword,
}: {
  disabled?: boolean
  onChangePassword: () => void
}) => {
  const { t } = useTranslation()
  return (
    <SettingSection
      title={t('settings.profile.security')}
      className={SETTINGS_CARD}
    >
      <SettingRow
        label={t('settings.profile.password')}
        description={t('settings.profile.passwordHint')}
      >
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onChangePassword}
          disabled={disabled}
        >
          {t('settings.profile.changePassword')}
        </Button>
      </SettingRow>
    </SettingSection>
  )
}
