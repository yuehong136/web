/** Feedback intents; each has one generated scale per theme (status-palette.ts). */
export const statusIntents = ['success', 'warning', 'error', 'info'] as const
export type StatusIntent = (typeof statusIntents)[number]

/** Role colors of one intent in one theme. */
export interface StatusRoles {
  fg: string
  solid: string
  solidHover: string
  onSolid: string
  subtle: string
  subtleHover: string
  border: string
}

export type StatusPalette = Record<StatusIntent, StatusRoles>

/**
 * Feedback colors, one set per intent:
 * - `status-X`: text, icons, indicator dots and chart marks (WCAG AA on product
 *   surfaces, the subtle fill, outline buttons and its own tint)
 * - `status-X-solid` / `-solid-hover`: filled buttons, badges and pills
 * - `status-X-on-solid`: text and icons on the solid fill (AA at rest and hover)
 * - `status-X-subtle` / `-subtle-hover`: tinted chips, alerts and rows
 * - `status-X-border`: borders of tinted chips, alerts and cards
 */
const roles = {
  '': 'fg',
  '-solid': 'solid',
  '-solid-hover': 'solidHover',
  '-on-solid': 'onSolid',
  '-subtle': 'subtle',
  '-subtle-hover': 'subtleHover',
  '-border': 'border',
} as const satisfies Record<string, keyof StatusRoles>

type RoleSuffix = keyof typeof roles

export type StatusTokens = {
  [K in `status-${StatusIntent}${RoleSuffix}`]: string
}

function statusTokenEntries(
  value: (intent: StatusIntent, role: keyof StatusRoles) => string,
) {
  return Object.fromEntries(
    statusIntents.flatMap((intent) =>
      Object.entries(roles).map(([suffix, role]) => [
        `status-${intent}${suffix}`,
        value(intent, role),
      ]),
    ),
  ) as StatusTokens
}

export const emptyStatusTokens: StatusTokens = statusTokenEntries(() => '')

export const buildStatusTokens = (palette: StatusPalette): StatusTokens =>
  statusTokenEntries((intent, role) => palette[intent][role])
