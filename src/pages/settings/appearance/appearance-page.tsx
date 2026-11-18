import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, type ReactNode } from 'react'
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
  ACTION_STYLES,
  APPEARANCE_PRESETS,
  CONTRAST_LEVELS,
  DEFAULT_APPEARANCE,
  ScopedTheme,
  setAppearance,
  useAppearance,
  useResolvedAppearance,
  type AppearancePreset,
} from '@/themes'
import { installCustomScheme } from '@/themes/custom-scheme'
import { AppearancePreview } from './appearance-preview'
import { BrandSchemeSection } from './brand-scheme-section'

/** A miniature workbench: shell tone, work card, citation, AI composer, primary. */
function PresetSwatch({ preset }: { preset: AppearancePreset }) {
  const { resolvedMode } = useResolvedAppearance()
  return (
    <ScopedTheme preset={preset} theme={resolvedMode} className="block">
      <span className="flex h-24 overflow-hidden border-b border-line-subtle bg-canvas p-space-xs">
        <span className="flex w-1/5 flex-col gap-space-xs p-space-xs">
          <span className="h-2 w-full rounded-radius-sm bg-fill-pressed" />
          <span className="h-2 w-full rounded-radius-sm bg-accent-solid" />
          <span className="h-2 w-full rounded-radius-sm bg-fill-pressed" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-space-xs rounded-radius-md border border-line-subtle bg-surface p-space-sm shadow-elevation-low">
          <span className="h-1 w-4/5 rounded-radius-full bg-fg" />
          <span className="flex items-center gap-space-2xs">
            <span className="h-1 w-1/2 rounded-radius-full bg-fg-subtle" />
            <span className="h-2 w-3 rounded-radius-sm bg-citation-bg" />
            <span className="h-1.5 w-6 rounded-radius-sm bg-highlight-bg" />
          </span>
          <span className="mt-auto flex h-4 items-center justify-end rounded-radius-md border border-transparent bg-ai-tide p-px">
            <span className="flex size-full items-center justify-end rounded-radius-sm bg-surface pr-px">
              <span className="size-3 rounded-radius-full bg-action-bg" />
            </span>
          </span>
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
  // The brand swatch previews the stored seed even when another scheme is active.
  useEffect(() => installCustomScheme(appearance.custom), [appearance.custom])
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
          <span className="ml-space-xs inline-flex items-center gap-space-2xs text-fg-subtle">
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
      {appearance.preset === 'custom' && (
        <BrandSchemeSection
          key={JSON.stringify(appearance.custom)}
          seed={appearance.custom}
        />
      )}
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
          label={t('appearance.contrast')}
          description={t('appearance.contrastDescription')}
        >
          {segmented(
            t('appearance.contrast'),
            appearance.contrast,
            CONTRAST_LEVELS.map((value) => ({
              value,
              label: t(`appearance.contrasts.${value}`),
            })),
            (contrast) => setAppearance({ contrast }),
          )}
        </SettingRow>
        <SettingRow
          label={t('appearance.action')}
          description={t('appearance.actionDescription')}
        >
          {segmented(
            t('appearance.action'),
            appearance.action,
            ACTION_STYLES.map((value) => ({
              value,
              label: t(`appearance.actions.${value}`),
            })),
            (action) => setAppearance({ action }),
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
