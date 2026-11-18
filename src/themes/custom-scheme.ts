/**
 * The brand scheme. It is generated in the browser from the user's seed by the
 * same generator as the built-in schemes and installed as a constructable
 * stylesheet, which strict CSP allows (no inline style element or attribute).
 * The CSS is cached so `public/theme-init.js` can install it before first paint.
 */
import { customSchemeSeed, type CustomSchemeSeed } from './color-schemes'
import type { Mode } from './color-scales'
import { generateSchemeCSS } from './theme-css-generator'
import { MODES, resolveTokens, seedTokens } from './theme-sets'
import type { DesignTokens } from './tokens'

export const CUSTOM_SCHEME = 'custom'
/** Read by public/theme-init.js; keep the two in step. */
export const CUSTOM_CSS_STORAGE_KEY = 'appearance-custom-css'

declare global {
  interface Window {
    /** Shared with the pre-paint bootstrap so the sheet is installed once. */
    __appearanceCustomSheet?: CSSStyleSheet
  }
}

const seedKey = (seed: CustomSchemeSeed) =>
  `${seed.accentHue}/${seed.accentChroma}/${seed.neutralChroma}`

export function customSchemeCSS(seed: CustomSchemeSeed): string {
  const scheme = customSchemeSeed(seed)
  return MODES.map((mode) =>
    generateSchemeCSS(CUSTOM_SCHEME, scheme, mode),
  ).join('\n')
}

const values = new Map<string, Record<Mode, DesignTokens>>()

/** Resolved values for canvas and chart consumers of the brand scheme. */
export function customTokenValues(
  seed: CustomSchemeSeed,
): Record<Mode, DesignTokens> {
  const key = seedKey(seed)
  let entry = values.get(key)
  if (!entry) {
    const scheme = customSchemeSeed(seed)
    entry = {
      light: resolveTokens(seedTokens(scheme, 'light')),
      dark: resolveTokens(seedTokens(scheme, 'dark')),
    }
    values.set(key, entry)
  }
  return entry
}

let installed: string | undefined

/** Installs (or replaces) the brand scheme's CSS; a no-op where unsupported. */
export function installCustomScheme(seed: CustomSchemeSeed): void {
  if (
    typeof document === 'undefined' ||
    typeof CSSStyleSheet === 'undefined' ||
    !('adoptedStyleSheets' in document) ||
    !('replaceSync' in CSSStyleSheet.prototype)
  )
    return
  const key = seedKey(seed)
  if (installed === key) return
  const css = customSchemeCSS(seed)
  let sheet = window.__appearanceCustomSheet
  if (!sheet) {
    sheet = new CSSStyleSheet()
    window.__appearanceCustomSheet = sheet
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  }
  sheet.replaceSync(css)
  installed = key
  try {
    localStorage.setItem(CUSTOM_CSS_STORAGE_KEY, css)
  } catch {
    /* The scheme still applies; only the pre-paint cache is skipped. */
  }
}
