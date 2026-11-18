import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { SETTINGS_CARD } from '@/pages/settings/components/settings-card'
import { setAppearance, type CustomSchemeSeed } from '@/themes'
import { CUSTOM_SEED_LIMITS } from '@/themes/color-schemes'
import { hexToRgb, oklchToRgb, rgbToHex, rgbToOklch } from '@/themes/oklch'

/** The brand color as people pick it: the accent hue and chroma at mid lightness. */
const brandHex = (seed: CustomSchemeSeed) =>
  rgbToHex(oklchToRgb(0.6, seed.accentChroma, seed.accentHue))

const [MIN_CHROMA, MAX_CHROMA] = CUSTOM_SEED_LIMITS.accentChroma
const [, MAX_TINT] = CUSTOM_SEED_LIMITS.neutralChroma

/**
 * Seed controls of the brand scheme. Sliders preview locally and apply on
 * release, since every change regenerates the whole palette.
 */
export function BrandSchemeSection({ seed }: { seed: CustomSchemeSeed }) {
  const { t } = useTranslation()
  const [chroma, setChroma] = useState(seed.accentChroma)
  const [tint, setTint] = useState(seed.neutralChroma)
  const update = (patch: Partial<CustomSchemeSeed>) =>
    setAppearance({ custom: { ...seed, ...patch } })
  const hex = brandHex(seed)
  return (
    <SettingSection
      className={cn('mt-space-lg', SETTINGS_CARD)}
      title={t('appearance.brand.title')}
      description={t('appearance.brand.description')}
    >
      <SettingRow
        label={t('appearance.brand.color')}
        description={t('appearance.brand.colorDescription')}
        htmlFor="appearance-brand-color"
      >
        <div className="flex items-center gap-space-sm">
          <Input
            id="appearance-brand-color"
            type="color"
            className="h-[var(--control-height)] w-14 cursor-pointer p-space-2xs"
            value={hex}
            onChange={(event) => {
              const { h, c } = rgbToOklch(hexToRgb(event.target.value))
              const accentChroma = Math.min(MAX_CHROMA, Math.max(MIN_CHROMA, c))
              setChroma(accentChroma)
              update({ accentHue: Math.round(h) % 360, accentChroma })
            }}
          />
          <span className="font-mono text-xs text-fg-subtle uppercase">
            {hex}
          </span>
        </div>
      </SettingRow>
      <SettingRow label={t('appearance.brand.chroma')}>
        <Slider
          aria-label={t('appearance.brand.chroma')}
          className="w-48"
          min={MIN_CHROMA}
          max={MAX_CHROMA}
          step={0.005}
          value={[chroma]}
          onValueChange={([value]) => setChroma(value)}
          onValueCommit={([value]) => update({ accentChroma: value })}
        />
      </SettingRow>
      <SettingRow
        label={t('appearance.brand.neutral')}
        description={t('appearance.brand.neutralDescription')}
      >
        <Slider
          aria-label={t('appearance.brand.neutral')}
          className="w-48"
          min={0}
          max={MAX_TINT}
          step={0.001}
          value={[tint]}
          onValueChange={([value]) => setTint(value)}
          onValueCommit={([value]) => update({ neutralChroma: value })}
        />
      </SettingRow>
    </SettingSection>
  )
}
