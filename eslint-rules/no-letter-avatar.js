/**
 * Tide guard: letter avatars come from EntityAvatar.
 *
 * Flags the first character of a value turned upper-case:
 *   name.charAt(0).toUpperCase()        name[0]?.toUpperCase()
 *   name.slice(0, 1).toUpperCase()      name.substring(0, 1).toLocaleUpperCase()
 *   Array.from(name)[0].toUpperCase()   name.at(0)?.toUpperCase()
 *
 * EntityAvatar (src/components/patterns/entity-avatar.tsx) owns monograms:
 * grapheme-safe initials, avatar tones, kind glyph fallbacks. Brand marks use
 * ProviderLogo. eslint.config.js scopes the rule to .tsx, so a non-UI .ts
 * helper that capitalises a word (`s.charAt(0).toUpperCase() + s.slice(1)`)
 * is not reported; move such helpers to a .ts module.
 */

const UPPER = new Set(['toUpperCase', 'toLocaleUpperCase'])
const MESSAGE =
  'Do not hand-roll letter avatars: use EntityAvatar (src/components/patterns/entity-avatar.tsx) for monograms and ProviderLogo for brand marks. Capitalisation helpers belong in a .ts module.'

const unwrap = (node) => {
  while (
    node?.type === 'ChainExpression' ||
    node?.type === 'TSNonNullExpression'
  )
    node = node.expression
  return node
}

const methodName = (member) =>
  member?.type === 'MemberExpression' &&
  !member.computed &&
  member.property.type === 'Identifier'
    ? member.property.name
    : undefined

const isNumber = (node, value) =>
  node?.type === 'Literal' && node.value === value

/** `x[0]`, `x.charAt(0)`, `x.at(0)`, `x.slice(0, 1)`, `x.substring(0, 1)`. */
function firstCharacter(node) {
  node = unwrap(node)
  if (node?.type === 'MemberExpression')
    return node.computed && isNumber(node.property, 0)
  if (node?.type !== 'CallExpression') return false
  const name = methodName(unwrap(node.callee))
  const args = node.arguments
  if (name === 'charAt' || name === 'at')
    return args.length === 1 && isNumber(args[0], 0)
  if (name === 'slice' || name === 'substring')
    return args.length === 2 && isNumber(args[0], 0) && isNumber(args[1], 1)
  return false
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hand-rolled letter avatars (first character upper-cased); use EntityAvatar.',
    },
    schema: [],
    messages: {},
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = unwrap(node.callee)
        if (UPPER.has(methodName(callee)) && firstCharacter(callee.object))
          context.report({ node, message: MESSAGE })
      },
    }
  },
}
