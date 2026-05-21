import { getTokenValue, type ThemeMode } from '@/lib/design-tokens'

export interface GraphTheme {
  accentColor: string
  borderColor: string
  cardShadow: string
  edgeActiveColor: string
  edgeColor: string
  focusColor: string
  surfaceColor: string
  surfaceSubtleColor: string
  textColor: string
  textColorSub: string
  workspaceBorderColor: string
}

// 结构色按当前主题从单一来源的 typed JS 值取出（编译期类型安全,无 getComputedStyle）。
// focusColor 用交互态 `state-focus`(其命名/语义不属本任务改动范围)。
export function getGraphTheme(theme: ThemeMode): GraphTheme {
  const workspaceBorderColor = getTokenValue(
    'components-workspace-border',
    theme,
  )

  return {
    accentColor: getTokenValue('text-accent', theme),
    borderColor: getTokenValue('components-card-border', theme),
    cardShadow: getTokenValue('components-card-shadow', theme),
    edgeActiveColor: getTokenValue('text-secondary', theme),
    edgeColor: workspaceBorderColor,
    focusColor: getTokenValue('state-focus', theme),
    surfaceColor: getTokenValue('components-card-bg', theme),
    surfaceSubtleColor: getTokenValue('components-card-bg-hover', theme),
    textColor: getTokenValue('text-primary', theme),
    textColorSub: getTokenValue('text-muted', theme),
    workspaceBorderColor,
  }
}
