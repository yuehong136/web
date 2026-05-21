import assert from 'node:assert/strict'
import test from 'node:test'
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
