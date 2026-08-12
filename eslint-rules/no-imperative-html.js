/**
 * 禁止业务代码通过 imperative DOM API 写入 HTML。
 *
 * 模型输出、工具错误和文档内容都按攻击者可控处理。React 内容应由 React 节点
 * 渲染，HTML 内容必须经过 SafeHtml；直接 innerHTML/outerHTML 等写入会绕过这条
 * 边界。唯一允许的形态是 `element.innerHTML = ''`，用于第三方预览器渲染前清空
 * 已受控容器。
 */

const ASSIGNMENT_MESSAGE =
  '禁止通过 innerHTML/outerHTML 写入内容；文本用 textContent/React，HTML 用 SafeHtml。仅允许 innerHTML = "" 清空受控容器。'
const METHOD_MESSAGE =
  '禁止通过 insertAdjacentHTML 或 document.write/writeln 写入 HTML；统一使用 React 或 SafeHtml。'

function staticPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') return null
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }
  if (
    node.computed &&
    node.property.type === 'Literal' &&
    typeof node.property.value === 'string'
  ) {
    return node.property.value
  }
  return null
}

function isEmptyString(node) {
  return node?.type === 'Literal' && node.value === ''
}

function isDocumentWrite(node) {
  if (!node || node.type !== 'MemberExpression') return false
  const object = node.object
  const isDirectDocument =
    object.type === 'Identifier' && object.name === 'document'
  const isGlobalDocument =
    object.type === 'MemberExpression' &&
    object.object.type === 'Identifier' &&
    ['window', 'globalThis', 'self'].includes(object.object.name) &&
    staticPropertyName(object) === 'document'
  if (!isDirectDocument && !isGlobalDocument) return false
  return ['write', 'writeln'].includes(staticPropertyName(node))
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow imperative HTML DOM sinks while allowing empty innerHTML assignments used to clear controlled containers.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        const propertyName = staticPropertyName(node.left)
        if (!['innerHTML', 'outerHTML'].includes(propertyName)) return

        if (
          propertyName === 'innerHTML' &&
          node.operator === '=' &&
          isEmptyString(node.right)
        ) {
          return
        }

        context.report({ node, message: ASSIGNMENT_MESSAGE })
      },
      CallExpression(node) {
        const propertyName = staticPropertyName(node.callee)
        if (
          propertyName === 'insertAdjacentHTML' ||
          isDocumentWrite(node.callee)
        ) {
          context.report({ node, message: METHOD_MESSAGE })
        }
      },
    }
  },
}
