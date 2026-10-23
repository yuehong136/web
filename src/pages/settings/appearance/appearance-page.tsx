import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/patterns/page-header'
import { PreferenceChoiceGroup } from '@/components/patterns/preference-choice-group'
import { Button } from '@/components/ui/button'
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
  return (
    <div className="mx-auto w-full max-w-6xl space-y-space-xl p-space-base sm:p-space-lg lg:p-space-xl">
      <PageHeader
        title={t('appearance.title')}
        description={t('appearance.description')}
        surface="plain"
        wrapActions
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
      />
      <div className="grid min-w-0 gap-space-xl xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="min-w-0 space-y-space-xl">
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
          <PreferenceChoiceGroup
            label={t('appearance.mode')}
            value={appearance.mode}
            className="grid-cols-1 sm:grid-cols-3"
            choices={(
              [
                ['system', Monitor],
                ['light', Sun],
                ['dark', Moon],
              ] as const
            ).map(([value, Icon]) => ({
              value,
              label: t(`appearance.modes.${value}`),
              icon: <Icon className="size-icon-sm" />,
            }))}
            onChange={(mode) => setAppearance({ mode })}
          />
          <PreferenceChoiceGroup
            label={t('appearance.density')}
            value={appearance.density}
            choices={(['comfortable', 'compact'] as const).map((value) => ({
              value,
              label: t(`appearance.densities.${value}`),
            }))}
            onChange={(density) => setAppearance({ density })}
          />
          <PreferenceChoiceGroup
            label={t('appearance.textScale')}
            value={String(appearance.textScale)}
            className="grid-cols-1 sm:grid-cols-3"
            choices={[
              { value: '1', label: t('appearance.scales.standard') },
              { value: '1.125', label: t('appearance.scales.larger') },
              { value: '1.25', label: t('appearance.scales.largest') },
            ]}
            onChange={(value) =>
              setAppearance({
                textScale:
                  value === '1.25' ? 1.25 : value === '1.125' ? 1.125 : 1,
              })
            }
          />
          <PreferenceChoiceGroup
            label={t('appearance.motion')}
            value={appearance.motion}
            choices={(['system', 'reduced'] as const).map((value) => ({
              value,
              label: t(`appearance.motions.${value}`),
            }))}
            onChange={(motion) => setAppearance({ motion })}
          />
          <PreferenceChoiceGroup
            label={t('appearance.language')}
            description={t('appearance.languageDescription')}
            value={language}
            choices={supportedLocales.map((locale) => ({
              value: locale.code,
              label: locale.nativeLabel,
            }))}
            onChange={setLanguage}
          />
          <p className="flex items-center gap-space-xs text-xs text-text-secondary">
            <Check className="size-icon-sm" aria-hidden="true" />
            {t('appearance.saved')}
          </p>
        </div>
        <div className="min-w-0 xl:sticky xl:top-space-lg xl:self-start">
          <AppearancePreview />
        </div>
      </div>
    </div>
  )
}
