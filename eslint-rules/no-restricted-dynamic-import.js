import { isBuiltin } from 'node:module'

function isPackageOrSubpath(specifier, packageName) {
  return specifier === packageName || specifier.startsWith(`${packageName}/`)
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep dynamic imports inside the same trust boundaries as static imports.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          disallowNodeBuiltins: { type: 'boolean' },
          packages: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          patterns: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      nonLiteral:
        'Dynamic import specifiers must be string literals at this trust boundary.',
      restricted:
        'Dynamic import of "{{specifier}}" crosses this module trust boundary.',
    },
  },
  create(context) {
    const options = context.options[0] ?? {}
    const packages = options.packages ?? []
    const patterns = (options.patterns ?? []).map(
      (pattern) => new RegExp(pattern),
    )

    return {
      ImportExpression(node) {
        if (
          node.source.type !== 'Literal' ||
          typeof node.source.value !== 'string'
        ) {
          context.report({ node, messageId: 'nonLiteral' })
          return
        }

        const specifier = node.source.value
        const restricted =
          (options.disallowNodeBuiltins && isBuiltin(specifier)) ||
          packages.some((packageName) =>
            isPackageOrSubpath(specifier, packageName),
          ) ||
          patterns.some((pattern) => pattern.test(specifier))

        if (restricted) {
          context.report({
            node,
            messageId: 'restricted',
            data: { specifier },
          })
        }
      },
    }
  },
}
