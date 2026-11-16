import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { SETTINGS_CARD } from '@/pages/settings/components/settings-card'
import { cn } from '@/lib/utils'
import { PreferenceChoiceGroup } from '@/components/patterns/preference-choice-group'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { supportedLocales } from '@/locales/i18n'
import { useUIStore } from '@/stores/ui'
import {
  APPEARANCE_PRESETS,
  DEFAULT_APPEARANCE,
  ScopedTheme,
  setAppearance,
  useAppearance,
  useResolvedAppearance,
  type AppearancePreset,
} from '@/themes'
import { AppearancePreview } from './appearance-preview'

function PresetSwatch({ preset }: { preset: AppearancePreset }) {
  const { resolvedMode } = useResolvedAppearance()
  return (
    <ScopedTheme preset={preset} theme={resolvedMode} className="block">
      <span className="flex h-24 overflow-hidden border-b border-border-subtle bg-background-body p-space-sm">
        <span className="flex w-1/4 flex-col gap-space-xs border-r border-border-subtle bg-components-sidebar-bg p-space-sm">
          <span className="h-2 w-3/4 rounded-radius-sm bg-text-accent" />
          <span className="h-1 w-full rounded-radius-sm bg-border-default" />
          <span className="h-1 w-3/4 rounded-radius-sm bg-border-default" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-space-sm bg-background-surface p-space-sm">
          <span className="ml-auto h-3 w-3/4 rounded-radius-sm bg-state-selected-bg" />
          <span className="h-1 w-full rounded-radius-sm bg-border-strong" />
          <span className="h-1 w-4/5 rounded-radius-sm bg-border-default" />
          <span className="mt-auto h-4 w-full rounded-radius-sm border border-border-default bg-background-subtle" />
        </span>
      </span>
    </ScopedTheme>
  )
}

export function AppearancePage() {
  const { t } = useTranslation()
  const appearance = useAppearance()
  const language = useUIStore((state) => state.language)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const segmented = <T extends string>(
    label: string,
    value: T,
    options: readonly { value: T; label: string; icon?: ReactNode }[],
    onChange: (value: T) => void,
  ) => (
    <SegmentedControl
      aria-label={label}
      size="sm"
      value={value}
      onValueChange={onChange}
      options={options}
    />
  )
  return (
    <SettingsTemplate
      description={
        <>
          {t('appearance.description')}
          <span className="ml-space-xs inline-flex items-center gap-space-2xs text-text-tertiary">
            <Check className="size-icon-xs" aria-hidden="true" />
            {t('appearance.saved')}
          </span>
        </>
      }
      actions={
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw className="size-icon-sm" />}
          onClick={() => setAppearance(DEFAULT_APPEARANCE)}
        >
          {t('appearance.reset')}
        </Button>
      }
    >
      <AppearancePreview />
      <div className="mt-space-lg">
        <PreferenceChoiceGroup
          label={t('appearance.preset')}
          description={t('appearance.presetDescription')}
          value={appearance.preset}
          choices={APPEARANCE_PRESETS.map((preset) => ({
            value: preset,
            label: t(`appearance.presets.${preset}.name`),
            description: t(`appearance.presets.${preset}.description`),
            preview: <PresetSwatch preset={preset} />,
          }))}
          onChange={(preset) => setAppearance({ preset })}
        />
      </div>
      <SettingSection className={cn('mt-space-lg', SETTINGS_CARD)}>
        <SettingRow label={t('appearance.mode')}>
          {segmented(
            t('appearance.mode'),
            appearance.mode,
            (
              [
                ['system', Monitor],
                ['light', Sun],
                ['dark', Moon],
              ] as const
            ).map(([value, Icon]) => ({
              value,
              label: t(`appearance.modes.${value}`),
              icon: <Icon aria-hidden="true" />,
            })),
            (mode) => setAppearance({ mode }),
          )}
        </SettingRow>
        <SettingRow label={t('appearance.density')}>
          {segmented(
            t('appearance.density'),
            appearance.density,
            (['comfortable', 'compact'] as const).map((value) => ({
              value,
              label: t(`appearance.densities.${value}`),
            })),
            (density) => setAppearance({ density }),
          )}
        </SettingRow>
        <SettingRow label={t('appearance.textScale')}>
          {segmented(
            t('appearance.textScale'),
            String(appearance.textScale),
            [
              { value: '1', label: t('appearance.scales.standard') },
              { value: '1.125', label: t('appearance.scales.larger') },
              { value: '1.25', label: t('appearance.scales.largest') },
            ],
            (value) =>
              setAppearance({
                textScale:
                  value === '1.25' ? 1.25 : value === '1.125' ? 1.125 : 1,
              }),
          )}
        </SettingRow>
        <SettingRow label={t('appearance.motion')}>
          {segmented(
            t('appearance.motion'),
            appearance.motion,
            (['system', 'reduced'] as const).map((value) => ({
              value,
              label: t(`appearance.motions.${value}`),
            })),
            (motion) => setAppearance({ motion }),
          )}
        </SettingRow>
        <SettingRow
          label={t('appearance.language')}
          description={t('appearance.languageDescription')}
        >
          {segmented(
            t('appearance.language'),
            language,
            supportedLocales.map((locale) => ({
              value: locale.code,
              label: locale.nativeLabel,
            })),
            setLanguage,
          )}
        </SettingRow>
      </SettingSection>
    </SettingsTemplate>
  )
}
