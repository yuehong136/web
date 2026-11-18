import type { DesignTokens } from '@/themes/tokens'
import { getAppearance, type AppearancePreset } from '@/themes/appearance'
import { customTokenValues } from '@/themes/custom-scheme'
import { presetTokenValues } from '@/themes/token-values.generated'

export type ThemeMode = 'light' | 'dark'

/**
 * Static canvas/chart values use the current preset unless an explicit scope
 * is supplied. The brand scheme is generated from the stored seed on demand.
 */
export function getTokenValue(
  name: keyof DesignTokens,
  theme: ThemeMode,
  preset: AppearancePreset = getAppearance().preset,
): string {
  if (preset === 'custom')
    return customTokenValues(getAppearance().custom)[theme][name]
  return presetTokenValues[preset][theme][name]
}
