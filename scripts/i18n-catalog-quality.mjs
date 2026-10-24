import path from 'node:path'
import ts from 'typescript'

/** Read-only literal evaluation: catalog code is never imported or executed. */
export function readCatalog(readSource, entry) {
  const modules = new Map()
  function readModule(file) {
    if (modules.has(file)) return modules.get(file)
    const source = readSource(file)
    const exports = {}
    modules.set(file, exports)
    if (source === undefined) return exports
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    const locals = new Map()
    const imports = new Map()
    for (const statement of tree.statements) {
      if (ts.isImportDeclaration(statement) && statement.importClause) {
        const importedFile = path.posix.normalize(
          path.posix.join(
            path.posix.dirname(file),
            `${statement.moduleSpecifier.text}.ts`,
          ),
        )
        if (statement.importClause.name)
          imports.set(statement.importClause.name.text, [
            importedFile,
            'default',
          ])
        const bindings = statement.importClause.namedBindings
        if (bindings && ts.isNamedImports(bindings)) {
          for (const item of bindings.elements)
            imports.set(item.name.text, [
              importedFile,
              (item.propertyName ?? item.name).text,
            ])
        }
      }
      if (ts.isVariableStatement(statement)) {
        for (const item of statement.declarationList.declarations) {
          if (ts.isIdentifier(item.name) && item.initializer)
            locals.set(item.name.text, item.initializer)
        }
      }
    }
    function evaluate(node) {
      if (!node) return undefined
      if (
        ts.isAsExpression(node) ||
        ts.isSatisfiesExpression(node) ||
        ts.isParenthesizedExpression(node)
      )
        return evaluate(node.expression)
      if (ts.isStringLiteralLike(node)) return node.text
      if (node.kind === ts.SyntaxKind.NullKeyword) return null
      if (ts.isNumericLiteral(node)) return Number(node.text)
      if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate)
      if (ts.isIdentifier(node)) {
        const reference = imports.get(node.text)
        if (reference) return readModule(reference[0])[reference[1]]
        return evaluate(locals.get(node.text))
      }
      if (ts.isObjectLiteralExpression(node)) {
        const result = {}
        for (const property of node.properties) {
          if (ts.isSpreadAssignment(property))
            Object.assign(result, evaluate(property.expression))
          else if (ts.isPropertyAssignment(property))
            result[property.name.text] = evaluate(property.initializer)
          else if (ts.isShorthandPropertyAssignment(property))
            result[property.name.text] = evaluate(property.name)
        }
        return result
      }
      return undefined
    }
    for (const statement of tree.statements) {
      if (ts.isExportAssignment(statement))
        exports.default = evaluate(statement.expression)
      if (
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some(
          (item) => item.kind === ts.SyntaxKind.ExportKeyword,
        )
      ) {
        for (const item of statement.declarationList.declarations) {
          if (ts.isIdentifier(item.name))
            exports[item.name.text] = evaluate(item.initializer)
        }
      }
    }
    return exports
  }
  return readModule(entry).default ?? {}
}

export function flattenCatalog(value, prefix = '', result = new Map()) {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value))
      flattenCatalog(child, prefix ? `${prefix}.${key}` : key, result)
  } else result.set(prefix, value)
  return result
}

export const pluralSuffix = /_(zero|one|two|few|many|other)$/u
export const interpolationNames = (text) =>
  [
    ...new Set(
      [...String(text).matchAll(/\{\{\s*-?\s*([^},]+)(?:,[^}]*)?\}\}/gu)].map(
        (match) => match[1].trim(),
      ),
    ),
  ].sort()

export function checkCatalogPair(english, chinese) {
  const catalogs = {
    'en-US': flattenCatalog(english),
    'zh-CN': flattenCatalog(chinese),
  }
  const findings = []
  const add = (rule, key, detail) =>
    findings.push({
      rule,
      key,
      detail,
      fingerprint: `${rule}:${key}:${detail}`,
    })
  const allKeys = new Set(
    Object.values(catalogs).flatMap((catalog) => [...catalog.keys()]),
  )
  const groups = new Set(
    [...allKeys].map((key) => key.replace(pluralSuffix, '')),
  )
  for (const [locale, catalog] of Object.entries(catalogs)) {
    for (const [key, value] of catalog) {
      if (typeof value !== 'string' || !value.trim())
        add('empty-value', key, locale)
      if (key.endsWith('_plural')) add('legacy-plural', key, locale)
    }
  }
  for (const key of groups) {
    const isPlural = [...allKeys].some(
      (candidate) =>
        candidate !== key && candidate.replace(pluralSuffix, '') === key,
    )
    if (isPlural && catalogs['en-US'].has(key) !== catalogs['zh-CN'].has(key)) {
      add('missing-key', key, catalogs['en-US'].has(key) ? 'zh-CN' : 'en-US')
    }
    const interpolation = {}
    for (const [locale, catalog] of Object.entries(catalogs)) {
      const forms = isPlural
        ? [...catalog.keys()].filter(
            (candidate) =>
              candidate !== key && candidate.replace(pluralSuffix, '') === key,
          )
        : catalog.has(key)
          ? [key]
          : []
      if (forms.length === 0) add('missing-key', key, locale)
      if (isPlural) {
        for (const category of new Intl.PluralRules(locale).resolvedOptions()
          .pluralCategories) {
          if (!catalog.has(`${key}_${category}`))
            add('missing-plural', key, `${locale}:${category}`)
        }
      }
      interpolation[locale] = [
        ...new Set(
          forms.flatMap((form) => interpolationNames(catalog.get(form))),
        ),
      ]
        .sort()
        .join(',')
      if (isPlural) {
        const tokens = forms.map((form) =>
          interpolationNames(catalog.get(form))
            .filter((token) => token !== 'count')
            .join(','),
        )
        if (new Set(tokens).size > 1)
          add('plural-interpolation', key, `${locale}:${tokens.join('|')}`)
      }
    }
    if (interpolation['en-US'] !== interpolation['zh-CN'])
      add(
        'interpolation',
        key,
        `${interpolation['en-US']}|${interpolation['zh-CN']}`,
      )
  }
  return findings
}

export function catalogFindings(readSource) {
  return checkCatalogPair(
    readCatalog(readSource, 'src/locales/en-US/index.ts'),
    readCatalog(readSource, 'src/locales/zh-CN/index.ts'),
  )
}
