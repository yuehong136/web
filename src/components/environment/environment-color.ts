/**
 * Colour of an environment's status dot. Well-known names carry their usual
 * meaning (production is the dangerous one, staging the cautious one, local
 * the safe one); every other environment takes a categorical data-viz hue by
 * its position in the list, so the list and the selector agree.
 */

// Full class names so Tailwind generates every one of them.
const CATEGORICAL_DOTS = [
  'bg-data-viz-categorical-1',
  'bg-data-viz-categorical-2',
  'bg-data-viz-categorical-3',
  'bg-data-viz-categorical-4',
  'bg-data-viz-categorical-5',
  'bg-data-viz-categorical-6',
  'bg-data-viz-categorical-7',
  'bg-data-viz-categorical-8',
  'bg-data-viz-categorical-9',
  'bg-data-viz-categorical-10',
] as const

/** Latin aliases match as whole words, so "product-api" is not production. */
const word = (aliases: string) =>
  new RegExp(`(^|[^a-z])(${aliases})([^a-z]|$)`, 'u')

// Staging first: "pre-prod" is a staging environment, not production.
const WELL_KNOWN: ReadonlyArray<readonly [RegExp, RegExp, string]> = [
  [
    word('staging|stage|stg|preprod|pre-prod|uat'),
    /预发|预生产/u,
    'bg-status-warning',
  ],
  [word('production|prod|prd'), /生产|正式|线上/u, 'bg-status-error'],
  [word('local|localhost'), /本地/u, 'bg-status-success'],
]

export function environmentDotClass(name: string, index: number): string {
  const normalized = name.trim().toLowerCase()
  for (const [latin, chinese, dot] of WELL_KNOWN) {
    if (latin.test(normalized) || chinese.test(normalized)) return dot
  }
  const position = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0
  return CATEGORICAL_DOTS[position % CATEGORICAL_DOTS.length]
}
