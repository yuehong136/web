/**
 * 模型输出是不可信输入（CLAUDE.md / AGENTS.md「安全与隐私」）—— 裸 dangerouslySetInnerHTML 防回归。
 *
 * dangerouslySetInnerHTML 直接把字符串写进 DOM。模型输出、工具结果、文档解析
 * 内容、检索高亮都按攻击者可控对待（默认存在 prompt injection），未经 DOMPurify
 * 净化直接注入即是存储型/反射型 XSS（SEC-3 审计实锤过两处：聊天 markdown 与
 * create-app 预览均曾把模型 markdown 渲染结果直接注入）。统一出口是
 * src/components/ui/safe-html.tsx 的 <SafeHtml html={...} />。
 *
 * 命中：
 *  - 任何 JSX 属性 dangerouslySetInnerHTML，除非满足下面的放行条件
 *
 * 放行（避免误伤 / 保留逃生口）：
 *  - SafeHtml 自身实现（src/components/ui/safe-html.tsx）—— 仓库唯一合法出口
 *  - __html 值是净化调用字面量：`X.sanitize(...)`（DOMPurify/purify 等实例方法）
 *    或名字以 sanitize 开头的函数调用（sanitizeHtml(...) 等）。注意这只是
 *    静态启发：净化函数本身必须真的走 DOMPurify，由 code review 把关。
 */

const MESSAGE =
  '禁止直接使用 dangerouslySetInnerHTML —— 统一改用 @/components/ui/safe-html 的 <SafeHtml html={...} options={...} />（内部 DOMPurify 净化）。确需自管时 __html 值必须是 DOMPurify.sanitize(...) 或 sanitize* 函数调用字面量。'

const SAFE_HTML_IMPL = /[\\/]src[\\/]components[\\/]ui[\\/]safe-html\.tsx$/

function isSanitizeCall(node) {
  if (!node || node.type !== 'CallExpression') return false
  const callee = node.callee
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'sanitize'
  )
    return true
  return callee.type === 'Identifier' && /^sanitize/i.test(callee.name)
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw dangerouslySetInnerHTML outside the SafeHtml component, unless __html is a sanitize(...) call literal.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    if (SAFE_HTML_IMPL.test(filename)) return {}

    return {
      JSXAttribute(node) {
        if (
          !node.name ||
          node.name.type !== 'JSXIdentifier' ||
          node.name.name !== 'dangerouslySetInnerHTML'
        )
          return

        const value = node.value
        if (value && value.type === 'JSXExpressionContainer') {
          const expr = value.expression
          if (expr.type === 'ObjectExpression') {
            const htmlProp = expr.properties.find(
              (prop) =>
                prop.type === 'Property' &&
                !prop.computed &&
                ((prop.key.type === 'Identifier' &&
                  prop.key.name === '__html') ||
                  (prop.key.type === 'Literal' && prop.key.value === '__html')),
            )
            // __html 值是净化调用字面量 → 放行
            if (htmlProp && isSanitizeCall(htmlProp.value)) return
          }
        }

        context.report({ node, message: MESSAGE })
      },
    }
  },
}
