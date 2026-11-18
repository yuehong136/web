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
  presetTokenValues,
} from '@/themes/token-values.generated'
import { DEFAULT_APPEARANCE } from '@/themes/appearance'
import { COLOR_SCHEMES } from '@/themes/color-schemes'
import {
  generateThemeFiles,
  generateTokenValuesModule,
  lightTokens,
  darkTokens,
} from '@/themes/theme-generator'
import { schemeTokenSets } from '@/themes/theme-sets'

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
  assert.notEqual(
    getCategoricalPalette('light')[0],
    getCategoricalPalette('dark')[0],
  )
})

test('getCategoricalPalette: categorical identities do not follow the scheme', () => {
  for (const scheme of COLOR_SCHEMES)
    for (const mode of ['light', 'dark'] as const)
      assert.deepEqual(
        getCategoricalPalette(mode, CATEGORICAL_PALETTE_SIZE, scheme),
        getCategoricalPalette(mode, CATEGORICAL_PALETTE_SIZE, 'ink'),
        `${scheme}/${mode}`,
      )
})

test('getTokenValue: a known token differs between light and dark', () => {
  assert.notEqual(getTokenValue('fg', 'light'), getTokenValue('fg', 'dark'))
})

test('getTokenValue: returns the value baked into the generated module', () => {
  // Without a preset the current appearance (the default Ink) is read.
  const preset = DEFAULT_APPEARANCE.preset
  assert.equal(preset, 'ink')
  assert.equal(getTokenValue('fg', 'light'), presetTokenValues[preset].light.fg)
  assert.equal(getTokenValue('fg', 'dark'), presetTokenValues[preset].dark.fg)
  // The default exports are the Ink values.
  assert.equal(getTokenValue('fg', 'light', 'ink'), lightTokenValues.fg)
  assert.equal(getTokenValue('fg', 'dark', 'ink'), darkTokenValues.fg)
  assert.notEqual(
    lightTokenValues['accent-solid'],
    presetTokenValues.mist.light['accent-solid'],
  )
})

test('legacy names resolve to the value of their role', () => {
  for (const values of [lightTokenValues, darkTokenValues]) {
    assert.equal(values['text-primary'], values.fg)
    assert.equal(values['status-error-subtle'], values['danger-soft'])
    assert.equal(values['data-viz-categorical-3'], values['viz-3'])
    assert.equal(values['components-button-primary-bg'], values['action-bg'])
  }
})

test('generated JavaScript and committed CSS match the scheme seeds', async () => {
  assert.deepEqual(lightTokenValues, lightTokens)
  assert.deepEqual(darkTokenValues, darkTokens)
  const sets = schemeTokenSets()
  for (const scheme of COLOR_SCHEMES)
    for (const mode of ['light', 'dark'] as const)
      assert.deepEqual(
        presetTokenValues[scheme][mode],
        sets[scheme][mode],
        `${scheme}/${mode}`,
      )

  const modulePath = fileURLToPath(
    new URL('../../../themes/token-values.generated.ts', import.meta.url),
  )
  const files = {
    ...generateThemeFiles(),
    tokenValues: generateTokenValuesModule(),
  }
  assert.deepEqual(files.errors, [])
  for (const [name, filepath] of [
    [
      'light',
      fileURLToPath(new URL('../../../themes/light.css', import.meta.url)),
    ],
    [
      'dark',
      fileURLToPath(new URL('../../../themes/dark.css', import.meta.url)),
    ],
    ['tokenValues', modulePath],
  ] as const) {
    const committed = await readFile(filepath, 'utf8')
    const options = await resolveConfig(filepath)
    const expected = await format(files[name], {
      ...options,
      plugins: [],
      filepath,
    })
    assert.equal(
      committed,
      expected,
      `${name} drifts from the generator; run npm run build:themes`,
    )
  }
})
