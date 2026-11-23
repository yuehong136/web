/**
 * Tide guard: visual values come from design tokens.
 *
 * Flags, in string literals and template strings (className, cn(), class maps):
 *  - Tailwind palette colours: `bg-blue-500`, `dark:text-gray-400`, `from-purple-100/50`
 *  - arbitrary colour values: `bg-[#123456]`, `text-[rgb(0,0,0)]`, `border-[hsl(…)]`
 *  - gradients outside AI moments: `bg-linear-to-r …` unless the same string uses
 *    the AI gradient stops (`ai-from` / `ai-via` / `ai-to`); prefer the `bg-ai-tide` utility
 * and, in JSX text, emoji used as UI glyphs (icons come from lucide-react,
 * brand marks from ProviderLogo).
 *
 * Neutral `bg-black/50`-style scrims and `text-white` on tinted fills are not
 * palette colours and stay allowed. Generated report HTML and user-configured
 * widget colours are excluded in eslint.config.js.
 */

const PALETTE =
  /(?:^|[\s"'`:(])(?:[a-z0-9-]+:)*(?:bg|text|border(?:-[xytrblse])?|ring|outline|fill|stroke|from|via|to|divide|decoration|placeholder|caret|accent|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/
const ARBITRARY_COLOR =
  /(?:bg|text|border(?:-[xytrblse])?|ring|outline|fill|stroke|from|via|to|decoration|shadow)-\[(?:#|rgba?\(|hsla?\(|oklch\()/
const GRADIENT =
  /(?:^|[\s"'`:])(?:[a-z0-9-]+:)*bg-(?:linear|gradient|radial|conic)-/
const AI_TOKENS = /\bai-(?:from|via|to)\b/
const EMOJI = /\p{Extended_Pictographic}/u
// A lone 1px ring is a faint focus mark; fields that pair it with a focus
// border (the border-plus-ring field style) are the deliberate exception.
const THIN_FOCUS_RING = /(?:^|\s)focus-visible:ring-1(?![\w-])/
const FIELD_FOCUS_BORDER = /(?:^|\s)focus(?:-visible)?:border-/

const MESSAGES = {
  palette:
    'Use semantic tokens (text-fg-*, bg-surface, border-line, {intent}-soft/-fg) instead of Tailwind palette colours.',
  arbitrary:
    'Use design tokens instead of arbitrary colour values such as bg-[#…] or text-[rgb(…)].',
  gradient:
    'Gradients are reserved for AI moments: use bg-ai-tide, or build it from the ai-from / ai-via / ai-to tokens.',
  emoji:
    'Do not use emoji as UI glyphs: use lucide-react icons, ProviderLogo for brands, and i18n for copy.',
  focus:
    'Use the focus-ring (or focus-ring-inset) utility instead of a 1px focus ring.',
}

function checkClasses(context, raw, node) {
  if (typeof raw !== 'string' || raw.length < 4) return
  if (PALETTE.test(raw)) context.report({ node, message: MESSAGES.palette })
  else if (ARBITRARY_COLOR.test(raw))
    context.report({ node, message: MESSAGES.arbitrary })
  else if (GRADIENT.test(raw) && !AI_TOKENS.test(raw))
    context.report({ node, message: MESSAGES.gradient })
  else if (THIN_FOCUS_RING.test(raw) && !FIELD_FOCUS_BORDER.test(raw))
    context.report({ node, message: MESSAGES.focus })
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw palette colours, arbitrary colour values, non-AI gradients and emoji glyphs in UI code.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      Literal(node) {
        checkClasses(context, node.value, node)
      },
      TemplateElement(node) {
        checkClasses(context, node.value?.cooked, node)
      },
      JSXText(node) {
        if (EMOJI.test(node.value))
          context.report({ node, message: MESSAGES.emoji })
      },
    }
  },
}
