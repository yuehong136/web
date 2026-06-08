import { createJavaScriptRegexEngine } from 'react-shiki'

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
 * 双主题配置：默认色为 light，dark 颜色写入 CSS 变量，
 * 通过 `code-block.css` 里 `.dark` / `[data-theme="dark"]` 选择器切换，
 * 与项目 Tailwind 的 darkMode 配置对齐，切换主题时无需重新高亮。
 */
export const CODE_THEMES = {
  light: 'github-light',
  dark: 'github-dark',
}
