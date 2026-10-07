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
    'bg-background-surface',
    'text-text-primary',
    'border-border-default',
    'bg-primary/90',
    'ring-ring/50',
  ])
  assert.match(css, /background-color: var\(--color-background-surface\)/)
  assert.match(css, /color: var\(--color-text-primary\)/)
  assert.match(css, /border-color: var\(--color-border-default\)/)
  assert.doesNotMatch(css, /::placeholder::placeholder/)
  assert.doesNotMatch(
    css,
    /--color-text-primary:\s*var\(--color-text-primary\)/,
  )
  assert.match(
    css,
    /color-mix\(in oklab, rgb\(var\(--twc-primary\)\) 90%, transparent\)/,
  )
  assert.match(
    css,
    /color-mix\(in oklab, rgb\(var\(--twc-ring\)\) 50%, transparent\)/,
  )
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
  assert.match(css, /--tw-shadow: 0 1px 2px/)
  assert.match(css, /@media \(width >= 48rem\)/)
  assert.match(css, /@media \(hover: hover\)/)
})

test('dark utilities recognize both scoped data-theme and class mode', async () => {
  const css = (await compiler).build(['dark:bg-background-surface'])
  assert.match(css, /\.dark/)
  assert.match(css, /\[data-theme='dark'\]/)
  assert.match(css, /background-color: var\(--color-background-surface\)/)
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
  assert.match(
    css,
    /accent-color: var\(--color-components-checkbox-bg-checked\)/,
  )
  assert.match(css, /accent-color: var\(--color-components-radio-dot\)/)
  assert.match(css, /accent-color: var\(--color-components-slider-range\)/)
  assert.match(
    css,
    /background-color: var\(--color-components-checkbox-bg-checked\)/,
  )
  assert.match(css, /background-color: var\(--color-components-radio-dot\)/)
  assert.match(css, /--tw-ring-offset-color: var\(--color-background-body\)/)
  assert.ok(
    css.lastIndexOf('--tw-ring-color: var(--color-state-focus)') >
      css.indexOf('.form-checkbox:focus'),
    'selection focus colors must override the forms plugin defaults',
  )
})

test('selected input text and options compile independently of action colors', async () => {
  const css = (await compiler).build([
    'selection:bg-state-selected',
    'selection:text-text-on-accent',
    'data-[state=checked]:bg-state-selected-bg',
    'data-[state=checked]:text-state-selected-text',
    'bg-components-button-primary-bg',
  ])
  assert.match(css, /background-color: var\(--color-state-selected\)/)
  assert.match(css, /color: var\(--color-text-on-accent\)/)
  assert.match(css, /background-color: var\(--color-state-selected-bg\)/)
  assert.match(css, /color: var\(--color-state-selected-text\)/)
  assert.match(
    css,
    /background-color: var\(\s*--color-components-button-primary-bg\s*\)/,
  )
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
  const css = result.build(['text-components-button-primary-text'])
  assert.match(
    css,
    /@layer reset, theme, base, antd, antdx, components, utilities;/,
  )
  assert.match(css, /@layer reset \{[\s\S]*?input,[\s\S]*?color: inherit;/)
  assert.match(
    css,
    /\.text-components-button-primary-text \{\s*color: var\(\s*--color-components-button-primary-text\s*\)/,
  )
})
