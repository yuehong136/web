/**
 * Turns a `SettingSection` into a settings card: a hairline-bordered surface
 * whose rows keep their dividers but drop the one above the first row.
 */
export const SETTINGS_CARD =
  'rounded-radius-xl border border-border-subtle bg-components-card-bg px-space-md pt-space-sm pb-space-2xs [&>div:last-child>[data-slot=setting-row]:first-child]:border-t-0 [&>div:last-child>ul:first-child>li:first-child>[data-slot=setting-row]]:border-t-0'
