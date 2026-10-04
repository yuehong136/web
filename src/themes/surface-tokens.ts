import type { surfacePalette } from './surface-palette'
import type { interactionPalette } from './interaction-palette'

export interface SurfaceTokens {
  'surface-primary': string
  'surface-secondary': string
  'surface-tertiary': string
  'surface-accent': string
  'surface-accent-subtle': string
  'border-primary': string
  'border-hover': string
  'border-focus': string
  'text-caption': string
  'text-on-accent': string
}

export const emptySurfaceTokens: SurfaceTokens = {
  'surface-primary': '',
  'surface-secondary': '',
  'surface-tertiary': '',
  'surface-accent': '',
  'surface-accent-subtle': '',
  'border-primary': '',
  'border-hover': '',
  'border-focus': '',
  'text-caption': '',
  'text-on-accent': '',
}

/** Compact surface names used by shared UI resolve to the same product palette. */
export function buildSurfaceTokens(
  surfaces: (typeof surfacePalette)['light' | 'dark'],
  interaction: (typeof interactionPalette)['light' | 'dark'],
): SurfaceTokens {
  return {
    'surface-primary': surfaces.surface,
    'surface-secondary': surfaces.subtle,
    'surface-tertiary': surfaces.canvas,
    'surface-accent': interaction.selection,
    'surface-accent-subtle': interaction.selectionTint,
    'border-primary': surfaces.border,
    'border-hover': surfaces.inputBorderHover,
    'border-focus': interaction.focus,
    'text-caption': surfaces.tertiary,
    'text-on-accent': '#ffffff',
  }
}
