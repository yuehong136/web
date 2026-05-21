const warnedTokens = new Set<string>()

/**
 * 读取设计 token 的运行期 CSS 变量值（`--color-<token>`），解析为空时回退到 fallback。
 *
 * 供 JS 侧需要把 token 喂给 canvas / G6 / recharts 等非 Tailwind 渲染器的场景使用
 * （Tailwind class 路径应直接用 token class，不要走这里）。
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
