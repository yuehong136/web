import { useMemo } from 'react'
import { getCategoricalPalette, getTokenValue } from '@/lib/design-tokens'
import { useResolvedAppearance } from '@/themes'

export interface ChartTheme {
  /** The zero baseline and axis line. */
  axis: string
  /** Gridlines behind the marks. */
  grid: string
  /** Tick labels. */
  tick: string
  /** The band or line under the pointer. */
  cursor: string
  accent: string
  success: string
  warning: string
  danger: string
  /** Identity colours for unrelated series; stable across schemes. */
  palette: string[]
}

/**
 * Chart colours of the current scheme and mode. Recharts draws SVG from
 * attributes, so it takes resolved values, not token class names; the hook
 * re-reads them whenever the appearance changes.
 */
export function useChartTheme(): ChartTheme {
  const { resolvedMode: mode, preset } = useResolvedAppearance()
  return useMemo(
    () => ({
      axis: getTokenValue('viz-axis', mode, preset),
      grid: getTokenValue('line-subtle', mode, preset),
      tick: getTokenValue('fg-subtle', mode, preset),
      cursor: getTokenValue('fill-hover', mode, preset),
      accent: getTokenValue('accent-solid', mode, preset),
      success: getTokenValue('success-fg', mode, preset),
      warning: getTokenValue('warning-fg', mode, preset),
      danger: getTokenValue('danger-fg', mode, preset),
      palette: getCategoricalPalette(mode, 10, preset),
    }),
    [mode, preset],
  )
}
