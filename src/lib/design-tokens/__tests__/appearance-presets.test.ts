import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { getTokenValue, getCategoricalPalette } from '../index'
import {
  APPEARANCE_PRESETS,
  setAppearance,
  DEFAULT_APPEARANCE,
} from '@/themes/appearance'
import { presetTokenValues } from '@/themes/token-values.generated'
import {
  lightTokens,
  darkTokens,
  validateTokens,
} from '@/themes/theme-generator'
import { createPresetTokenSets } from '@/themes/theme-artifact-generator'

const normalizeCSS = (value: string) =>
  value
    .replace(/\s+/g, '')
    .replace(/\d*\.\d+/g, (number) => String(Number(number)))
    .toLowerCase()
const canonical = createPresetTokenSets({
  light: lightTokens,
  dark: darkTokens,
})
function luminance(hex: string) {
  const c = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}
for (const preset of APPEARANCE_PRESETS) {
  for (const mode of ['light', 'dark'] as const) {
    test(`${preset}/${mode} generated values, static accessors and CSS cover the same complete token set`, async () => {
      const values = presetTokenValues[preset][mode]
      assert.deepEqual(values, canonical[preset][mode])
      assert.deepEqual(
        Object.keys(values).sort(),
        Object.keys(lightTokens).sort(),
      )
      assert.deepEqual(validateTokens({ ...values }), [])
      assert.equal(
        getTokenValue('components-system-chart-axis', mode, preset),
        values['components-system-chart-axis'],
      )
      assert.deepEqual(
        getCategoricalPalette(mode, 3, preset),
        [1, 2, 3].map(
          (n) => values[`data-viz-categorical-${n}` as keyof typeof values],
        ),
      )
      const css = await readFile(
        new URL(`../../../themes/${mode}.css`, import.meta.url),
        'utf8',
      )
      const block = css.split(/\/\*\*/)[APPEARANCE_PRESETS.indexOf(preset) + 1]
      const declarations = [...block.matchAll(/--color-([\w-]+):\s*([^;]+);/g)]
      assert.equal(declarations.length, Object.keys(values).length)
      for (const match of declarations) {
        assert.equal(
          normalizeCSS(match[2]),
          normalizeCSS(values[match[1] as keyof typeof values]),
          match[1],
        )
      }
    })
    test(`${preset}/${mode} text, focus, and primary action remain readable`, () => {
      const values = presetTokenValues[preset][mode]
      for (const text of [
        'text-primary',
        'text-secondary',
        'text-tertiary',
        'text-accent',
      ] as const) {
        for (const background of [
          'background-body',
          'background-surface',
          'background-subtle',
        ] as const) {
          assert.ok(
            contrast(values[text], values[background]) >= 4.5,
            `${text} over ${background}: ${contrast(values[text], values[background])}`,
          )
        }
      }
      assert.ok(
        contrast(
          values['components-button-primary-text'],
          values['components-button-primary-bg'],
        ) >= 4.5,
      )
      assert.ok(
        contrast(values['state-focus'], values['background-surface']) >= 3,
      )
      // Pages and the header inside the raised workbench share its surface,
      // which stands apart from the shell tone the navigation sits on.
      for (const ground of [
        'components-nav-bg',
        'components-console-bg',
        'components-workspace-bg',
        'components-settings-content-bg',
      ] as const)
        assert.equal(values[ground], values['background-surface'], ground)
      assert.notEqual(
        values['components-app-shell-bg'],
        values['background-surface'],
      )
    })
  }
}

test('static canvas reads switch preset even when the mode remains unchanged', () => {
  setAppearance({ preset: 'paper' })
  assert.equal(
    getTokenValue('components-card-bg', 'light'),
    presetTokenValues.paper.light['components-card-bg'],
  )
  setAppearance({ preset: 'ocean' })
  assert.equal(
    getTokenValue('components-card-bg', 'light'),
    presetTokenValues.ocean.light['components-card-bg'],
  )
  assert.notEqual(
    presetTokenValues.paper.light['components-card-bg'],
    presetTokenValues.ocean.light['components-card-bg'],
  )
  setAppearance({ ...DEFAULT_APPEARANCE })
})
