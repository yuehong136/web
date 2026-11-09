import ts from 'typescript'
import {
  flattenCatalog,
  pluralSuffix,
  readCatalog,
} from './i18n-catalog-quality.mjs'

/** Read translation references without importing application modules. */
export function translationUsages(file, source) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  const bindings = new Map()
  const usages = []
  const scopeOf = (node) => {
    for (let scope = node.parent; scope; scope = scope.parent)
      if (ts.isBlock(scope) || ts.isSourceFile(scope)) return scope
  }
  function bind(node) {
    // The tool-form wrapper returns t(`flow.${key}`).
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(tree) === 'useFlowLabel'
    ) {
      const scope = scopeOf(node)
      if (!bindings.has(scope)) bindings.set(scope, new Map())
      bindings.get(scope).set(node.name.text, 'flow')
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      /^(useTranslation|useTypedTranslation)$/u.test(
        node.initializer.expression.getText(tree),
      )
    ) {
      const call = node.initializer
      const prefix =
        call.expression.getText(tree) === 'useTypedTranslation'
          ? call.arguments[0]?.text
          : undefined
      const scope = scopeOf(node)
      if (!bindings.has(scope)) bindings.set(scope, new Map())
      for (const element of node.name.elements)
        if ((element.propertyName ?? element.name).getText(tree) === 't')
          bindings.get(scope).set(element.name.getText(tree), prefix ?? '')
    }
    ts.forEachChild(node, bind)
  }
  bind(tree)
  function translator(node) {
    const expression = node.expression
    if (
      ts.isPropertyAccessExpression(expression) &&
      expression.name.text === 't'
    )
      return ''
    if (!ts.isIdentifier(expression)) return undefined
    for (let scope = node; scope; scope = scope.parent) {
      const names = bindings.get(scope)
      if (names?.has(expression.text)) return names.get(expression.text)
    }
    // Helpers receive the standard translator as a parameter.
    return expression.text === 't' ? '' : undefined
  }
  function add(node, value, prefix = '') {
    let key
    if (ts.isStringLiteralLike(value)) key = value.text
    else if (ts.isTemplateExpression(value))
      key =
        value.head.text +
        value.templateSpans.map((span) => `*${span.literal.text}`).join('')
    if (!key || !key.replaceAll('*', '')) return
    usages.push({
      file,
      line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
      key: prefix ? `${prefix}.${key}` : key,
    })
  }
  function visit(node) {
    if (ts.isCallExpression(node) && node.arguments[0]) {
      const prefix = translator(node)
      if (prefix !== undefined) add(node, node.arguments[0], prefix)
    }
    if (
      ts.isPropertyAssignment(node) &&
      /^(titleKey|labelKey|descriptionKey|hintKey|i18nKey)$/u.test(
        node.name.getText(tree),
      )
    )
      add(node, node.initializer)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return usages
}

export function missingTranslationKeys(readSource, files) {
  const catalogs = ['en-US', 'zh-CN'].map((locale) => ({
    locale,
    keys: new Set(
      [
        ...flattenCatalog(
          readCatalog(readSource, `src/locales/${locale}/index.ts`),
        ).keys(),
      ].flatMap((key) => [key, key.replace(pluralSuffix, '')]),
    ),
  }))
  return files.flatMap((file) =>
    translationUsages(file, readSource(file) ?? '').flatMap((usage) => {
      const pattern = new RegExp(
        `^${usage.key
          .split('*')
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
          .join('.+')}$`,
      )
      return catalogs
        .filter(({ keys }) =>
          usage.key.includes('*')
            ? ![...keys].some((key) => pattern.test(key))
            : !keys.has(usage.key),
        )
        .map(({ locale }) => ({ ...usage, locale }))
    }),
  )
}
