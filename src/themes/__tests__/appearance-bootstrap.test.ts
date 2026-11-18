import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { normalizeAppearance } from '../appearance'

const script = await readFile(
  new URL('../../../public/theme-init.js', import.meta.url),
  'utf8',
)
function bootstrap(
  storage: Record<string, string>,
  options: {
    denied?: boolean
    dark?: boolean
    reduced?: boolean
    path?: string
    search?: string
  } = {},
) {
  const attributes: Record<string, string> = {}
  runInNewContext(script, {
    window: {
      location: {
        pathname: options.path ?? '/settings/appearance',
        search: options.search ?? '',
      },
      matchMedia: (query: string) => ({
        matches: query.includes('color-scheme')
          ? Boolean(options.dark)
          : Boolean(options.reduced),
      }),
    },
    document: {
      documentElement: {
        setAttribute: (key: string, value: string) => {
          attributes[key] = value
        },
      },
    },
    localStorage: {
      getItem: (key: string) => {
        if (options.denied) throw new Error('Storage denied')
        return storage[key] ?? null
      },
    },
    URLSearchParams,
  })
  return attributes
}

test('bootstrap applies all persisted dimensions before React without inline style or eval', () => {
  const dimensions = {
    mode: 'dark',
    preset: 'celadon',
    density: 'compact',
    textScale: 1.25,
    motion: 'reduced',
    contrast: 'high',
    action: 'accent',
  }
  assert.deepEqual(bootstrap({ appearance: JSON.stringify(dimensions) }), {
    'data-theme': 'dark',
    'data-preset': 'celadon',
    'data-density': 'compact',
    'data-text-scale': '1.25',
    'data-motion': 'reduced',
    'data-contrast': 'high',
    'data-action': 'accent',
  })
  // Pre-2.0 presets map to their successors before the first paint.
  for (const [legacy, next] of [
    ['studio', 'ink'],
    ['graphite', 'ink'],
    ['paper', 'clay'],
    ['ocean', 'celadon'],
  ])
    assert.equal(
      bootstrap({ appearance: JSON.stringify({ preset: legacy }) })[
        'data-preset'
      ],
      next,
    )
  assert.doesNotMatch(script, /\.style\b|eval\(|new Function/)
})
test('bootstrap and runtime reject the same invalid dimensions', () => {
  const invalid = {
    mode: 'broken',
    preset: 'other',
    density: 'dense',
    textScale: '1.25',
    motion: 'full',
    contrast: 'max',
    action: 'brand',
  }
  const normalized = normalizeAppearance(invalid)
  const values = bootstrap({
    appearance: JSON.stringify(invalid),
    theme: 'dark',
  })
  assert.equal(values['data-theme'], 'light')
  assert.equal(values['data-preset'], normalized.preset)
  assert.equal(values['data-density'], normalized.density)
  assert.equal(values['data-text-scale'], String(normalized.textScale))
  assert.equal(values['data-contrast'], normalized.contrast)
  assert.equal(values['data-action'], normalized.action)
})
test('bootstrap falls back through legacy keys and system preferences', () => {
  assert.equal(bootstrap({ theme: 'dark' })['data-theme'], 'dark')
  assert.equal(
    bootstrap({ 'ui-storage': JSON.stringify({ state: { theme: 'dark' } }) })[
      'data-theme'
    ],
    'dark',
  )
  assert.equal(
    bootstrap({ appearance: '{bad', theme: 'dark' })['data-theme'],
    'dark',
  )
  assert.equal(bootstrap({}, { dark: true })['data-theme'], 'dark')
  assert.equal(bootstrap({}, { reduced: true })['data-motion'], 'reduced')
})
test('bootstrap remains usable with denied storage and explicit share/widget themes', () => {
  const values = bootstrap({}, { denied: true, dark: true })
  assert.equal(values['data-preset'], 'ink')
  assert.equal(values['data-theme'], 'dark')
  for (const path of ['/agent/share/demo', '/chats/widget']) {
    assert.equal(
      bootstrap(
        { appearance: JSON.stringify({ mode: 'dark' }) },
        { path, search: '?theme=light' },
      )['data-theme'],
      'light',
    )
  }
})

test('appearance restores browser-default root rem sizing before applying textScale once', async () => {
  const css = await readFile(
    new URL('../appearance.css', import.meta.url),
    'utf8',
  )
  assert.match(css, /html\[data-preset\]\s*\{\s*font-size:\s*100%;/)
  assert.match(css, /\[data-preset\]:not\(html\)/)
  assert.doesNotMatch(css, /(?:^|\n)html[^{}]*\{[^}]*font-size:[^;]*text-scale/)
})
test('bootstrap installs the cached brand scheme before React through a constructable sheet', () => {
  class FakeSheet {
    css = ''
    replaceSync(css: string) {
      this.css = css
    }
  }
  const attributes: Record<string, string> = {}
  const document = {
    adoptedStyleSheets: [] as FakeSheet[],
    documentElement: {
      setAttribute: (key: string, value: string) => {
        attributes[key] = value
      },
    },
  }
  const window: Record<string, unknown> = {
    location: { pathname: '/', search: '' },
    matchMedia: () => ({ matches: false }),
  }
  const storage: Record<string, string> = {
    appearance: JSON.stringify({ preset: 'custom' }),
    'appearance-custom-css': "[data-preset='custom'] { --color-fg: red; }",
  }
  runInNewContext(script, {
    window,
    document,
    localStorage: { getItem: (key: string) => storage[key] ?? null },
    URLSearchParams,
    CSSStyleSheet: FakeSheet,
  })
  assert.equal(attributes['data-preset'], 'custom')
  assert.equal(document.adoptedStyleSheets.length, 1)
  assert.equal(
    document.adoptedStyleSheets[0].css,
    storage['appearance-custom-css'],
  )
  // The app reuses this sheet instead of adding a second one.
  assert.equal(window.__appearanceCustomSheet, document.adoptedStyleSheets[0])
})
