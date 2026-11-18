/**
 * Tailwind color names: every token, plus the shadcn-style aliases that
 * vendored components expect, each pointing at a semantic role. Opacity
 * modifiers (`bg-primary/90`) compile to `color-mix()`, so no RGB channel
 * variables are needed.
 */
import { cssVariables } from './tokens'

const role = (name: string) => `var(--color-${name})`

export const tailwindColors = {
  ...cssVariables,
  background: role('surface'),
  foreground: role('fg'),
  card: role('raised'),
  'card-foreground': role('fg'),
  popover: role('overlay'),
  'popover-foreground': role('fg'),
  primary: role('action-bg'),
  'primary-foreground': role('action-fg'),
  secondary: role('fill-muted'),
  'secondary-foreground': role('fg'),
  muted: role('sunken'),
  'muted-foreground': role('fg-muted'),
  border: role('line'),
  input: role('line'),
  ring: role('line-focus'),
}
