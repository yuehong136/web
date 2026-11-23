import assert from 'node:assert/strict'
import test from 'node:test'
import {
  COLOR_SCHEMES,
  SCHEME_SEEDS,
  customSchemeSeed,
  singleSidedAiHues,
} from '@/themes/color-schemes'

const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

test('ink, mist and iris use the single-sided tide gradient', () => {
  assert.deepEqual(SCHEME_SEEDS.ink.ai.hues, [204, 234, 264])
  assert.deepEqual(SCHEME_SEEDS.mist.ai.hues, [185, 215, 245])
  assert.deepEqual(SCHEME_SEEDS.iris.ai.hues, [230, 260, 290])
  for (const scheme of ['ink', 'mist', 'iris'] as const)
    assert.deepEqual(
      SCHEME_SEEDS[scheme].ai.hues,
      singleSidedAiHues(SCHEME_SEEDS[scheme].accent.h),
      scheme,
    )
})

test('the other schemes keep their gradients', () => {
  assert.deepEqual(SCHEME_SEEDS.celadon.ai.hues, [160, 195, 235])
  assert.deepEqual(SCHEME_SEEDS.clay.ai.hues, [28, 52, 80])
  assert.deepEqual(SCHEME_SEEDS.amber.ai.hues, [48, 75, 100])
  assert.equal(COLOR_SCHEMES.length, 6)
})

test('custom gradients end at the accent and start from the side nearer 200°', () => {
  for (let h = 0; h < 360; h += 5) {
    const [from, via, to] = singleSidedAiHues(h)
    const step = h >= 15 && h <= 110 ? 20 : 30
    assert.equal(to, h)
    assert.equal(gap(via, h), step, `via for ${h}`)
    assert.equal(gap(from, h), 2 * step, `from for ${h}`)
    assert.equal(gap(from, via), step, `one-sided for ${h}`)
    const other = (h - (from - h) + 720) % 360
    assert.ok(gap(from, 200) <= gap(other, 200), `nearer 200° for ${h}`)
    assert.deepEqual(
      customSchemeSeed({
        accentHue: h,
        accentChroma: 0.15,
        neutralChroma: 0.01,
      }).ai.hues,
      [from, via, to],
    )
  }
})
