import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Linter } from 'eslint'
import noRawVisualValues from '../no-raw-visual-values.js'

function verify(code) {
  const linter = new Linter({ configType: 'flat' })
  return linter
    .verify(code, {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: {
        design: { rules: { 'no-raw-visual-values': noRawVisualValues } },
      },
      rules: { 'design/no-raw-visual-values': 'error' },
    })
    .map((message) => message.message)
}

test('no-raw-visual-values rejects palette colours, raw colour values, plain gradients and emoji glyphs', () => {
  for (const code of [
    'const a = <div className="rounded bg-blue-500" />',
    "const b = cn('dark:text-gray-400', active && 'p-2')",
    'const c = { prod: "bg-red-500" }',
    'const d = `border-purple-100/50 ${x}`',
    'const e = <span className="text-[#ff0000]" />',
    "const f = 'bg-[rgba(0,0,0,0.4)]'",
    'const g = <div className="bg-linear-to-br from-blue-100 to-purple-100" />',
    "const h = 'bg-linear-to-r from-background-subtle to-transparent'",
    'const i = <button>🛠️ Tools</button>',
  ]) {
    assert.equal(verify(code).length, 1, code)
  }
})

test('no-raw-visual-values allows tokens, scrims, AI gradients and plain text', () => {
  assert.deepEqual(
    verify(
      [
        'const a = <div className="bg-background-surface text-text-primary border-border-subtle" />',
        "const b = cn('bg-status-error-subtle text-status-error', 'bg-components-avatar-3-bg')",
        "const c = 'bg-black/50 text-white'",
        "const d = 'bg-ai-tide text-shimmer ai-glow'",
        "const e = 'bg-linear-to-r from-components-ai-from to-components-ai-to'",
        'const f = <p>Hello · 你好 — 1/2</p>',
        "const g = 'text-sm text-text-tertiary tabular-nums'",
        "const h = 'background: blue-500 is just prose'",
      ].join('\n'),
    ),
    [],
  )
})
