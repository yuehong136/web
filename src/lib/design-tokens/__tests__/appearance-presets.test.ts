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
import { LEGACY_TOKENS } from '@/themes/legacy-tokens'

test('every scheme is an appearance preset and Ink is the default', () => {
  assert.deepEqual([...APPEARANCE_PRESETS], [...COLOR_SCHEMES])
  assert.equal(DEFAULT_APPEARANCE.preset, 'ink')
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

test('every legacy alias names a semantic role', () => {
  const roles = new Set<string>(SEMANTIC_TOKENS)
  for (const [legacy, role] of Object.entries(LEGACY_TOKENS))
    assert.ok(role === 'transparent' || roles.has(role), `${legacy} -> ${role}`)
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
