/**
 * 模型输出是不可信输入（CLAUDE.md / AGENTS.md「安全与隐私」）—— 外链 rel 防回归。
 *
 * 模型/工具输出里的链接经常指向任意外部站点。`target="_blank"` 不带
 * `rel="noopener noreferrer"` 时，目标页可经 window.opener 反向操控本应用
 * （tabnabbing），并泄露 Referer。仓库现有 7 处外链均已正确携带 rel，本规则防回归。
 *
 * 命中：JSX 元素带字面量 target="_blank"，且 rel 缺失或字面量中既无 noopener
 * 也无 noreferrer（noreferrer 蕴含 noopener，二者任一即可）。
 *
 * 刻意不命中：target / rel 为动态表达式（无法静态判定，不猜）。
 */

const MESSAGE =
  'target="_blank" 必须携带 rel="noopener noreferrer"（防 tabnabbing / Referer 泄露）。模型输出中的链接一律按不可信处理。'

function findAttr(node, name) {
  return node.attributes.find(
    (attr) =>
      attr.type === 'JSXAttribute' && attr.name && attr.name.name === name,
  )
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require rel="noopener noreferrer" (either token) on elements with target="_blank".',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const target = findAttr(node, 'target')
        if (
          !target ||
          !target.value ||
          target.value.type !== 'Literal' ||
          target.value.value !== '_blank'
        )
          return

        const rel = findAttr(node, 'rel')
        if (!rel || !rel.value) {
          context.report({ node: target, message: MESSAGE })
          return
        }
        // 动态 rel 表达式不静态判定
        if (rel.value.type !== 'Literal' || typeof rel.value.value !== 'string')
          return
        if (!/\bno(?:opener|referrer)\b/.test(rel.value.value)) {
          context.report({ node: rel, message: MESSAGE })
        }
      },
    }
  },
}
