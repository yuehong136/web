import { getTokenValue, type ThemeMode } from '@/lib/design-tokens'

export interface GraphTheme {
  accentColor: string
  borderColor: string
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
// focusColor 用交互态 `line-focus`(其命名/语义不属本任务改动范围)。
export function getGraphTheme(theme: ThemeMode): GraphTheme {
  const workspaceBorderColor = getTokenValue('line', theme)

  return {
    accentColor: getTokenValue('accent-fg', theme),
    borderColor: getTokenValue('line-subtle', theme),
    edgeActiveColor: getTokenValue('fg-muted', theme),
    edgeColor: workspaceBorderColor,
    focusColor: getTokenValue('line-focus', theme),
    surfaceColor: getTokenValue('raised', theme),
    surfaceSubtleColor: getTokenValue('raised-hover', theme),
    textColor: getTokenValue('fg', theme),
    textColorSub: getTokenValue('fg-subtle', theme),
    workspaceBorderColor,
  }
}
