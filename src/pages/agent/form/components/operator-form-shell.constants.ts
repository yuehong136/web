export const OperatorFormTone = {
  DEFAULT: 'default',
  MUTED: 'muted',
  ACCENT: 'accent',
  CONTRAST: 'contrast',
} as const

export type OperatorFormToneValue =
  (typeof OperatorFormTone)[keyof typeof OperatorFormTone]
