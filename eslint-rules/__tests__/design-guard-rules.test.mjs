import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import noDirectAntdImport from '../no-direct-antd-import.js'
import noLetterAvatar from '../no-letter-avatar.js'
import noRawVisualValues from '../no-raw-visual-values.js'
import noRawMotion from '../no-raw-motion.js'

const rules = {
  'no-raw-visual-values': noRawVisualValues,
  'no-direct-antd-import': noDirectAntdImport,
  'no-letter-avatar': noLetterAvatar,
  'no-raw-motion': noRawMotion,
}

function lint(code, rule = 'no-raw-visual-values', options = []) {
  const linter = new Linter({ configType: 'flat' })
  return linter
    .verify(code, {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { design: { rules } },
      rules: { [`design/${rule}`]: ['error', ...options] },
    })
    .map((message) => message.message)
}

const verify = (code) => lint(code)

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

test('no-direct-antd-import rejects antd imports, re-exports, dynamic imports and require', () => {
  for (const code of [
    "import { Modal } from 'antd'",
    "import type { ThemeConfig } from 'antd'",
    "import * as antd from 'antd'",
    "import 'antd/dist/reset.css'",
    "import zhCN from 'antd/locale/zh_CN'",
    "import Button from 'antd/es/button'",
    "export { Input } from 'antd'",
    "export * from 'antd'",
    "const m = await import('antd')",
    'const m = await import(`antd/es/modal`)',
    "const { message } = require('antd')",
  ]) {
    assert.equal(lint(code, 'no-direct-antd-import').length, 1, code)
  }
})

test('no-direct-antd-import allows antd-x, other packages and lookalike names', () => {
  assert.deepEqual(
    lint(
      [
        "import { Conversations, XProvider } from '@ant-design/x'",
        "import xZhCN from '@ant-design/x/locale/zh_CN'",
        "import { XMarkdown } from '@ant-design/x-markdown'",
        "import { StyleProvider } from '@ant-design/cssinjs'",
        "import { Dialog } from '@/components/ui/dialog'",
        "import antdTheme from '@/lib/antd-theme'",
        "import something from 'antd-mobile-lookalike'",
        "export { Button } from './antd'",
      ].join('\n'),
      'no-direct-antd-import',
    ),
    [],
  )
})

test('no-direct-antd-import `allow` covers only the listed named imports from antd', () => {
  const allow = [{ allow: ['Watermark'] }]
  assert.deepEqual(
    lint("import { Watermark } from 'antd'", 'no-direct-antd-import', allow),
    [],
  )
  assert.deepEqual(
    lint(
      "import { type WatermarkProps, Watermark } from 'antd'",
      'no-direct-antd-import',
      [{ allow: ['Watermark', 'WatermarkProps'] }],
    ),
    [],
  )
  for (const code of [
    "import { Watermark, Modal } from 'antd'",
    "import * as antd from 'antd'",
    "import Watermark from 'antd/es/watermark'",
    "const m = await import('antd')",
  ]) {
    assert.equal(lint(code, 'no-direct-antd-import', allow).length, 1, code)
  }
})

test('no-letter-avatar rejects a first character turned upper-case', () => {
  for (const code of [
    'const a = <span>{name.charAt(0).toUpperCase()}</span>',
    'const b = name[0]?.toUpperCase()',
    'const c = name?.[0]?.toLocaleUpperCase()',
    'const d = name.slice(0, 1).toUpperCase()',
    "const e = name.substring(0, 1).toLocaleUpperCase('tr')",
    'const f = Array.from(name)[0].toUpperCase()',
    'const g = [...name][0].toUpperCase()',
    'const h = (user.name ?? "")\n  .charAt(0)\n  .toUpperCase()',
    'const i = name.at(0)?.toUpperCase()',
    'const j = name[0]!.toUpperCase()',
    'const k = (name?.[0])?.toUpperCase()',
  ]) {
    assert.equal(lint(code, 'no-letter-avatar').length, 1, code)
  }
})

test('no-letter-avatar allows whole-string casing and other indexes', () => {
  assert.deepEqual(
    lint(
      [
        'const a = method.toUpperCase()',
        "const b = file.name.split('.').pop()?.toUpperCase()",
        'const c = name.slice(0, 2).toUpperCase()',
        'const d = name.slice(1).toLowerCase()',
        'const e = name[1].toUpperCase()',
        'const f = name.charAt(0).toLowerCase()',
        'const g = name.charAt(0)',
        'const h = items[0].label',
        'const i = <EntityAvatar name={name} />',
      ].join('\n'),
      'no-letter-avatar',
    ),
    [],
  )
})

test('no-raw-motion rejects bare durations, raw easing and reduced-motion checks that skip the app setting', () => {
  for (const code of [
    'const a = <div className="transition-colors duration-150" />',
    "const b = cn('hover:duration-300 opacity-0')",
    "const c = 'transition ease-[cubic-bezier(0.2,0,0,1)]'",
    "const d = window.matchMedia('(prefers-reduced-motion: reduce)').matches",
    'const e = matchMedia(`(prefers-reduced-motion: reduce)`)',
    "import { useReducedMotion } from 'motion/react'",
  ]) {
    assert.equal(lint(code, 'no-raw-motion').length, 1, code)
  }
})

test('no-raw-motion allows motion tokens, named easing and other media queries', () => {
  assert.deepEqual(
    lint(
      [
        "const a = 'transition-colors duration-(--motion-fast) ease-(--ease-out)'",
        "const b = 'data-[state=open]:animate-in ease-out delay-150'",
        "const c = { duration: 150, label: 'duration-picker' }",
        "const d = window.matchMedia('(prefers-color-scheme: dark)')",
        "import { useSpring, MotionConfig } from 'motion/react'",
      ].join('\n'),
      'no-raw-motion',
    ),
    [],
  )
})

test('no-raw-visual-values asks for focus-ring instead of a lone 1px focus ring', () => {
  assert.equal(
    verify(
      "const a = 'rounded focus-visible:ring-1 focus-visible:ring-line-focus'",
    ).length,
    1,
  )
  // Fields pair the thin ring with a focus border on purpose.
  assert.deepEqual(
    verify(
      "const b = 'border focus:border-line-focus focus-visible:ring-1 focus-visible:ring-line-focus'",
    ),
    [],
  )
  assert.deepEqual(verify("const c = 'focus-ring focus-ring-inset'"), [])
})
