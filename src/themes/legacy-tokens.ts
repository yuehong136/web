/**
 * Pre-2.0 token names, each an alias of one semantic role. The generated CSS
 * declares them as `var(--color-<role>)`, so every legacy consumer follows the
 * active scheme. Consumers migrate to the role names; the aliases go once no
 * source references them.
 */
import { FILE_KIND_TONES, FILE_KINDS, type FileKind } from './identity'
import type { SemanticToken } from './semantic-tokens'

type Target = SemanticToken | 'transparent'

const STATUS = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info',
} as const
type LegacyIntent = keyof typeof STATUS

function family<P extends string, K extends string>(
  prefix: P,
  map: Record<K, Target>,
) {
  return Object.fromEntries(
    Object.entries(map).map(([key, role]) => [`${prefix}-${key}`, role]),
  ) as Record<`${P}-${K}`, Target>
}

const tinted = (
  intent: 'success' | 'warning' | 'danger' | 'info' | 'neutral',
) =>
  ({
    bg: `${intent}-soft`,
    border: `${intent}-line`,
    text: `${intent}-fg`,
  }) as const

const statusTokens = Object.assign(
  {},
  ...(Object.keys(STATUS) as LegacyIntent[]).map((legacy) => {
    const intent = STATUS[legacy]
    return family(`status-${legacy}`, {
      solid: `${intent}-solid`,
      'solid-hover': `${intent}-solid-hover`,
      'on-solid': `${intent}-on-solid`,
      subtle: `${intent}-soft`,
      'subtle-hover': `${intent}-soft-hover`,
      border: `${intent}-line`,
    } as Record<string, Target>)
  }),
  {
    'status-success': 'success-fg',
    'status-warning': 'warning-fg',
    'status-error': 'danger-fg',
    'status-info': 'info-fg',
  },
) as Record<
  `status-${LegacyIntent}${'' | '-solid' | '-solid-hover' | '-on-solid' | '-subtle' | '-subtle-hover' | '-border'}`,
  Target
>

const slots = [1, 2, 3, 4, 5, 6, 7, 8] as const
const avatarTokens = Object.fromEntries(
  slots.flatMap((n) => [
    [`components-avatar-${n}-bg`, `avatar-${n}-bg`],
    [`components-avatar-${n}-text`, `avatar-${n}-fg`],
  ]),
) as unknown as Record<
  `components-avatar-${(typeof slots)[number]}-${'bg' | 'text'}`,
  Target
>

const fileTokens = Object.fromEntries(
  FILE_KINDS.flatMap((kind) => {
    const slot = FILE_KIND_TONES[kind]
    return [
      [
        `components-file-${kind}-bg`,
        slot ? `avatar-${slot}-bg` : 'neutral-soft',
      ],
      [
        `components-file-${kind}-text`,
        slot ? `avatar-${slot}-fg` : 'neutral-fg',
      ],
    ]
  }),
) as unknown as Record<`components-file-${FileKind}-${'bg' | 'text'}`, Target>

const vizTokens = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [
    `data-viz-categorical-${n}`,
    `viz-${n}`,
  ]),
) as unknown as Record<
  `data-viz-categorical-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`,
  Target
>

export const LEGACY_TOKENS = {
  ...statusTokens,
  ...avatarTokens,
  ...fileTokens,
  ...vizTokens,
  'text-primary': 'fg',
  'text-secondary': 'fg-muted',
  'text-tertiary': 'fg-subtle',
  'text-muted': 'fg-subtle',
  'text-caption': 'fg-subtle',
  'text-disabled': 'fg-disabled',
  'text-accent': 'accent-fg',
  'text-inverted': 'fg-inverse',
  'text-on-accent': 'accent-on-solid',
  'background-body': 'surface',
  'background-default': 'canvas',
  'background-subtle': 'sunken',
  'background-section': 'canvas',
  'background-overlay': 'scrim',
  'background-surface': 'surface',
  'surface-primary': 'surface',
  'surface-secondary': 'sunken',
  'surface-tertiary': 'canvas',
  'surface-accent': 'accent-solid',
  'surface-accent-subtle': 'accent-soft',
  'border-primary': 'line',
  'border-default': 'line',
  'border-hover': 'line-strong',
  'border-focus': 'line-focus',
  'border-subtle': 'line-subtle',
  'border-strong': 'line-strong',
  'border-accent': 'line-focus',
  'state-hover': 'fill-hover',
  'state-active': 'fill-pressed',
  'state-focus': 'line-focus',
  'state-selected': 'accent-solid',
  'state-selected-text': 'accent-fg',
  'state-selected-bg': 'accent-soft',
  'state-disabled': 'fill-muted',
  'state-focus-10': 'accent-soft',
  'state-neutral-10': 'fill-muted',
  'state-focus-subtle': 'accent-soft',
  ...family('components-button-primary', {
    bg: 'action-bg',
    'bg-hover': 'action-bg-hover',
    'bg-active': 'action-bg-hover',
    'bg-disabled': 'fill-muted',
    text: 'action-fg',
    'text-disabled': 'fg-disabled',
    border: 'action-bg',
    'border-hover': 'action-bg-hover',
  }),
  ...family('components-button-secondary', {
    bg: 'fill-muted',
    'bg-hover': 'fill-pressed',
    text: 'fg',
    border: 'line',
    'border-hover': 'line-strong',
  }),
  ...family('components-button-ghost', {
    'bg-hover': 'fill-hover',
    text: 'fg-muted',
    'text-disabled': 'fg-disabled',
  }),
  ...family('components-input', {
    'border-error': 'danger-solid',
    bg: 'surface',
    'bg-hover': 'surface',
    'bg-focus': 'surface',
    border: 'line',
    'border-hover': 'line-strong',
    'border-focus': 'line-focus',
    text: 'fg',
    'text-placeholder': 'fg-subtle',
    'text-disabled': 'fg-disabled',
    'bg-disabled': 'fill-muted',
  }),
  ...family('components-card', {
    bg: 'raised',
    'bg-hover': 'raised-hover',
    border: 'line-subtle',
    'meta-title': 'fg',
    'meta-description': 'fg-muted',
  }),
  ...family('components-sidebar', {
    bg: 'canvas',
    border: 'line-subtle',
    'item-bg': 'transparent',
    'item-bg-hover': 'fill-hover',
    'item-bg-active': 'fill-selected',
    'item-text': 'fg-muted',
    'item-text-active': 'fg',
  }),
  'components-nav-bg': 'surface',
  'components-nav-item-text': 'fg-muted',
  ...family('components-dropdown', {
    bg: 'overlay',
    border: 'line',
    'item-bg-hover': 'fill-hover',
    'item-text': 'fg',
  }),
  'chat-header-bg': 'surface',
  'chat-header-border': 'line-subtle',
  'chat-content-bg': 'surface',
  'chat-welcome-border': 'accent-soft',
  'chat-bubble-user-bg': 'fill-muted',
  'chat-bubble-user-text': 'fg',
  ...family('components-table', {
    bg: 'surface',
    border: 'line',
    'row-bg-hover': 'fill-hover',
  }),
  ...family('components-checkbox', {
    bg: 'surface',
    'bg-checked': 'accent-solid',
    border: 'line-strong',
    'border-checked': 'accent-solid',
    icon: 'accent-on-solid',
  }),
  ...family('components-radio', {
    bg: 'surface',
    'bg-checked': 'surface',
    border: 'line-strong',
    'border-checked': 'accent-solid',
    dot: 'accent-solid',
  }),
  ...family('components-select', {
    bg: 'surface',
    border: 'line',
    'border-focus': 'line-focus',
    text: 'fg',
    placeholder: 'fg-subtle',
  }),
  ...family('components-switch', {
    bg: 'line-strong',
    'bg-checked': 'accent-solid',
    thumb: 'knob',
  }),
  ...family('components-slider', {
    track: 'fill-pressed',
    range: 'accent-solid',
    thumb: 'knob',
    'thumb-border': 'accent-solid',
  }),
  ...family('components-scrollbar', {
    track: 'fill-muted',
    thumb: 'line-strong',
    'thumb-hover': 'fg-disabled',
  }),
  ...family('components-dialog', {
    bg: 'overlay',
    border: 'line-subtle',
    overlay: 'scrim',
  }),
  'components-popover-bg': 'overlay',
  ...family('components-tabs', {
    border: 'line-subtle',
    bg: 'sunken',
    'active-bg': 'accent-soft',
    'active-text': 'accent-fg',
    'inactive-text': 'fg-subtle',
  }),
  ...family('components-alert-info', tinted('info')),
  ...family('components-alert-success', tinted('success')),
  ...family('components-alert-warning', tinted('warning')),
  ...family('components-alert-error', tinted('danger')),
  'components-skeleton-bg': 'fill-muted',
  'components-progress-bg': 'fill-pressed',
  'components-progress-fill': 'accent-solid',
  'components-spinner-color': 'accent-solid',
  'components-loader-primary': 'accent-solid',
  'components-collapse-header-bg-hover': 'fill-hover',
  'components-icon-button-bg-hover': 'fill-hover',
  ...family('components-code', {
    bg: 'fill-muted',
    text: 'fg',
    border: 'line-subtle',
  }),
  ...family('components-pre', {
    bg: 'code-bg',
    text: 'code-fg',
    border: 'line-subtle',
  }),
  ...family('components-tool-call', {
    bg: 'tool-bg',
    border: 'tool-line',
    title: 'fg',
  }),
  ...family('components-badge', {
    bg: 'fill-muted',
    text: 'fg-muted',
    border: 'line-subtle',
    'neutral-bg': 'neutral-soft',
    'neutral-text': 'neutral-fg',
    'blue-bg': 'avatar-6-bg',
    'blue-text': 'avatar-6-fg',
    'orange-bg': 'avatar-2-bg',
    'orange-text': 'avatar-2-fg',
    'purple-bg': 'avatar-7-bg',
    'purple-text': 'avatar-7-fg',
    'green-bg': 'avatar-4-bg',
    'green-text': 'avatar-4-fg',
    'success-bg': 'success-soft',
    'success-text': 'success-fg',
    'warning-bg': 'warning-soft',
    'warning-text': 'warning-fg',
    'error-bg': 'danger-soft',
    'error-text': 'danger-fg',
    'info-bg': 'info-soft',
    'info-text': 'info-fg',
  }),
  ...family('components-task-status-idle', {
    ...tinted('neutral'),
    dot: 'run-queued',
  }),
  ...family('components-task-status-running', {
    bg: 'ai-soft',
    border: 'ai-line',
    text: 'ai-fg',
    dot: 'run-running',
    'progress-bg': 'fill-pressed',
    'progress-fill': 'run-running',
    'progress-glow': 'ai-glow',
  }),
  ...family('components-task-status-cancelled', {
    ...tinted('neutral'),
    dot: 'run-cancelled',
  }),
  ...family('components-task-status-completed', {
    ...tinted('success'),
    dot: 'run-succeeded',
  }),
  ...family('components-task-status-failed', {
    ...tinted('danger'),
    dot: 'run-failed',
  }),
  'components-api-status-error-bg': 'danger-soft',
  'components-api-status-error-text': 'danger-fg',
  ...family('components-method-get', tinted('success')),
  ...family('components-method-put', tinted('warning')),
  ...family('components-method-delete', tinted('danger')),
  ...family('components-method-post', {
    bg: 'avatar-5-bg',
    text: 'avatar-5-fg',
    border: 'avatar-5-fg',
  }),
  ...family('components-method-patch', {
    bg: 'avatar-7-bg',
    text: 'avatar-7-fg',
    border: 'avatar-7-fg',
  }),
  ...family('components-tag', {
    bg: 'fill-muted',
    text: 'fg-muted',
    border: 'line',
  }),
  ...family('components-pagination', {
    bg: 'surface',
    text: 'fg-muted',
    border: 'line',
    'item-bg': 'surface',
    'item-bg-hover': 'fill-hover',
    'item-bg-active': 'fill-selected',
    'item-text': 'fg-muted',
    'item-text-active': 'fg',
    'disabled-text': 'fg-disabled',
  }),
  ...family('components-steps', {
    'active-bg': 'action-bg',
    'active-text': 'action-fg',
    'inactive-bg': 'fill-muted',
    'inactive-text': 'fg-muted',
    line: 'line',
    'completed-bg': 'success-solid',
    'completed-text': 'success-on-solid',
    'line-completed': 'success-fg',
  }),
  ...family('components-upload', {
    bg: 'transparent',
    'bg-dragover': 'accent-soft',
    border: 'line-strong',
    'border-hover': 'fg-disabled',
    'border-dragover': 'accent-solid',
    text: 'fg-muted',
    'text-secondary': 'fg-subtle',
    icon: 'fg-disabled',
  }),
  ...family('components-segmented', {
    bg: 'sunken',
    border: 'line-subtle',
    'item-bg': 'transparent',
    'item-bg-hover': 'fill-hover',
    'item-bg-active': 'overlay',
    'item-text': 'fg-muted',
    'item-text-active': 'fg',
  }),
  'components-glassmorphism-bg': 'overlay',
  'components-glassmorphism-border': 'line-subtle',
  ...family('components-canvas', {
    bg: 'sunken',
    grid: 'line-strong',
    spotlight: 'accent-soft-hover',
    'skeleton-bg': 'fill-pressed',
    'node-bg': 'raised',
    'node-border': 'line',
    'node-border-selected': 'line-focus',
    'edge-stroke-selected': 'accent-solid',
    'edge-stroke-flowing': 'run-running',
    'edge-marker': 'fg-disabled',
    'edge-marker-selected': 'accent-solid',
    'handle-bg': 'accent-solid',
    'handle-icon': 'accent-on-solid',
    'icon-start': 'success-fg',
    'icon-retrieval': 'info-fg',
    'icon-message': 'avatar-5-fg',
    'icon-tool': 'avatar-2-fg',
    'icon-file': 'success-fg',
    'icon-splitter': 'avatar-2-fg',
    'icon-tokenizer': 'avatar-7-fg',
    'note-bg': 'warning-soft',
    'note-border': 'warning-line',
    'note-border-selected': 'warning-solid',
    'note-title': 'warning-fg',
    'note-text': 'fg',
    'node-status-running-border': 'run-running',
    'node-status-running-halo': 'ai-glow',
    'node-status-running-icon': 'run-running',
  }),
  ...family('components-canvas-node-status-success', tinted('success')),
  ...family('components-canvas-node-status-error', tinted('danger')),
  'components-ai-from': 'ai-from',
  'components-ai-via': 'ai-via',
  'components-ai-to': 'ai-to',
  'components-ai-glow': 'ai-glow',
  'components-ai-ring': 'ai-line',
  'components-app-shell-bg': 'canvas',
  ...family('components-main-workbench', {
    bg: 'canvas',
    surface: 'surface',
    border: 'line-subtle',
  }),
  ...family('components-page-header', {
    bg: 'surface',
    border: 'line-subtle',
    title: 'fg',
    description: 'fg-muted',
  }),
  ...family('components-page-toolbar', {
    bg: 'surface',
    border: 'line-subtle',
    text: 'fg-muted',
  }),
  ...family('components-page-state', {
    'icon-bg': 'fill-muted',
    icon: 'fg-subtle',
    title: 'fg',
    description: 'fg-muted',
  }),
  ...family('components-settings-rail', {
    bg: 'surface',
    border: 'line-subtle',
    title: 'fg',
  }),
  'components-settings-content-bg': 'surface',
  ...family('components-console', {
    bg: 'surface',
    surface: 'surface',
    border: 'line',
  }),
  ...family('components-workspace', {
    bg: 'surface',
    surface: 'surface',
    border: 'line',
  }),
  ...family('components-studio', {
    bg: 'canvas',
    surface: 'surface',
    border: 'line',
  }),
  ...family('components-split-pane', { bg: 'canvas', border: 'line' }),
  ...family('components-system', {
    'accent-bg': 'accent-soft',
    'accent-border': 'accent-line',
    'accent-text': 'accent-fg',
    'accent-soft': 'accent-soft',
    'page-bg': 'canvas',
    'panel-bg': 'surface',
    'panel-border': 'line',
    'header-title': 'fg',
    'header-description': 'fg-muted',
    'version-tag-bg': 'fill-muted',
    'version-tag-border': 'line',
    'version-tag-label': 'fg-muted',
    'version-tag-value': 'fg-muted',
    'section-title': 'fg-muted',
    'section-divider': 'line-subtle',
    'empty-bg': 'canvas',
    'empty-border': 'line',
    'status-card-bg': 'raised',
    'status-card-border': 'line',
    'status-card-border-hover': 'line-strong',
    'chart-grid': 'viz-grid',
    'chart-axis': 'fg-muted',
    'chart-tooltip-bg': 'overlay',
    'chart-tooltip-border': 'line',
    'chart-tooltip-text': 'fg',
    'chart-tooltip-muted': 'fg-subtle',
    'chart-lag': 'run-queued',
    'chart-info-pill-bg': 'fill-muted',
    'chart-info-pill-text': 'fg-muted',
    'chart-done': 'success-fg',
    'chart-done-soft': 'success-soft',
    'chart-failed': 'danger-fg',
    'chart-failed-soft': 'danger-soft',
    'chart-pending': 'warning-fg',
    'chart-pending-soft': 'warning-soft',
  }),
  ...family('components-system-health-ok', tinted('success')),
  ...family('components-system-health-warning', tinted('warning')),
  ...family('components-system-health-error', tinted('danger')),
  ...family('components-system-status-ok', tinted('success')),
  ...family('components-system-status-warning', tinted('warning')),
  ...family('components-system-status-error', tinted('danger')),
} as const satisfies Record<string, Target>

export type LegacyToken = keyof typeof LEGACY_TOKENS
