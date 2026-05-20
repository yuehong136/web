/**
 * 禁止新写「反馈态」legacy `state-*` 设计 token —— 反馈/意图色一律用 canonical `status-*`。
 *
 * 两条独立语义轴（见 src/themes/design-system.md「状态令牌：两条语义轴」）：
 *  - 反馈/意图色 (feedback)  → status-{success,warning,error,info}（含 -10 / -subtle）  ← 本规则强制
 *  - 交互态     (interactive) → state-{hover,active,focus,disabled,loading}              ← 本规则不管
 *
 * `state-{success,warning,error,info}` 现为 `status-*` 的等值 legacy alias，仅在 alias 物理删除前
 * 保留以兼容存量代码；禁止新写。
 *
 * 命中三类形式（字符串字面量 / 模板字符串，覆盖 className、cn()、config 常量等）：
 *  - class：(bg|text|border|ring)-state-(success|warning|error|info)(-10|-subtle)?(/\d+)?
 *  - CSS var：var(--color-state-(success|warning|error|info)...)
 *
 * 刻意不命中（避免误伤）：
 *  - 交互态 state-hover/active/focus/disabled/loading（含 state-focus-10/-subtle）
 *  - state-neutral / state-neutral-10（中性灰）
 *  - 基础语义键 text-success/border-success 等（无 `-state-` 段，自然不匹配）
 *  - components-*-status-* 组件级命名空间
 *  - 裸字符串 'state-success'（如 mindmap 的 readCssVar('state-info')）—— 无 Tailwind 前缀，刻意放行，
 *    作为后续 category/data-viz palette token 任务处理
 *  - src/themes/** 下的 alias 定义（在 eslint.config.js 中通过 ignores 排除）
 */

const FEEDBACK_CLASS =
  /\b(?:bg|text|border|ring)-state-(?:success|warning|error|info)(?:-10|-subtle)?(?:\/\d+)?/
const FEEDBACK_VAR = /var\(\s*--color-state-(?:success|warning|error|info)/

const MESSAGE =
  '反馈态请使用 canonical status-* token（如 text-status-error / bg-status-info-10 / var(--color-status-success)）。state-{success,warning,error,info} 是 legacy alias，禁止新写。'

function check(context, raw, node) {
  if (typeof raw !== 'string') return
  if (FEEDBACK_CLASS.test(raw) || FEEDBACK_VAR.test(raw)) {
    context.report({ node, message: MESSAGE })
  }
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow legacy feedback state-* tokens; use canonical status-* feedback tokens instead.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      Literal(node) {
        check(context, node.value, node)
      },
      TemplateElement(node) {
        check(context, node.value && node.value.raw, node)
      },
    }
  },
}
