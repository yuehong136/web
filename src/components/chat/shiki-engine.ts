import { createCssVariablesTheme } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

/**
 * 共享的 Shiki JavaScript RegExp 引擎（单例）。
 *
 * 选用 JS RegExp 引擎而非 Oniguruma(WASM) 的原因：
 * - 无需加载 WASM，客户端首屏更快、包更小，是 Shiki 官方推荐的浏览器端方案。
 * - `forgiving: true`：遇到不受支持的语法时降级为纯文本，而不是抛错，
 *   这对「大模型可能输出任意语言」的 AI 聊天场景很重要。
 *
 * 语言与主题由 Shiki 按需动态加载（仅加载页面实际用到的），无需手动注册清单。
 */
export const shikiEngine = createJavaScriptRegexEngine({ forgiving: true })

/**
 * 单一 CSS 变量主题：token 颜色写成 `var(--shiki-token-*)`，在 `code-block.css`
 * 里映射到设计令牌 `syntax-*` / `code-*`。方案、明暗与对比度切换都只换变量值，
 * 无需重新高亮，也不再加载 github-light / github-dark 两套主题。
 */
export const CODE_THEME = createCssVariablesTheme({
  name: 'multirag-tokens',
  variablePrefix: '--shiki-',
  fontStyle: true,
})
