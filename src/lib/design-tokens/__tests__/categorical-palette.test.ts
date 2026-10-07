import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import {
  getCategoricalIndex,
  getCategoricalPalette,
  getTokenValue,
  CATEGORICAL_PALETTE_SIZE,
} from '@/lib/design-tokens'
import {
  lightTokenValues,
  darkTokenValues,
} from '@/themes/token-values.generated'
import { interactionPalette, rgbChannels } from '@/themes/interaction-palette'
import {
  generateThemeCSS,
  lightTokens,
  darkTokens,
} from '@/themes/theme-generator'
import type { DesignTokens } from '@/themes/tokens'

test('getCategoricalIndex: same key is deterministic', () => {
  assert.equal(getCategoricalIndex('Person'), getCategoricalIndex('Person'))
})

test('getCategoricalIndex: result is within [0, count)', () => {
  for (const key of ['', 'a', 'Organization', '组织机构', 'x'.repeat(500)]) {
    const idx = getCategoricalIndex(key)
    assert.ok(
      idx >= 0 && idx < CATEGORICAL_PALETTE_SIZE,
      `idx ${idx} out of range for "${key}"`,
    )
    const idx6 = getCategoricalIndex(key, 6)
    assert.ok(idx6 >= 0 && idx6 < 6, `idx6 ${idx6} out of range for "${key}"`)
  }
})

test('getCategoricalIndex: count clamps to <= palette size', () => {
  const idx = getCategoricalIndex('anything', 100)
  assert.ok(idx >= 0 && idx < CATEGORICAL_PALETTE_SIZE)
})

test('getCategoricalIndex: empty / very long string does not throw', () => {
  assert.doesNotThrow(() => getCategoricalIndex(''))
  assert.doesNotThrow(() => getCategoricalIndex('z'.repeat(10000)))
})

test('getCategoricalPalette: returns exactly count entries', () => {
  assert.equal(getCategoricalPalette('light').length, CATEGORICAL_PALETTE_SIZE)
  assert.equal(getCategoricalPalette('light', 6).length, 6)
  assert.equal(getCategoricalPalette('dark', 3).length, 3)
})

test('getCategoricalPalette: count > 10 clamps to 10', () => {
  assert.equal(
    getCategoricalPalette('light', 50).length,
    CATEGORICAL_PALETTE_SIZE,
  )
})

test('getCategoricalPalette: light and dark differ on a known slot', () => {
  const light = getCategoricalPalette('light')
  const dark = getCategoricalPalette('dark')
  // slot 1 (data-viz-categorical-1) is intentionally distinct per theme
  assert.notEqual(light[0], dark[0])
})

test('getCategoricalPalette: every entry is a non-empty string', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const color of getCategoricalPalette(theme)) {
      assert.equal(typeof color, 'string')
      assert.ok(color.length > 0)
    }
  }
})

test('getTokenValue: a known token differs between light and dark', () => {
  assert.notEqual(
    getTokenValue('text-primary', 'light'),
    getTokenValue('text-primary', 'dark'),
  )
})

test('getTokenValue: returns the value baked into the generated module', () => {
  assert.equal(
    getTokenValue('text-primary', 'light'),
    lightTokenValues['text-primary'],
  )
  assert.equal(
    getTokenValue('text-primary', 'dark'),
    darkTokenValues['text-primary'],
  )
})

// Compile-time-only note: `getTokenValue('not-a-real-token', 'light')` does not
// type-check because the `name` parameter is `keyof DesignTokens`. There is no
// runtime guard for invalid names — type safety is the guard.

test('artifact guard: data-viz-categorical-1..10 present and non-empty in both themes', () => {
  for (let n = 1; n <= CATEGORICAL_PALETTE_SIZE; n += 1) {
    const key = `data-viz-categorical-${n}` as keyof typeof lightTokenValues
    for (const values of [lightTokenValues, darkTokenValues]) {
      assert.ok(key in values, `${key} missing from generated token values`)
      assert.ok(
        typeof values[key] === 'string' && values[key].length > 0,
        `${key} is empty in generated token values`,
      )
    }
  }
})

const selectedFillTokens = [
  'surface-accent',
  'state-selected',
  'components-checkbox-bg-checked',
  'components-checkbox-border-checked',
  'components-radio-border-checked',
  'components-radio-dot',
  'components-switch-bg-checked',
  'components-slider-range',
  'components-slider-thumb-border',
  'components-calendar-cell-bg-selected',
  'components-system-accent-border',
] as const satisfies readonly (keyof DesignTokens)[]

const selectedTextTokens = [
  'state-selected-text',
  'components-model-selector-item-text-selected',
  'components-tree-node-text-selected',
  'components-transfer-item-text-selected',
  'components-calendar-cell-text-today',
  'components-system-accent-text',
] as const satisfies readonly (keyof DesignTokens)[]

const selectedBackgroundTokens = [
  'surface-accent-subtle',
  'state-selected-bg',
  'components-model-selector-item-bg-selected',
  'components-table-row-bg-selected',
  'components-tree-node-bg-selected',
  'components-transfer-item-bg-selected',
  'components-calendar-cell-bg-today',
  'state-focus-10',
  'state-focus-subtle',
] as const satisfies readonly (keyof DesignTokens)[]

const focusTokens = [
  'border-focus',
  'state-focus',
  'components-input-border-focus',
  'components-select-border-focus',
] as const satisfies readonly (keyof DesignTokens)[]

const themeContracts = {
  light: {
    selection: '#00857e',
    selectionText: '#007e77',
    focus: '#00857e',
    action: '#18181b',
  },
  dark: {
    selection: '#8452f4',
    selectionText: '#c4b5fd',
    focus: '#a78bfa',
    action: '#2563eb',
  },
} as const

function luminance(hex: string): number {
  assert.match(hex, /^#[\da-f]{6}$/i)
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (values[0] + 0.05) / (values[1] + 0.05)
}

function compositeBackground(color: string, surface: string): string {
  if (color.startsWith('#')) return color
  const match = /^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/.exec(
    color,
  )
  assert.ok(match, `Expected an opaque hex or rgba background: ${color}`)
  const alpha = Number(match[4])
  return `#${[1, 2, 3]
    .map((channel) => {
      const base = Number.parseInt(
        surface.slice(channel * 2 - 1, channel * 2 + 1),
        16,
      )
      return Math.round(Number(match[channel]) * alpha + base * (1 - alpha))
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

for (const mode of ['light', 'dark'] as const) {
  test(`${mode} controls use the selection family while main actions retain their own family`, () => {
    const values = mode === 'light' ? lightTokenValues : darkTokenValues
    const contract = themeContracts[mode]
    const palette = interactionPalette[mode]
    for (const [role, value] of Object.entries(contract)) {
      assert.equal(
        palette[role as keyof typeof contract],
        value,
        `${mode} ${role}`,
      )
    }
    for (const key of selectedFillTokens)
      assert.equal(values[key], contract.selection, key)
    for (const key of selectedTextTokens)
      assert.equal(values[key], contract.selectionText, key)
    for (const key of selectedBackgroundTokens)
      assert.equal(values[key], palette.selectionTint, key)
    for (const key of focusTokens)
      assert.equal(values[key], contract.focus, key)
    assert.equal(values['components-select-bg'], values['components-radio-bg'])
    assert.notEqual(values['components-select-bg'], contract.selection)
    assert.equal(values['surface-primary'], values['background-surface'])
    assert.equal(values['surface-secondary'], values['background-subtle'])
    assert.equal(values['surface-tertiary'], values['background-default'])
    assert.equal(values['text-caption'], values['text-tertiary'])
    assert.equal(values['components-button-primary-bg'], contract.action)
    assert.equal(values['components-button-primary-border'], contract.action)
    assert.equal(
      values['components-button-primary-bg-hover'],
      palette.actionHover,
    )
    assert.equal(
      values['components-button-primary-bg-active'],
      palette.actionActive,
    )
    assert.notEqual(
      values['components-button-primary-bg'],
      values['components-checkbox-bg-checked'],
    )
  })

  test(`${mode} selected controls and action labels retain readable contrast`, () => {
    const values = mode === 'light' ? lightTokenValues : darkTokenValues
    const indicators = [
      ['components-checkbox-icon', 'components-checkbox-bg-checked'],
      ['components-switch-thumb-checked', 'components-switch-bg-checked'],
      ['components-slider-thumb', 'components-slider-thumb-border'],
    ] as const
    for (const [foreground, background] of indicators) {
      assert.equal(values[foreground], '#ffffff', foreground)
      assert.ok(
        contrast(values[foreground], values[background]) >= 3,
        `${mode} ${foreground} against ${background} must reach 3:1`,
      )
    }
    for (const filled of [
      'components-checkbox-bg-checked',
      'components-switch-bg-checked',
      'components-slider-range',
      'components-radio-dot',
    ] as const) {
      assert.ok(
        contrast(values[filled], values['background-surface']) >= 3,
        `${mode} ${filled} against background-surface must reach 3:1`,
      )
    }
    assert.equal(values['components-button-primary-text'], '#ffffff')
    for (const background of [
      'components-button-primary-bg',
      'components-button-primary-bg-hover',
      'components-button-primary-bg-active',
    ] as const) {
      assert.ok(
        contrast(
          values['components-button-primary-text'],
          values[background],
        ) >= 4.5,
        `${mode} primary button labels against ${background} must reach 4.5:1`,
      )
    }
    assert.equal(values['components-calendar-cell-text-selected'], '#ffffff')
    assert.ok(
      contrast(
        values['components-calendar-cell-text-selected'],
        values['components-calendar-cell-bg-selected'],
      ) >= 4.5,
      `${mode} selected calendar labels must reach 4.5:1`,
    )
  })

  test(`${mode} primary, secondary and tertiary text stays readable on product surfaces`, () => {
    const values = mode === 'light' ? lightTokenValues : darkTokenValues
    const textTokens = [
      'text-primary',
      'text-secondary',
      'text-tertiary',
      'text-muted',
    ] as const
    const surfaces = [
      'background-body',
      'background-default',
      'background-surface',
      'background-section',
      'components-card-bg',
    ] as const
    for (const foreground of textTokens) {
      for (const background of surfaces) {
        const ratio = contrast(values[foreground], values[background])
        assert.ok(
          ratio >= 4.5,
          `${mode} ${foreground} against ${background} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
        )
      }
      // Lists, menus and chips also put body text on the subtle, hover, tag
      // and outline button fills.
      for (const background of [
        'background-subtle',
        'state-hover',
        'components-tag-bg',
        'components-button-secondary-bg',
      ] as const) {
        const ratio = contrast(
          values[foreground],
          compositeBackground(values[background], values['background-surface']),
        )
        assert.ok(
          ratio >= 4.5,
          `${mode} ${foreground} over ${background} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
        )
      }
    }
    for (const background of [
      'components-tag-bg',
      'components-tag-bg-hover',
    ] as const) {
      const ratio = contrast(
        values['components-tag-text'],
        compositeBackground(values[background], values['background-surface']),
      )
      assert.ok(
        ratio >= 4.5,
        `${mode} tag labels against ${background} are ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
      )
    }
    for (const status of ['success', 'warning', 'error', 'info'] as const) {
      const ratio = contrast(
        values[`components-badge-${status}-text`],
        compositeBackground(
          values[`components-badge-${status}-bg`],
          values['background-surface'],
        ),
      )
      assert.ok(
        ratio >= 4.5,
        `${mode} ${status} badge labels are ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
      )
    }
    for (const status of ['success', 'warning', 'error', 'info'] as const) {
      for (const background of surfaces) {
        const ratio = contrast(
          values[`components-alert-${status}-text`],
          compositeBackground(
            values[`components-alert-${status}-bg`],
            values[background],
          ),
        )
        assert.ok(
          ratio >= 4.5,
          `${mode} ${status} alert text over ${background} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
        )
      }
    }
    // Status text sits on subtle fills, outline buttons (at rest and on
    // hover, as in the bulk enable and stop actions) and its own tint.
    for (const status of ['success', 'warning', 'error'] as const) {
      for (const background of [
        ...surfaces,
        'background-subtle',
        'components-button-secondary-bg',
        'components-button-secondary-bg-hover',
        `status-${status}-subtle`,
      ] as const) {
        const ratio = contrast(
          values[`text-${status}`],
          compositeBackground(values[background], values['background-surface']),
        )
        assert.ok(
          ratio >= 4.5,
          `${mode} ${status} text over ${background} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
        )
      }
    }
    // Search highlights tint text-error with itself, 10% at rest and 16% on
    // hover, inside result cards that lighten on hover.
    for (const percent of [10, 16]) {
      const highlight = `rgba(${rgbChannels(values['text-error']).replaceAll(' ', ', ')}, ${percent / 100})`
      for (const background of [
        'background-surface',
        'components-card-bg-hover',
      ] as const) {
        const ratio = contrast(
          values['text-error'],
          compositeBackground(highlight, values[background]),
        )
        assert.ok(
          ratio >= 4.5,
          `${mode} search highlights with a ${percent}% tint over ${background} are ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
        )
      }
    }
    // Reference similarity badges label the success, accent and tertiary
    // text colors with text-inverted.
    for (const background of [
      'text-success',
      'text-accent',
      'text-tertiary',
    ] as const) {
      const ratio = contrast(values['text-inverted'], values[background])
      assert.ok(
        ratio >= 4.5,
        `${mode} similarity badges on ${background} are ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
      )
    }
    // Published apps keep their success chip in selected list rows, where
    // the selection tint lies under the success tint.
    const selectedChipRatio = contrast(
      values['text-success'],
      compositeBackground(
        values['status-success-10'],
        compositeBackground(
          values['state-selected-bg'],
          values['background-surface'],
        ),
      ),
    )
    assert.ok(
      selectedChipRatio >= 4.5,
      `${mode} success chips in selected rows are ${selectedChipRatio.toFixed(2)}:1; expected at least 4.5:1`,
    )
    // Method, task, API and system status labels sit on their own tint.
    for (const label of [
      'components-method-post',
      'components-method-put',
      'components-method-delete',
      'components-http-method-post',
      'components-http-method-put',
      'components-http-method-delete',
      'components-api-status-error',
      'components-task-status-cancelled',
      'components-task-status-completed',
      'components-task-status-failed',
      'components-system-health-warning',
      'components-system-health-error',
      'components-system-status-warning',
      'components-system-status-error',
    ] as const) {
      for (const background of surfaces) {
        const ratio = contrast(
          values[`${label}-text`],
          compositeBackground(values[`${label}-bg`], values[background]),
        )
        assert.ok(
          ratio >= 4.5,
          `${mode} ${label} text over ${background} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
        )
      }
    }
    // The info result icon is non-text content, so it needs 3:1.
    for (const background of ['components-result-bg', ...surfaces] as const) {
      const ratio = contrast(
        values['components-result-icon-info'],
        values[background],
      )
      assert.ok(
        ratio >= 3,
        `${mode} info result icon over ${background} is ${ratio.toFixed(2)}:1; expected at least 3:1`,
      )
    }
  })

  test(`${mode} generated JavaScript and committed CSS match the canonical theme tokens`, async () => {
    const canonical = mode === 'light' ? lightTokens : darkTokens
    const generated = mode === 'light' ? lightTokenValues : darkTokenValues
    assert.deepEqual(generated, canonical)
    const filepath = fileURLToPath(
      new URL(`../../../themes/${mode}.css`, import.meta.url),
    )
    const css = await readFile(filepath, 'utf8')
    const options = await resolveConfig(filepath)
    const expectedCSS = await format(generateThemeCSS(canonical, mode), {
      ...options,
      plugins: [],
      filepath,
    })
    assert.equal(
      css,
      expectedCSS,
      `${mode} committed CSS drifts from canonical tokens`,
    )
    const declarations = [...css.matchAll(/--color-([\w-]+):\s*([^;]+);/g)]
    const emitted = new Map(
      declarations.map((match) => [
        match[1],
        match[2].trim().replace(/\s+/g, ' '),
      ]),
    )
    assert.equal(
      declarations.length,
      emitted.size,
      `${mode} CSS emits a token more than once`,
    )
    assert.deepEqual(
      [...emitted.keys()].sort(),
      Object.keys(generated).sort(),
      `${mode} CSS must cover every generated JavaScript token`,
    )
    for (const key of [
      ...selectedFillTokens,
      ...selectedTextTokens,
      ...selectedBackgroundTokens,
      ...focusTokens,
      'components-button-primary-bg',
    ]) {
      assert.ok(emitted.has(key), `${mode} CSS omits interaction token ${key}`)
    }
  })

  test(`${mode} Tailwind action and focus channels follow the supplied token values`, () => {
    const tokens = {
      ...(mode === 'light' ? lightTokens : darkTokens),
      'components-button-primary-bg': '#123456',
      'state-focus': '#fedcba',
      'text-primary': '#abcdef',
      'background-body': '#13579b',
    }
    const css = generateThemeCSS(tokens, mode)
    assert.match(css, /--twc-primary: 18 52 86;/)
    assert.match(css, /--twc-ring: 254 220 186;/)
    assert.match(css, /--twc-foreground: 171 205 239;/)
    assert.match(css, /--twc-background: 19 87 155;/)
    assert.match(css, /--color-components-button-primary-bg: #123456;/)
    assert.match(css, /--color-state-focus: #fedcba;/)
  })
}
