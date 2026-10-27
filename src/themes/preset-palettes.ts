import { surfacePalette } from './surface-palette'
import { interactionPalette } from './interaction-palette'
import type { AppearancePreset, ResolvedTheme } from './appearance'

export type SurfacePalette = {
  [K in keyof typeof surfacePalette.light]: string
}
export type InteractionPalette = {
  [K in keyof typeof interactionPalette.light]: string
}
interface PresetPalette {
  surfaces: Record<ResolvedTheme, SurfacePalette>
  interaction: Record<ResolvedTheme, InteractionPalette>
}

/** Role palettes, rather than component-specific color overrides, define each preset. */
export const presetPalettes: Record<AppearancePreset, PresetPalette> = {
  studio: { surfaces: surfacePalette, interaction: interactionPalette },
  paper: {
    surfaces: {
      light: {
        body: '#f6f3ed',
        canvas: '#eeeae2',
        surface: '#fffdf8',
        subtle: '#eae5db',
        elevated: '#fffdf8',
        text: '#2f2b24',
        secondary: '#635b4f',
        tertiary: '#6f6557',
        muted: '#6f6557',
        disabled: '#a79d8f',
        border: 'rgba(47, 43, 36, 0.13)',
        borderSubtle: 'rgba(47, 43, 36, 0.07)',
        borderStrong: 'rgba(47, 43, 36, 0.22)',
        inputBorder: '#cfc5b6',
        inputBorderHover: '#a79d8f',
      },
      dark: {
        body: '#1d1b18',
        canvas: '#25221e',
        surface: '#2c2823',
        subtle: '#363029',
        elevated: '#332e28',
        text: '#f2eade',
        secondary: '#c7bbab',
        tertiary: '#b1a493',
        muted: '#b1a493',
        disabled: '#8d8071',
        border: 'rgba(242, 234, 222, 0.14)',
        borderSubtle: 'rgba(242, 234, 222, 0.08)',
        borderStrong: 'rgba(242, 234, 222, 0.24)',
        inputBorder: '#685b4d',
        inputBorderHover: '#8d8071',
      },
    },
    interaction: {
      light: {
        selection: '#8e612a',
        selectionText: '#7a4e19',
        focus: '#8e612a',
        selectionTint: 'rgba(142, 97, 42, 0.12)',
        selectionSoft: 'rgba(142, 97, 42, 0.07)',
        action: '#75562f',
        actionHover: '#624522',
        actionActive: '#50371a',
      },
      dark: {
        selection: '#b68750',
        selectionText: '#e1bd95',
        focus: '#d3ad7d',
        selectionTint: 'rgba(182, 135, 80, 0.2)',
        selectionSoft: 'rgba(182, 135, 80, 0.12)',
        action: '#865e2a',
        actionHover: '#775022',
        actionActive: '#65421b',
      },
    },
  },
  graphite: {
    surfaces: {
      light: {
        body: '#f0f1f2',
        canvas: '#e9eaec',
        surface: '#fcfcfd',
        subtle: '#e2e4e7',
        elevated: '#fcfcfd',
        text: '#202328',
        secondary: '#535963',
        tertiary: '#5c646f',
        muted: '#5c646f',
        disabled: '#979ea9',
        border: 'rgba(32, 35, 40, 0.14)',
        borderSubtle: 'rgba(32, 35, 40, 0.08)',
        borderStrong: 'rgba(32, 35, 40, 0.24)',
        inputBorder: '#c2c7ce',
        inputBorderHover: '#979ea9',
      },
      dark: {
        body: '#101214',
        canvas: '#17191d',
        surface: '#1d2025',
        subtle: '#282c33',
        elevated: '#262a31',
        text: '#eef0f3',
        secondary: '#bbc1cb',
        tertiary: '#a0a9b8',
        muted: '#a0a9b8',
        disabled: '#727c8c',
        border: 'rgba(238, 240, 243, 0.14)',
        borderSubtle: 'rgba(238, 240, 243, 0.08)',
        borderStrong: 'rgba(238, 240, 243, 0.24)',
        inputBorder: '#525c6b',
        inputBorderHover: '#727c8c',
      },
    },
    interaction: {
      light: {
        selection: '#535c70',
        selectionText: '#454e61',
        focus: '#535c70',
        selectionTint: 'rgba(83, 92, 112, 0.12)',
        selectionSoft: 'rgba(83, 92, 112, 0.07)',
        action: '#303744',
        actionHover: '#242b37',
        actionActive: '#1a202b',
      },
      dark: {
        selection: '#7d8aa0',
        selectionText: '#d0dbef',
        focus: '#b0bdd4',
        selectionTint: 'rgba(125, 138, 160, 0.18)',
        selectionSoft: 'rgba(125, 138, 160, 0.1)',
        action: '#566885',
        actionHover: '#495c7a',
        actionActive: '#3d4f6d',
      },
    },
  },
  ocean: {
    surfaces: {
      light: {
        body: '#edf7fa',
        canvas: '#e3f0f5',
        surface: '#fbfeff',
        subtle: '#dbeaf1',
        elevated: '#fbfeff',
        text: '#123342',
        secondary: '#3d6171',
        tertiary: '#486a7a',
        muted: '#486a7a',
        disabled: '#8daab6',
        border: 'rgba(18, 51, 66, 0.14)',
        borderSubtle: 'rgba(18, 51, 66, 0.08)',
        borderStrong: 'rgba(18, 51, 66, 0.24)',
        inputBorder: '#abc8d5',
        inputBorderHover: '#8daab6',
      },
      dark: {
        body: '#0b1b26',
        canvas: '#0f2533',
        surface: '#142f40',
        subtle: '#1d3e50',
        elevated: '#1a394b',
        text: '#e6f4fc',
        secondary: '#b0ccd9',
        tertiary: '#95b8cb',
        muted: '#95b8cb',
        disabled: '#63899f',
        border: 'rgba(230, 244, 252, 0.14)',
        borderSubtle: 'rgba(230, 244, 252, 0.08)',
        borderStrong: 'rgba(230, 244, 252, 0.24)',
        inputBorder: '#3c647a',
        inputBorderHover: '#63899f',
      },
    },
    interaction: {
      light: {
        selection: '#126887',
        selectionText: '#0e5877',
        focus: '#167b9b',
        selectionTint: 'rgba(18, 104, 135, 0.12)',
        selectionSoft: 'rgba(18, 104, 135, 0.07)',
        action: '#145b81',
        actionHover: '#0f4d70',
        actionActive: '#0a405e',
      },
      dark: {
        selection: '#3c9fbd',
        selectionText: '#91def2',
        focus: '#63c7e0',
        selectionTint: 'rgba(60, 159, 189, 0.2)',
        selectionSoft: 'rgba(60, 159, 189, 0.12)',
        action: '#1f6e99',
        actionHover: '#19618a',
        actionActive: '#135379',
      },
    },
  },
}
