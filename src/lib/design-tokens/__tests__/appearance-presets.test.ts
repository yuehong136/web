import assert from 'node:assert/strict'
import test from 'node:test'
import { getTokenValue } from '../index'
import {
  APPEARANCE_PRESETS,
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  setAppearance,
} from '@/themes/appearance'
import { presetTokenValues } from '@/themes/token-values.generated'
import { COLOR_SCHEMES, SCHEME_SEEDS } from '@/themes/color-schemes'
import { generateThemeCSS } from '@/themes/theme-generator'
import { schemeTokens } from '@/themes/theme-sets'
import { SEMANTIC_TOKENS } from '@/themes/semantic-tokens'
import { customSchemeCSS, customTokenValues } from '@/themes/custom-scheme'

test('every scheme is an appearance preset and Ink is the default', () => {
  assert.deepEqual([...APPEARANCE_PRESETS], [...COLOR_SCHEMES, 'custom'])
  assert.equal(DEFAULT_APPEARANCE.preset, 'ink')
})

test('the brand seed is clamped to the range the generator is tested on', () => {
  assert.deepEqual(
    normalizeAppearance({
      custom: { accentHue: 725.4, accentChroma: 0.9, neutralChroma: -1 },
    }).custom,
    { accentHue: 0, accentChroma: 0.22, neutralChroma: 0 },
  )
  assert.deepEqual(normalizeAppearance({}).custom, DEFAULT_APPEARANCE.custom)
})

test('the brand scheme generates every role for both modes', () => {
  const seed = { accentHue: 330, accentChroma: 0.15, neutralChroma: 0.01 }
  const css = customSchemeCSS(seed)
  for (const mode of ['light', 'dark'] as const) {
    const start = css.indexOf(`[data-preset='custom'][data-theme='${mode}']`)
    assert.ok(start >= 0, mode)
    const body = css.slice(start, css.indexOf('}', start))
    for (const token of SEMANTIC_TOKENS)
      assert.equal(
        body.split(`--color-${token}:`).length - 1,
        1,
        `${mode} ${token}`,
      )
  }
  assert.ok(
    css.includes(
      "[data-preset='custom'][data-theme='dark'][data-contrast='high']",
    ),
  )
  setAppearance({ preset: 'custom', custom: seed })
  assert.equal(
    getTokenValue('accent-solid', 'dark'),
    customTokenValues(seed).dark['accent-solid'],
  )
  setAppearance({ ...DEFAULT_APPEARANCE })
})

test('pre-2.0 presets migrate to their successors', () => {
  const migrate = (preset: string) => normalizeAppearance({ preset }).preset
  assert.equal(migrate('studio'), 'ink')
  assert.equal(migrate('graphite'), 'ink')
  assert.equal(migrate('paper'), 'clay')
  assert.equal(migrate('ocean'), 'celadon')
  assert.equal(migrate('mist'), 'mist')
  assert.equal(migrate('unknown'), 'ink')
})

for (const mode of ['light', 'dark'] as const) {
  const css = generateThemeCSS(mode)
  for (const scheme of COLOR_SCHEMES) {
    test(`${scheme}/${mode} declares every role once in its base block`, () => {
      const start = css.indexOf(`/* ===== ${scheme} ===== */`)
      const body = css.slice(start, css.indexOf('}', start))
      for (const token of SEMANTIC_TOKENS)
        assert.equal(
          body.split(`--color-${token}:`).length - 1,
          1,
          `${scheme}/${mode} --color-${token}`,
        )
    })

    test(`${scheme}/${mode} layers the workbench over a distinct shell tone`, () => {
      const { roles } = schemeTokens(scheme, mode)
      assert.notDeepEqual(roles.canvas.color, roles.surface.color)
      // Light schemes lift work onto white or warm paper; dark ones step up.
      if (mode === 'dark')
        assert.notDeepEqual(roles.raised.color, roles.surface.color)
    })

    test(`${scheme}/${mode} follows the scheme's own primary action`, () => {
      const { roles } = schemeTokens(scheme, mode)
      const expected =
        SCHEME_SEEDS[scheme].action === 'ink'
          ? 'scale-gray-12'
          : 'scale-accent-9'
      assert.equal(roles['action-bg'].ref, expected)
    })
  }
}

test('portal content without data-preset inherits the nearest preset', () => {
  const css = generateThemeCSS('dark')
  assert.match(
    css,
    /\[data-preset='mist'\] \[data-theme='dark'\]:not\(\[data-preset\]\)/,
  )
  assert.match(
    css,
    /\[data-theme='dark'\]:not\(\[data-preset\], \[data-preset\] \*\)/,
  )
})

test('static canvas reads switch preset even when the mode remains unchanged', () => {
  setAppearance({ preset: 'clay' })
  assert.equal(
    getTokenValue('raised', 'light'),
    presetTokenValues.clay.light.raised,
  )
  setAppearance({ preset: 'celadon' })
  assert.equal(
    getTokenValue('accent-solid', 'light'),
    presetTokenValues.celadon.light['accent-solid'],
  )
  assert.notEqual(
    presetTokenValues.clay.light['accent-solid'],
    presetTokenValues.celadon.light['accent-solid'],
  )
  setAppearance({ ...DEFAULT_APPEARANCE })
})
