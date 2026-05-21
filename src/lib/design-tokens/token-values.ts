import type { DesignTokens } from '@/themes'
import {
  lightTokenValues,
  darkTokenValues,
} from '@/themes/token-values.generated'

/**
 * 已解析的 token 值的「按主题」类型化访问器（单一来源 → typed JS target）。
 *
 * 这是 canvas / G6 等非 Tailwind 渲染器消费设计 token 的**默认**路径:编译期类型
 * 安全(name 必须是 DesignTokens 的 key,拼错即编译失败),无 getComputedStyle、
 * 无运行期回退数组、SSR 安全。运行期读 CSS 变量(readCssVar / getCategoricalColorVar)
 * 仅保留给 scoped-theme / embed 子树(DOM 层级覆盖主题)。
 *
 * 主题分支在消费侧:组件用 `useIsDarkTheme() ? 'dark' : 'light'`,非 hook 场景用
 * `getResolvedTheme()`(均来自 `@/themes`)。
 */

export type ThemeMode = 'light' | 'dark'

/** 取已解析的 token 值。name 受 `keyof DesignTokens` 约束,编译期即拒绝无效 token 名。 */
export function getTokenValue(
  name: keyof DesignTokens,
  theme: ThemeMode,
): string {
  return (theme === 'dark' ? darkTokenValues : lightTokenValues)[name]
}
