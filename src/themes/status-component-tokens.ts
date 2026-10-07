import type { StatusPalette, StatusRoles } from './status-tokens'

/**
 * Component feedback families, derived from the status roles so that every
 * feedback surface shares one scale per intent and theme:
 * - tinted labels (alerts, badges, task, system, API and method chips): the
 *   subtle fill, the border role and the foreground
 * - dots, icons, chart marks and indicator borders: the foreground, which
 *   reaches AA on product surfaces and so clears the 3:1 graphics minimum
 * - filled pills: the solid fill with its on-solid label
 */
const parts = {
  bg: 'subtle',
  border: 'border',
  text: 'fg',
  dot: 'fg',
} as const satisfies Record<string, keyof StatusRoles>

type Part = keyof typeof parts

function family<P extends string, K extends Part>(
  prefix: P,
  roles: StatusRoles,
  keys: readonly K[],
) {
  return Object.fromEntries(
    keys.map((key) => [`${prefix}-${key}`, roles[parts[key]]]),
  ) as Record<`${P}-${K}`, string>
}

const tinted = ['bg', 'border', 'text'] as const
const label = ['bg', 'text'] as const
const task = ['bg', 'border', 'text', 'dot'] as const

export function buildStatusComponentTokens(palette: StatusPalette) {
  const { success, warning, error, info } = palette
  return {
    'components-input-border-error': error.fg,
    ...family('components-alert-info', info, tinted),
    ...family('components-alert-success', success, tinted),
    ...family('components-alert-warning', warning, tinted),
    ...family('components-alert-error', error, tinted),
    ...family('components-badge-success', success, label),
    ...family('components-badge-warning', warning, label),
    ...family('components-badge-error', error, label),
    ...family('components-badge-info', info, label),
    ...family('components-task-status-cancelled', warning, task),
    ...family('components-task-status-completed', success, task),
    ...family('components-task-status-failed', error, task),
    ...family('components-api-status-error', error, label),
    ...family('components-method-get', success, tinted),
    ...family('components-method-put', warning, tinted),
    ...family('components-method-delete', error, tinted),
    'components-steps-completed-bg': success.solid,
    'components-steps-completed-text': success.onSolid,
    'components-steps-line-completed': success.fg,
    // Running nodes and flowing edges read as in-progress (info).
    'components-canvas-node-status-running-border': info.fg,
    'components-canvas-node-status-running-halo': info.subtleHover,
    'components-canvas-node-status-running-icon': info.fg,
    'components-canvas-edge-stroke-flowing': info.fg,
    ...family('components-canvas-node-status-success', success, tinted),
    ...family('components-canvas-node-status-error', error, tinted),
    ...family('components-system-health-ok', success, tinted),
    ...family('components-system-health-warning', warning, tinted),
    ...family('components-system-health-error', error, tinted),
    ...family('components-system-status-ok', success, tinted),
    ...family('components-system-status-warning', warning, tinted),
    ...family('components-system-status-error', error, tinted),
    'components-system-chart-done': success.fg,
    'components-system-chart-done-soft': success.subtle,
    'components-system-chart-failed': error.fg,
    'components-system-chart-failed-soft': error.subtle,
    'components-system-chart-pending': warning.fg,
    'components-system-chart-pending-soft': warning.subtle,
  }
}

export type StatusComponentTokens = ReturnType<
  typeof buildStatusComponentTokens
>

const noRoles: StatusRoles = {
  fg: '',
  solid: '',
  solidHover: '',
  onSolid: '',
  subtle: '',
  subtleHover: '',
  border: '',
}

export const emptyStatusComponentTokens: StatusComponentTokens =
  buildStatusComponentTokens({
    success: noRoles,
    warning: noRoles,
    error: noRoles,
    info: noRoles,
  })
