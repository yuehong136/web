/**
 * Tide guard: Ant Design primitives come through src/components/ui/**.
 *
 * Flags static imports, re-exports, dynamic `import()` and `require()` of
 * `antd` and its subpaths (`antd/es/…`, `antd/locale/…`). `@ant-design/x*`
 * and other `@ant-design/*` packages are separate packages and stay allowed.
 *
 * Option `{ allow: ['Watermark'] }` permits those named imports (and type-only
 * imports of them) for the files the option is configured on. Default,
 * namespace and side-effect imports are never covered by `allow`. The
 * allowlist itself lives in eslint.config.js, with the reason for each entry.
 */

const ANTD = /^antd(?:\/|$)/
const MESSAGE =
  "Import Ant Design through src/components/ui/** primitives instead of 'antd'. If ui/ has no equivalent, add the file to the design-guard antd allowlist in eslint.config.js with a reason."

const sourceOf = (node) =>
  node?.type === 'Literal' && typeof node.value === 'string'
    ? node.value
    : node?.type === 'TemplateLiteral' && node.expressions.length === 0
      ? node.quasis[0].value.cooked
      : undefined

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow direct 'antd' imports outside the allowlisted theme bridge and vendor-only components.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {},
  },
  create(context) {
    const allowed = new Set(context.options[0]?.allow ?? [])
    const check = (node, source) => {
      if (typeof source === 'string' && ANTD.test(source))
        context.report({ node, message: MESSAGE })
    }
    const importedName = (specifier) =>
      specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : specifier.imported.value

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (!ANTD.test(source)) return
        const covered =
          source === 'antd' &&
          node.specifiers.length > 0 &&
          node.specifiers.every(
            (specifier) =>
              specifier.type === 'ImportSpecifier' &&
              allowed.has(importedName(specifier)),
          )
        if (!covered) context.report({ node, message: MESSAGE })
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value)
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value)
      },
      ImportExpression(node) {
        check(node, sourceOf(node.source))
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1
        )
          check(node, sourceOf(node.arguments[0]))
      },
    }
  },
}
