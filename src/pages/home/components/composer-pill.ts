/**
 * Toolbar pills on the Home and Explore composers. Plain buttons rather than
 * `Button`, so the pill shape and outline don't fight the base button classes
 * (token classes are not merged by tailwind-merge).
 */
export const COMPOSER_PILL =
  'inline-flex h-[var(--control-height-sm)] min-w-[var(--control-height-sm)] shrink-0 items-center justify-center gap-space-xs rounded-radius-full border text-xs whitespace-nowrap outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-state-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none [&_svg]:size-icon-sm [&_svg]:shrink-0'

/** A pill that is off (or a plain action). */
export const COMPOSER_PILL_IDLE =
  'border-border-default text-text-secondary enabled:hover:bg-state-hover enabled:hover:text-text-primary'

/** A toggled-on pill, or the action whose panel is open. */
export const COMPOSER_PILL_ON =
  'border-state-selected bg-state-selected-bg text-state-selected-text'
