/**
 * Box-shadow elevation per theme, emitted as `--elevation-*` next to the color
 * tokens and exposed to Tailwind as `shadow-elevation-*`. Dark surfaces need
 * deeper, denser shadows for the same perceived lift.
 */
export const elevation = {
  light: {
    low: '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
    high: '0 10px 20px rgba(0, 0, 0, 0.12), 0 6px 10px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    low: '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.25)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
    high: '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 10px rgba(0, 0, 0, 0.4)',
  },
} as const
