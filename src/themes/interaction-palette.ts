/** Interaction colors: selection/focus is green ↔ violet; actions are black ↔ blue. */
export const interactionPalette = {
  light: {
    selection: '#00857e',
    selectionText: '#026f6a',
    focus: '#00857e',
    selectionTint: 'rgba(0, 133, 126, 0.1)',
    selectionSoft: 'rgba(0, 133, 126, 0.06)',
    action: '#18181b',
    actionHover: '#27272a',
    actionActive: '#09090b',
  },
  dark: {
    selection: '#8452f4',
    selectionText: '#c4b5fd',
    focus: '#a78bfa',
    selectionTint: 'rgba(132, 82, 244, 0.18)',
    selectionSoft: 'rgba(132, 82, 244, 0.1)',
    action: '#2563eb',
    actionHover: '#1d4ed8',
    actionActive: '#1e40af',
  },
} as const

/** RGB channels for Tailwind opacity utilities, derived from canonical tokens. */
export function rgbChannels(hex: string): string {
  if (!/^#[\da-f]{6}$/i.test(hex)) {
    throw new Error(`Expected an opaque hex color for theme channels: ${hex}`)
  }
  return [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16))
    .join(' ')
}
