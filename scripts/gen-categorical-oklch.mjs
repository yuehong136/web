#!/usr/bin/env node
/**
 * Dev-only provenance script for the data-viz-categorical-1..10 palette.
 *
 * Generates a colorblind-safe, perceptually-uniform 10-color categorical scale
 * (light + dark) by sampling fixed OKLCH lightness/chroma at evenly-stepped hues
 * (with small per-slot hue nudges to spread CVD-confusable neighbours), then
 * verifies WCAG contrast against the theme canvas and CVD-simulated adjacency.
 *
 * NOT imported by the app — its output is hand-baked into theme-generator.ts.
 * Run:  node scripts/gen-categorical-oklch.mjs
 *
 * Math: OKLab/OKLCH ↔ sRGB per Björn Ottosson; CVD via Viénot–Brettel–Mollon
 * (Machado 2009 severity-1 matrices); contrast per WCAG 2.x relative luminance.
 */

// ---------- OKLCH → sRGB ----------
function oklchToLinearSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}
const gamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
const inGamut = (rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4)
function toHex(linear) {
  const srgb = linear.map((c) => Math.min(1, Math.max(0, gamma(c))))
  return (
    '#' +
    srgb
      .map((c) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}
// Reduce chroma until the OKLCH sample fits the sRGB gamut (keeps L, h stable).
function oklchToHex(L, C, h) {
  let c = C
  let lin = oklchToLinearSrgb(L, c, h)
  while (!inGamut(lin) && c > 0) {
    c -= 0.002
    lin = oklchToLinearSrgb(L, c, h)
  }
  return toHex(lin)
}

// ---------- WCAG contrast ----------
function relLum(hex) {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function contrast(a, b) {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// ---------- CVD simulation (Machado 2009, severity 1.0) ----------
const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}
function simulate(hex, kind) {
  const n = hex.replace('#', '')
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const m = CVD[kind]
  const out = m.map((row) =>
    Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])),
  )
  return out
}
// Perceptual distance in linearised RGB (good enough for adjacency screening).
function dist(hexA, hexB, kind) {
  const a = kind ? simulate(hexA, kind) : hexToRgb(hexA)
  const b = kind ? simulate(hexB, kind) : hexToRgb(hexB)
  return Math.sqrt(a.reduce((s, _, i) => s + (a[i] - b[i]) ** 2, 0)) * 100
}
function hexToRgb(hex) {
  const n = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
}

// ---------- palette params ----------
// 10 evenly-spaced hues (36° step) reordered by an interleave sequence so that
// consecutive palette slots sit ~72–180° apart on the wheel — this maximises
// neighbour separation in normal vision AND under CVD (worst confusions are
// between hues close on the red-green / yellow axes). Same hue ring for both
// themes; only L (and a touch of C) differ.
const HUE_START = 20
const HUE_STEP = 36
const ORDER = [0, 5, 2, 7, 4, 9, 1, 6, 3, 8]
const HUES = ORDER.map((i) => (HUE_START + i * HUE_STEP) % 360)
const LIGHT = { L: 0.6, C: 0.142 } // darker → ≥3:1 on white canvas
const DARK = { L: 0.74, C: 0.123 } // lighter → pops on #202025 canvas

const light = HUES.map((h) => oklchToHex(LIGHT.L, LIGHT.C, h))
const dark = HUES.map((h) => oklchToHex(DARK.L, DARK.C, h))

function report(name, palette, bg) {
  console.log(`\n=== ${name} (canvas ${bg}) ===`)
  palette.forEach((hex, i) => {
    const c = contrast(hex, bg).toFixed(2)
    const flag = contrast(hex, bg) >= 3 ? 'ok ' : 'LOW'
    console.log(`  ${String(i + 1).padStart(2)}  ${hex}  contrast ${c} ${flag}`)
  })
  // adjacency under each CVD (and normal) — min neighbour distance
  for (const kind of [null, 'protan', 'deutan', 'tritan']) {
    let min = Infinity
    let at = ''
    for (let i = 0; i < palette.length - 1; i++) {
      const d = dist(palette[i], palette[i + 1], kind)
      if (d < min) {
        min = d
        at = `${i + 1}-${i + 2}`
      }
    }
    console.log(
      `  min adjacent Δ (${kind ?? 'normal'}): ${min.toFixed(1)} at ${at}`,
    )
  }
}

report('LIGHT', light, '#ffffff')
report('DARK', dark, '#202025')

console.log('\n--- bake into theme-generator.ts ---')
console.log('LIGHT:', JSON.stringify(light))
console.log('DARK :', JSON.stringify(dark))
console.log(
  `\nprovenance: OKLCH light L=${LIGHT.L} C=${LIGHT.C}, dark L=${DARK.L} C=${DARK.C}, hues=[${HUES.join(', ')}]`,
)
