/**
 * 禁止新写「反馈态」legacy `state-*` 设计 token —— 反馈/意图色一律用 canonical `status-*`。
 *
 * 两条独立语义轴（见 src/themes/design-system.md「状态令牌：两条语义轴」）：
 *  - 反馈/意图色 (feedback)  → status-{success,warning,error,info}（含 -10 / -subtle）  ← 本规则强制
 *  - 交互态     (interactive) → state-{hover,active,focus,disabled,loading}              ← 本规则不管
 *
 * `state-{success,warning,error,info}`（含 -10 / -subtle）历史上是 `status-*` 的等值 legacy alias，
 * 现已物理删除（见 docs/design-tokens/2026-05-20-feedback-state-alias-deprecate-summary.md）；禁止任何形式复活。
 *
 * 命中以下形式（字符串字面量 / 模板字符串，覆盖 className、cn()、config 常量、readCssVar() 等）：
 *  - class：(bg|text|border|ring)-state-(success|warning|error|info)(-10|-subtle)?(/\d+)?
 *  - CSS var：var(--color-state-(success|warning|error|info)...)
 *  - 裸 token / 拼接：'state-success'、readCssVar('state-info')、`state-${x}` 等（FEEDBACK_BARE 兜底，
 *    名单固定为 4 个反馈名，故同时覆盖上面的 class 形式）
 *
 * 刻意不命中（避免误伤）：
 *  - 交互态 state-hover/active/focus/disabled/loading（含 state-focus-10/-subtle）—— 不在反馈名单内
 *  - state-neutral / state-neutral-10（中性灰）
 *  - 基础语义键 text-success/border-success 等（无 `-state-`/`state-` 反馈段，自然不匹配）
 *  - status-*（canonical）—— `status` 内不含 `state` 子串
 *  - data-viz-categorical-*（mindmap 分类调色板）—— 无 `state-` 段
 *  - src/themes/** 下的 token 定义（在 eslint.config.js 中通过 ignores 排除）
 */

const FEEDBACK_CLASS =
  /\b(?:bg|text|border|ring)-state-(?:success|warning|error|info)(?:-10|-subtle)?(?:\/\d+)?/
const FEEDBACK_VAR = /var\(\s*--color-state-(?:success|warning|error|info)/
// 裸 token / 拼接形式（mindmap 已迁至 data-viz-categorical-*，不再豁免）。名单固定为 4 个反馈名，
// 交互态 state-focus/hover/... 与中性 state-neutral 不在内，零误伤。
const FEEDBACK_BARE = /\bstate-(?:success|warning|error|info)(?:-10|-subtle)?\b/

const MESSAGE =
  '反馈态请使用 canonical status-* token（如 text-status-error / bg-status-info-10 / var(--color-status-success)）。state-{success,warning,error,info} 反馈 alias 已删除，禁止以任何形式复活。'

function check(context, raw, node) {
  if (typeof raw !== 'string') return
  if (
    FEEDBACK_CLASS.test(raw) ||
    FEEDBACK_VAR.test(raw) ||
    FEEDBACK_BARE.test(raw)
  ) {
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
