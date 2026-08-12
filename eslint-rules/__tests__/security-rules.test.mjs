import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Linter } from 'eslint'
import noImperativeHtml from '../no-imperative-html.js'
import noSensitiveDataInConsole from '../no-sensitive-data-in-console.js'
import noRestrictedDynamicImport from '../no-restricted-dynamic-import.js'

function verify(ruleName, rule, code) {
  const linter = new Linter({ configType: 'flat' })
  return linter.verify(code, {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    plugins: { security: { rules: { [ruleName]: rule } } },
    rules: { [`security/${ruleName}`]: 'error' },
  })
}

function verifyDynamicImport(code) {
  const linter = new Linter({ configType: 'flat' })
  return linter.verify(code, {
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    plugins: {
      boundaries: {
        rules: { 'no-restricted-dynamic-import': noRestrictedDynamicImport },
      },
    },
    rules: {
      'boundaries/no-restricted-dynamic-import': [
        'error',
        {
          disallowNodeBuiltins: true,
          packages: ['electron', 'react'],
          patterns: ['(^|/)desktop(/|$)'],
        },
      ],
    },
  })
}

function assertRuleViolation(ruleName, rule, code) {
  assert.deepEqual(
    verify(ruleName, rule, code).map((message) => message.ruleId),
    [`security/${ruleName}`],
    code,
  )
}

test('no-sensitive-data-in-console rejects credential values and labels', () => {
  const invalid = [
    'console.log(access_token)',
    'console.warn({ apiKey })',
    "console.log('Full login response:', response)",
    "console.error('Registration result:', response)",
    "window.console.info('Authentication payload:', value)",
    "globalThis.console.log('token:', value)",
    "console.debug('Extracted token:', accessToken.substring(0, 20))",
    'console.log(getToken())',
    'console.warn(config.clientSecret)',
    'console.warn(config.app_secret)',
    'console.warn(config.privateKey)',
    'console.warn(config.bearerToken)',
    'console.warn(config.aws_secret_access_key)',
    'console.warn(config.imap_password)',
  ]

  for (const code of invalid) {
    assertRuleViolation(
      'no-sensitive-data-in-console',
      noSensitiveDataInConsole,
      code,
    )
  }

  assert.deepEqual(
    verify(
      'no-sensitive-data-in-console',
      noSensitiveDataInConsole,
      "console.error('request failed', error); console.info('token count', tokenCount); console.log('setting token count', tokenCount); console.log('编辑 API Key:', { id, name }); console.log({ auth: false, password: 0 }); console.debug(designToken)",
    ),
    [],
  )
})

test('no-imperative-html rejects HTML sinks but permits container clearing', () => {
  const invalid = [
    'node.innerHTML = message',
    "node['innerHTML'] += fragment",
    'node.outerHTML = markup',
    "node.insertAdjacentHTML('beforeend', markup)",
    'document.write(markup)',
    'window.document.write(markup)',
    'globalThis.document.writeln(markup)',
  ]

  for (const code of invalid) {
    assertRuleViolation('no-imperative-html', noImperativeHtml, code)
  }

  assert.deepEqual(
    verify(
      'no-imperative-html',
      noImperativeHtml,
      "node.innerHTML = ''; node.textContent = message; node.replaceChildren(child)",
    ),
    [],
  )
})

test('no-restricted-dynamic-import mirrors static trust boundaries', () => {
  for (const code of [
    "import('node:fs')",
    "import('electron/renderer')",
    "import('react/jsx-runtime')",
    "import('../../desktop/electron/main')",
    'import(runtimeSpecifier)',
  ]) {
    assert.deepEqual(
      verifyDynamicImport(code).map((message) => message.ruleId),
      ['boundaries/no-restricted-dynamic-import'],
      code,
    )
  }

  assert.deepEqual(
    verifyDynamicImport("import('./feature'); import('mermaid')"),
    [],
  )
})
