import assert from 'node:assert/strict'
import test from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  darkTokenValues,
  lightTokenValues,
} from '@/themes/token-values.generated'
import { tailwindColors } from '@/themes/tailwind-vars'

// Consumer-side closure: a utility or `var(--color-*)` that names an undefined
// token compiles fine and silently renders nothing, so the reference itself
// has to be checked against what the theme actually defines.

const srcDir = fileURLToPath(new URL('../../..', import.meta.url))
const themeDir = join(srcDir, 'themes')

const tokens = new Set(Object.keys(lightTokenValues))
const aliases = new Set(Object.keys(tailwindColors))
// Runtime channels emitted next to the tokens by theme-css-generator.
const channels = new Set([
  'twc-primary',
  'twc-primary-foreground',
  'twc-foreground',
  'twc-background',
  'twc-ring',
  'twc-border',
])

const COLOR_VALUE =
  /^(#[\da-f]{3,8}|rgba?\([^()]*\)|hsla?\([^()]*\)|oklch\([^()]*\)|transparent)$/i

// Utilities that take a color; `rest` is checked when it names a theme color.
const COLOR_UTILITY =
  /(?<![\w-])(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|inset-ring|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow|inset-shadow)-([a-z][\w-]*?)(?:\/\d+)?(?![\w-])/g
const TOKEN_ROOT =
  /^(components|text|background|border|status|state|surface|chat|data-viz|shadow)-/
const SHADCN_NAMES =
  /^(background|foreground|card|popover|primary|secondary|muted|accent|destructive|input|ring|border|sidebar|chart-\d)(-foreground)?$/

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(path)
    }
    if (!/\.(tsx?|css)$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name))
      return []
    return [path]
  })
}

const files = sourceFiles(srcDir).filter(
  (file) =>
    !file.startsWith(themeDir) ||
    /tailwind\.css$|scoped-theme\.tsx$|application-style-provider\.tsx$/.test(
      file,
    ),
)

function scan(
  pattern: RegExp,
  visit: (match: RegExpMatchArray, where: string) => string | undefined,
) {
  const problems: string[] = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length
      const problem = visit(match, `${relative(srcDir, file)}:${line}`)
      if (problem) problems.push(problem)
    }
  }
  return problems
}

function report(problems: string[]) {
  return `${problems.length} violation(s):\n  ${problems.join('\n  ')}`
}

test('every --color-* token holds a color in both themes', () => {
  const problems = [lightTokenValues, darkTokenValues].flatMap((values) =>
    Object.entries(values)
      .filter(([, value]) => !COLOR_VALUE.test(value.trim()))
      .map(([key, value]) => `${key}: ${value}`),
  )
  assert.equal(problems.length, 0, report(problems))
})

test('Tailwind aliases only point at runtime tokens and channels', () => {
  const problems = Object.entries(tailwindColors).flatMap(([alias, value]) =>
    [...value.matchAll(/var\(--([\w-]+)\)/g)]
      .map((match) => match[1])
      .filter((name) =>
        name.startsWith('color-')
          ? !tokens.has(name.slice(6))
          : !channels.has(name),
      )
      .map((name) => `${alias} -> --${name}`),
  )
  assert.equal(problems.length, 0, report(problems))
})

// Embedded widgets apply the host's colors by re-pointing existing tokens inside
// their own scope; they may not invent new token names.
const SCOPED_OVERRIDES = /pages[\\/]agent[\\/]share[\\/]widget-theme\.css:/

test('only the theme generator declares --color-* variables', () => {
  const problems = scan(/^\s*--color-([\w-]+)\s*:/gm, (match, where) =>
    SCOPED_OVERRIDES.test(where) && tokens.has(match[1])
      ? undefined
      : `${where} declares --color-${match[1]}`,
  )
  assert.equal(problems.length, 0, report(problems))
})

test('var(--color-*) references resolve to runtime tokens', () => {
  const problems = scan(
    /var\(--color-([a-z][a-z\d-]*)(?![\w$-]|\$\{)/g,
    (match, where) =>
      tokens.has(match[1]) ? undefined : `${where} var(--color-${match[1]})`,
  )
  assert.equal(problems.length, 0, report(problems))
})

test('color utilities name defined tokens or aliases', () => {
  const problems = scan(COLOR_UTILITY, (match, where) => {
    const name = match[1]
    if (!TOKEN_ROOT.test(name) && !SHADCN_NAMES.test(name)) return undefined
    // A quoted bare token name is a token reference, e.g. getTokenValue('text-accent').
    if (
      tokens.has(match[0]) &&
      /^['"]/.test(match.input!.slice(match.index! - 1))
    )
      return undefined
    return tokens.has(name) || aliases.has(name)
      ? undefined
      : `${where} ${match[0]}`
  })
  assert.equal(problems.length, 0, report(problems))
})

test('readCssVar reads defined tokens', () => {
  const problems = scan(/readCssVar\(\s*['"]([\w-]+)['"]/g, (match, where) =>
    tokens.has(match[1]) ? undefined : `${where} readCssVar('${match[1]}')`,
  )
  assert.equal(problems.length, 0, report(problems))
})
