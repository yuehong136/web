import type { UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShareSettingSwitch } from './share-setting-switch'
import {
  widgetColorParams,
  widgetTextParams,
  type WidgetSettings,
} from './widget-settings'

export function WidgetCustomization({
  settings,
  onChange,
}: {
  settings: WidgetSettings
  onChange: UseFormSetValue<WidgetSettings>
}) {
  const { t } = useTranslation()
  return (
    <section className="space-y-space-base border-t border-border-subtle pt-space-lg">
      <h3 className="text-sm font-medium text-text-secondary">
        {t('agent.shareEmbed.customization')}
      </h3>
      <ShareSettingSwitch
        id="agent-widget-muted"
        label={t('agent.shareEmbed.muteWidget')}
        description={t('agent.shareEmbed.muteWidgetDescription')}
        checked={settings.muteWidget}
        onCheckedChange={(value) => onChange('muteWidget', value)}
      />
      {Object.keys(widgetTextParams).map((key) => {
        const name = key as keyof typeof widgetTextParams
        return (
          <div key={name} className="space-y-space-xs">
            <Label htmlFor={name}>{t(`agent.shareEmbed.${name}`)}</Label>
            <Input
              id={name}
              value={settings[name]}
              onChange={(event) => onChange(name, event.target.value)}
            />
          </div>
        )
      })}
      <div className="grid gap-space-sm sm:grid-cols-2">
        {Object.keys(widgetColorParams).map((key) => {
          const name = key as keyof typeof widgetColorParams
          return (
            <div key={name} className="space-y-space-xs">
              <Label htmlFor={name}>{t(`agent.shareEmbed.${name}`)}</Label>
              <Input
                id={name}
                value={settings[name]}
                onChange={(event) => onChange(name, event.target.value)}
                placeholder="#2563eb"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
