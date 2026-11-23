/**
 * Tide guard: motion comes from the motion tokens.
 *
 * Flags, in string literals and template strings (className, cn(), class maps):
 *  - bare Tailwind durations: `duration-150`, `hover:duration-300`; use
 *    `duration-(--motion-fast|menu|panel|page)` so reduced motion can zero them
 *  - arbitrary easing curves: `ease-[cubic-bezier(…)]`, or a `cubic-bezier(`
 *    inside a class string; use `ease-(--ease-out|in|in-out|spring)` or `ease-out`
 * and, in code, the two ways JS motion skipped the in-app "Reduce motion"
 * setting: `matchMedia('(prefers-reduced-motion…)')` and motion's
 * `useReducedMotion`, which read only the system preference. Use
 * useReducedMotionPreference / prefersReducedMotion from `@/themes` instead.
 */

const RAW_DURATION = /(?:^|[\s"'`:(])(?:[a-z0-9-]+:)*duration-\d+(?![\w-])/
const RAW_EASE = /(?:^|[\s"'`:(])(?:[a-z0-9-]+:)*ease-\[|cubic-bezier\(/
const CLASS_LIKE = /(?:^|\s)[a-z0-9:[\]()-]+(?:\s|$)/
const REDUCED_QUERY = /prefers-reduced-motion/

const MESSAGES = {
  duration:
    'Use a motion token, duration-(--motion-fast|--motion-menu|--motion-panel|--motion-page), instead of a bare duration.',
  ease: 'Use an easing token, ease-(--ease-out|--ease-in|--ease-in-out|--ease-spring), instead of a raw cubic-bezier.',
  query:
    "Read reduced motion from '@/themes' (useReducedMotionPreference, prefersReducedMotion): querying prefers-reduced-motion misses the in-app setting.",
  motionHook:
    "motion's useReducedMotion reads only the system preference; use useReducedMotionPreference from '@/themes'.",
}

function checkClasses(context, raw, node) {
  if (typeof raw !== 'string' || raw.length < 6 || !CLASS_LIKE.test(raw)) return
  if (RAW_DURATION.test(raw))
    context.report({ node, message: MESSAGES.duration })
  else if (RAW_EASE.test(raw)) context.report({ node, message: MESSAGES.ease })
}

const isMatchMedia = (callee) =>
  (callee.type === 'Identifier' && callee.name === 'matchMedia') ||
  (callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'matchMedia')

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow bare durations, raw easing curves and reduced-motion checks that bypass the app setting.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      Literal(node) {
        if (node.parent?.type === 'ImportDeclaration') return
        checkClasses(context, node.value, node)
      },
      TemplateElement(node) {
        checkClasses(context, node.value?.cooked, node)
      },
      CallExpression(node) {
        if (!isMatchMedia(node.callee)) return
        const [query] = node.arguments
        const text =
          query?.type === 'Literal'
            ? query.value
            : query?.type === 'TemplateLiteral'
              ? query.quasis.map((part) => part.value.cooked).join('')
              : null
        if (typeof text === 'string' && REDUCED_QUERY.test(text))
          context.report({ node, message: MESSAGES.query })
      },
      ImportDeclaration(node) {
        if (!String(node.source.value).startsWith('motion')) return
        for (const specifier of node.specifiers)
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.name === 'useReducedMotion'
          )
            context.report({ node: specifier, message: MESSAGES.motionHook })
      },
    }
  },
}
