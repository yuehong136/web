import type { DesignTokens } from '@/themes/tokens'
import { getAppearance, type AppearancePreset } from '@/themes/appearance'
import { presetTokenValues } from '@/themes/token-values.generated'

export type ThemeMode = 'light' | 'dark'

/** Static canvas/chart values use the current preset unless an explicit scope is supplied. */
export function getTokenValue(
  name: keyof DesignTokens,
  theme: ThemeMode,
  preset: AppearancePreset = getAppearance().preset,
): string {
  return presetTokenValues[preset][theme][name]
}
