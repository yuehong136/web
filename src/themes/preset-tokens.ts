import type { DesignTokens } from './tokens'
import type { AppearancePreset, ResolvedTheme } from './appearance'
import { presetPalettes, type SurfacePalette } from './preset-palettes'
import { surfacePalette } from './surface-palette'
import { interactionPalette } from './interaction-palette'
import { buildSurfaceTokens } from './surface-tokens'

const channels = (hex: string) =>
  [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16))

/** Migrate historical neutral aliases to the preset's role palette at generation time. */
function neutralMap(base: SurfacePalette, next: SurfacePalette) {
  const roles = Object.keys(base) as (keyof SurfacePalette)[]
  return (value: string) => {
    const exact = roles.find((role) => base[role] === value)
    if (exact) return next[exact]
    if (!/^#[\da-f]{6}$/i.test(value)) return value
    const rgb = channels(value)
    if (Math.max(...rgb) - Math.min(...rgb) > 42) return value
    const candidates = roles.filter((role) => /^#[\da-f]{6}$/i.test(base[role]))
    const role = candidates.reduce((best, role) => {
      const distance = (key: keyof SurfacePalette) =>
        channels(base[key]).reduce(
          (sum, channel, index) => sum + (channel - rgb[index]) ** 2,
          0,
        )
      return distance(role) < distance(best) ? role : best
    }, candidates[0])
    return next[role]
  }
}

/** Existing token keys remain a migration surface; preset roles are the source of truth. */
export function buildPresetTokens(
  base: DesignTokens,
  mode: ResolvedTheme,
  preset: AppearancePreset,
): DesignTokens {
  if (preset === 'studio') return { ...base }
  const surfaces = presetPalettes[preset].surfaces[mode]
  const interaction = presetPalettes[preset].interaction[mode]
  const oldInteraction = interactionPalette[mode]
  const retintNeutral = neutralMap(surfacePalette[mode], surfaces)
  const tokens = { ...base }
  for (const key of Object.keys(tokens) as (keyof DesignTokens)[]) {
    // Intent colors and categorical series have their own semantics and contrast contract.
    if (
      /^(status-|data-viz-|text-(success|warning|error|inverted|on-accent)|components-(alert-|method-|badge-(success|warning|error)|canvas-node-status-))/.test(
        key,
      ) ||
      key === 'components-button-primary-text' ||
      key === 'components-checkbox-icon' ||
      (base[key].toLowerCase() === '#ffffff' &&
        /(-text(?:-|$)|-icon(?:-|$)|^text-)/.test(key))
    )
      continue
    const value = base[key]
    const role = (
      Object.keys(oldInteraction) as (keyof typeof oldInteraction)[]
    ).find((role) => oldInteraction[role] === value)
    tokens[key] = role ? interaction[role] : retintNeutral(value)
  }
  return {
    ...tokens,
    ...buildSurfaceTokens(surfaces, interaction),
    'text-primary': surfaces.text,
    'text-secondary': surfaces.secondary,
    'text-tertiary': surfaces.tertiary,
    'text-muted': surfaces.muted,
    'text-disabled': surfaces.disabled,
    'text-accent': interaction.selectionText,
    'background-body': surfaces.body,
    'background-default': surfaces.canvas,
    'background-section': surfaces.canvas,
    'background-surface': surfaces.surface,
    'background-subtle': surfaces.subtle,
    'border-default': surfaces.border,
    'border-subtle': surfaces.borderSubtle,
    'border-strong': surfaces.borderStrong,
    'components-input-bg': surfaces.surface,
    'components-input-bg-focus': surfaces.surface,
    'components-input-bg-hover': surfaces.canvas,
    'components-input-bg-disabled': surfaces.subtle,
    'components-system-chart-tooltip-bg': surfaces.elevated,
    'components-system-chart-tooltip-border': surfaces.border,
    'components-system-chart-tooltip-text': surfaces.text,
    'components-system-chart-tooltip-muted': surfaces.tertiary,
  }
}
