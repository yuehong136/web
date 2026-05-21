import { readCssVar } from '@/lib/design-tokens'

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

// 复用共享 readCssVar（带 dev-only 空值告警）。结构色解析失败时回退到 `var(--color-*)`
// 引用，让浏览器仍能延迟解析，同时在 dev 控制台暴露失效 token 名。
function readDesignToken(element: HTMLElement, token: string) {
  return readCssVar(token, `var(--color-${token})`, element)
}

export function getGraphTheme(element: HTMLElement): GraphTheme {
  const workspaceBorderColor = readDesignToken(
    element,
    'components-workspace-border',
  )

  return {
    accentColor: readDesignToken(element, 'text-accent'),
    borderColor: readDesignToken(element, 'components-card-border'),
    cardShadow: readDesignToken(element, 'components-card-shadow'),
    edgeActiveColor: readDesignToken(element, 'text-secondary'),
    edgeColor: workspaceBorderColor,
    focusColor: readDesignToken(element, 'state-focus'),
    surfaceColor: readDesignToken(element, 'components-card-bg'),
    surfaceSubtleColor: readDesignToken(element, 'components-card-bg-hover'),
    textColor: readDesignToken(element, 'text-primary'),
    textColorSub: readDesignToken(element, 'text-muted'),
    workspaceBorderColor,
  }
}
