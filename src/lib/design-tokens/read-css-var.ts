const warnedTokens = new Set<string>()

/**
 * 读取设计 token 的运行期 CSS 变量值（`--color-<token>`），解析为空时回退到 fallback。
 *
 * ⚠️ 仅限 scoped-theme / embed 子树:这些场景下 DOM 层级覆盖了 `data-theme`,真实生效的
 * token 值只能在运行期从该子树元素读出。**根主题消费请改用静态、类型安全的按主题访问器**
 * `getTokenValue(name, theme)` / `getCategoricalPalette(theme)`(来自 `@/lib/design-tokens`),
 * 不要再走本函数的 getComputedStyle 路径。
 *
 * 失败即响：token 名失效（被删除 / 拼错 / 运行期拼接出错）时 `--color-*` 会解析为空字符串，
 * 静态 lint 无法覆盖运行期拼接，这里在 dev 下按 token 去重地告警，使静默回退变成可见信号
 * （思路同 i18next missingKey）。
 */
export function readCssVar(
  token: string,
  fallback: string,
  element: HTMLElement | null = typeof document !== 'undefined'
    ? document.documentElement
    : null,
): string {
  if (typeof window === 'undefined' || !element) return fallback
  const value = getComputedStyle(element)
    .getPropertyValue(`--color-${token}`)
    .trim()
  if (import.meta.env.DEV && !value && !warnedTokens.has(token)) {
    warnedTokens.add(token)
    console.warn(
      `[design-token] --color-${token} 解析为空，回退到 ${fallback}。请确认 token 名是否有效。`,
    )
  }
  return value || fallback
}
