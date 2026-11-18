import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { compile } from '@tailwindcss/node'
import { format, resolveConfig } from 'prettier'
import { generateTailwindThemeFiles } from '../tailwind-theme-generator'

const root = path.resolve(import.meta.dirname, '../../..')
const sourceRoot = path.join(root, 'src')
const themeRoot = path.join(sourceRoot, 'themes')
const compiler = readFile(path.join(sourceRoot, 'index.css'), 'utf8').then(
  (css) => compile(css, { base: sourceRoot, onDependency() {} }),
)

test('interface and Clay reading fonts work offline with explicit Chinese fallbacks', async () => {
  const [entry, appearance] = await Promise.all([
    readFile(path.join(sourceRoot, 'index.css'), 'utf8'),
    readFile(path.join(themeRoot, 'appearance.css'), 'utf8'),
  ])
  assert.doesNotMatch(entry, /@import\s+url\(['"]?https?:/u)
  assert.doesNotMatch(appearance, /@font-face|https?:\/\//u)
  assert.match(entry, /font-family: var\(--font-interface,/u)
  assert.match(
    appearance,
    /--font-interface:[^;]*system-ui[^;]*PingFang SC[^;]*Microsoft YaHei[^;]*Noto Sans CJK SC/su,
  )
  assert.match(
    appearance,
    /\[data-preset='clay'\][^}]*--font-reading:[^;]*Georgia[^;]*Noto Serif CJK SC[^;]*Songti SC[^;]*SimSun/su,
  )
  assert.match(
    appearance,
    /\[data-preset='clay'\][^}]*--reading-line-height: 1\.8/u,
  )
  assert.match(appearance, /--font-code:[^;]*ui-monospace[^;]*Consolas/su)
  // Preset radii live on [data-preset]; a root-level --radius elsewhere would
  // outrank them on <html> and pin every preset to one value.
  const styles = await Promise.all(
    ['reference.css', 'selection-controls.css'].map((name) =>
      readFile(path.join(sourceRoot, 'styles', name), 'utf8'),
    ),
  )
  for (const css of styles) assert.doesNotMatch(css, /--radius:/u)
  // Bundled Geist covers Latin in every scheme; Chinese falls back to system fonts.
  assert.match(
    appearance,
    /\[data-preset\] \{[^}]*--font-interface:[^;]*'Geist Variable'[^;]*PingFang SC[^;]*Microsoft YaHei[^;]*Noto Sans CJK SC/su,
  )
  assert.match(
    appearance,
    /\[data-density='comfortable'\] \{[^}]*--control-height: calc\(2rem/u,
  )
  const css = (await compiler).build(['font-sans', 'font-mono'])
  assert.match(css, /\.font-sans\s*\{\s*font-family: var\(--font-interface\)/u)
  assert.match(css, /\.font-mono\s*\{\s*font-family: var\(--font-code\)/u)
})

test('committed CSS token mappings reproduce from the canonical registry', async () => {
  const options = await resolveConfig(path.join(themeRoot, 'light.css'))
  for (const [filename, content] of Object.entries(
    generateTailwindThemeFiles(),
  )) {
    const filepath = path.join(themeRoot, filename)
    const expected = await format(content, {
      ...options,
      plugins: [],
      filepath,
    })
    assert.equal(await readFile(filepath, 'utf8'), expected)
    assert.ok(expected.split('\n').length <= 600, filename)
  }
})

test('semantic utilities preserve scoped runtime tokens and opacity modifiers', async () => {
  const css = (await compiler).build([
    'bg-surface',
    'text-fg',
    'border-line',
    'bg-accent-soft',
    'bg-primary/90',
    'ring-ring/50',
    'bg-danger-solid/20',
  ])
  assert.match(css, /background-color: var\(--color-surface\)/)
  assert.match(css, /color: var\(--color-fg\)/)
  assert.match(css, /border-color: var\(--color-line\)/)
  assert.match(css, /background-color: var\(--color-accent-soft\)/)
  assert.doesNotMatch(css, /::placeholder::placeholder/)
  assert.doesNotMatch(css, /--color-fg:\s*var\(--color-fg\)/)
  // Opacity modifiers mix the role itself; no RGB channel variables remain.
  assert.match(
    css,
    /color-mix\(in oklab, var\(--color-action-bg\) 90%, transparent\)/,
  )
  assert.match(
    css,
    /color-mix\(in oklab, var\(--color-line-focus\) 50%, transparent\)/,
  )
  assert.match(
    css,
    /color-mix\(in oklab, var\(--color-danger-solid\) 20%, transparent\)/,
  )
  assert.doesNotMatch(css, /--twc-/)
})

test('native spacing, radius, elevation and responsive variants compile', async () => {
  const css = (await compiler).build([
    'p-space-md',
    'gap-space-base',
    'rounded-radius-lg',
    'hover:shadow-elevation-low',
    'md:p-space-lg',
  ])
  assert.match(css, /padding: var\(--space-md\)/)
  assert.match(css, /gap: var\(--space-base\)/)
  assert.match(css, /border-radius: var\(--radius-lg\)/)
  // Elevation reads the theme's runtime level, so scoped themes get their own.
  assert.match(css, /--tw-shadow: var\(--elevation-low\)/)
  assert.match(css, /--elevation-low: 0 1px 3px/)
  assert.match(css, /@media \(width >= 48rem\)/)
  assert.match(css, /@media \(hover: hover\)/)
})

test('global base rules keep their cascade without a page stylesheet', async () => {
  const css = (await compiler).build(['line-clamp-1', 'line-clamp-2'])
  // Line clamps come from Tailwind's own utilities.
  for (const lines of [1, 2])
    assert.match(
      css,
      new RegExp(
        `\\.line-clamp-${lines} \\{\\s*overflow: hidden;\\s*display: -webkit-box;\\s*-webkit-box-orient: vertical;\\s*-webkit-line-clamp: ${lines};`,
        'u',
      ),
    )
  // The root size follows the appearance preset only.
  assert.match(css, /html\[data-preset\] \{\s*font-size: 100%;/u)
  assert.doesNotMatch(css, /--font-size|mcp-chat-page/u)
  // Class-level specificity keeps token borders above the forms plugin's
  // base input borders (element-level selectors).
  assert.match(css, /\*:not\(\.\\_\) \{\s*border-color: var\(--color-line\);/u)
})

test('dark utilities recognize both scoped data-theme and class mode', async () => {
  const css = (await compiler).build(['dark:bg-surface'])
  assert.match(css, /\.dark/)
  assert.match(css, /\[data-theme='dark'\]/)
  assert.match(css, /background-color: var\(--color-surface\)/)
})

test('typography, forms, scrollbar plugins and native container queries compile', async () => {
  const css = (await compiler).build([
    'prose',
    'form-input',
    'scrollbar-thin',
    '@container',
    '@sm:flex',
  ])
  assert.match(css, /\.prose/)
  assert.match(css, /\.form-input/)
  assert.match(css, /scrollbar-width: thin/)
  assert.match(css, /container-type: inline-size/)
  assert.match(css, /@container \(width >= 24rem\)/)
})

test('native choice controls override forms defaults with scoped selection colors', async () => {
  const css = (await compiler).build(['form-checkbox', 'form-radio'])
  assert.match(css, /accent-color: var\(--color-accent-solid\)/)
  assert.match(css, /accent-color: var\(--color-accent-solid\)/)
  assert.match(css, /accent-color: var\(--color-accent-solid\)/)
  assert.match(css, /background-color: var\(--color-accent-solid\)/)
  assert.match(css, /background-color: var\(--color-accent-solid\)/)
  assert.match(css, /--tw-ring-offset-color: var\(--color-surface\)/)
  assert.ok(
    css.lastIndexOf('--tw-ring-color: var(--color-line-focus)') >
      css.indexOf('.form-checkbox:focus'),
    'selection focus colors must override the forms plugin defaults',
  )
})

test('text fields replace the forms plugin palette with roles', async () => {
  const css = (await compiler).build([])
  // The plugin's defaults stay in the output (its blue-600 ring among them).
  // The overrides win on specificity, not order: :is([type='text'], …) is
  // (0,1,0) against the plugin's input:where([type='text']) at (0,0,1).
  assert.match(css, /--tw-ring-color: oklch\(54\.6% 0\.245 262\.881\)/)
  assert.match(
    css,
    /&:focus \{\s*--tw-ring-color: var\(--color-line-focus\);\s*--tw-ring-offset-color: var\(--color-surface\);\s*border-color: var\(--color-line-focus\)/,
  )
  assert.match(css, /::placeholder \{\s*color: var\(--color-fg-subtle\)/)
  assert.match(
    css,
    /:is\(\s*\[type='text'\][\s\S]*?\) \{\s*background-color: var\(--color-surface\);\s*border-color: var\(--color-line\)/,
  )
  assert.match(
    css,
    /\*,\s*::before,\s*::after \{\s*--tw-ring-offset-color: var\(--color-surface\)/,
  )
})

test('selected input text and options compile independently of action colors', async () => {
  const css = (await compiler).build([
    'selection:bg-accent-solid',
    'selection:text-accent-on-solid',
    'data-[state=checked]:bg-accent-soft',
    'data-[state=checked]:text-accent-fg',
    'bg-action-bg',
  ])
  assert.match(css, /background-color: var\(--color-accent-solid\)/)
  assert.match(css, /color: var\(--color-accent-on-solid\)/)
  assert.match(css, /background-color: var\(--color-accent-soft\)/)
  assert.match(css, /color: var\(--color-accent-fg\)/)
  assert.match(css, /background-color: var\(\s*--color-action-bg\s*\)/)
})

test('independent component CSS can apply utilities without duplicating the theme', async () => {
  const base = path.join(sourceRoot, 'styles')
  const css = `@reference '../index.css';
.hover-lift {
  @apply transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg;
}
.smooth-transition {
  @apply transition-all duration-200 ease-in-out;
}
`
  const result = await compile(css, { base, onDependency() {} })
  const output = result.build([])
  assert.match(output, /transition/)
  assert.match(output, /translate/)
  assert.doesNotMatch(output, /--twc-primary:/)
  assert.doesNotMatch(output, /\.prose/)
})

test('application reset stays in a lower cascade layer than semantic button colors', async () => {
  const result = await compile(
    '@import "./styles/application-reset.css";\n@import "./index.css";',
    { base: sourceRoot, onDependency() {} },
  )
  const css = result.build(['text-action-fg'])
  assert.match(css, /@layer reset, theme, base, components, utilities;/)
  assert.match(css, /@layer reset \{[\s\S]*?input,[\s\S]*?color: inherit;/)
  assert.match(
    css,
    /\.text-action-fg \{\s*color: var\(\s*--color-action-fg\s*\)/,
  )
})
