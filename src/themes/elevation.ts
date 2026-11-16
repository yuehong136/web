/**
 * Box-shadow elevation per theme, emitted as `--elevation-*` next to the color
 * tokens and exposed to Tailwind as `shadow-elevation-*`. The three levels
 * follow the DreamJira shadows:
 *
 * - low: cards and raised surfaces (`shadow-card`)
 * - medium: menus, popovers, tooltips and selects (`shadow-overlay`)
 * - high: dialogs, sheets and the command palette (`shadow-raised`)
 *
 * Dark surfaces need denser shadows, and overlays add a faint light ring so
 * they separate from a dark page the way a border would.
 */
export const elevation = {
  light: {
    low: '0 1px 3px rgba(20, 22, 40, 0.04)',
    medium:
      '0 12px 40px rgba(20, 22, 40, 0.12), 0 0 0 1px rgba(20, 22, 40, 0.05)',
    high: '0 24px 80px rgba(20, 22, 40, 0.18)',
  },
  dark: {
    low: '0 1px 3px rgba(0, 0, 0, 0.12)',
    medium:
      '0 12px 40px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    high: '0 24px 80px rgba(0, 0, 0, 0.4)',
  },
} as const
