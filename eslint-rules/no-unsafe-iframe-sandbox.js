/**
 * 模型输出是不可信输入（CLAUDE.md / AGENTS.md「安全与隐私」）—— iframe 沙箱防回归。
 *
 * 本仓库的 HTML artifact（模型生成的报告、designer 预览等）统一通过 `srcDoc` 注入
 * sandbox iframe 渲染（见 src/pages/agent/form/html-report/report-frame.tsx）。
 * sandbox 同时携带 `allow-scripts` + `allow-same-origin` 等于没有沙箱：脚本可以
 * 摸到宿主 origin 的 cookie / localStorage / token，prompt injection 直接升级为 XSS。
 *
 * 命中：
 *  - JSX `<iframe sandbox="...">` 字面量同时含 allow-scripts 与 allow-same-origin
 *  - JSX `<iframe srcDoc={...}>` 没有 sandbox 属性（srcDoc 内容默认按模型/模板 HTML 对待）
 *
 * 刻意不命中（避免误伤）：
 *  - sandbox 值为动态表达式（无法静态判定，不猜）
 *  - 仅有 `src` 的 iframe（可能是可信内部页面，是否加 sandbox 由 review 把关）
 *  - 字符串模板里手写的 `<iframe ...>` HTML（归 DOMPurify / 构建器自身校验）
 */

const MESSAGE_BOTH =
  'sandbox 不得同时包含 allow-scripts 与 allow-same-origin —— 这等于没有沙箱，模型 HTML 可直接读取宿主 origin 的凭证。二选一，HTML artifact 用 sandbox="allow-scripts"。'
const MESSAGE_SRCDOC =
  'srcDoc 渲染的 HTML 必须加 sandbox 属性（模型/模板 HTML 按不可信输入对待），参考 html-report/report-frame.tsx 的 sandbox="allow-scripts"。'

function jsxAttrName(attr) {
  return attr.type === 'JSXAttribute' && attr.name ? attr.name.name : null
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow iframes whose sandbox combines allow-scripts with allow-same-origin, and srcDoc iframes without a sandbox.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'iframe')
          return

        let sandboxAttr = null
        let hasSrcDoc = false
        for (const attr of node.attributes) {
          const name = jsxAttrName(attr)
          if (name === 'sandbox') sandboxAttr = attr
          if (name === 'srcDoc') hasSrcDoc = true
        }

        if (!sandboxAttr) {
          if (hasSrcDoc) context.report({ node, message: MESSAGE_SRCDOC })
          return
        }

        const value = sandboxAttr.value
        // sandbox（无值）= 全锁死，安全；动态表达式不静态判定
        if (
          !value ||
          value.type !== 'Literal' ||
          typeof value.value !== 'string'
        )
          return
        if (
          value.value.includes('allow-scripts') &&
          value.value.includes('allow-same-origin')
        ) {
          context.report({ node: sandboxAttr, message: MESSAGE_BOTH })
        }
      },
    }
  },
}
