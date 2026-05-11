import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EmbedLocaleValue, EmbedThemeValue } from './protocol'

/**
 * Buttons that may appear in the embed toolbar. Driven by the URL `show` CSV
 * whitelist. `share` is intentionally excluded from this type — embedded
 * surfaces must not generate further embedding links.
 */
export type EmbedShowKey =
  | 'save'
  | 'run'
  | 'nav'
  | 'publish'
  | 'webhook'
  | 'settings'
  | 'variables'

const SHOW_KEYS: ReadonlySet<EmbedShowKey> = new Set([
  'save',
  'run',
  'nav',
  'publish',
  'webhook',
  'settings',
  'variables',
])

const DEFAULT_SHOW: ReadonlySet<EmbedShowKey> = new Set(['save'])

export interface EmbedAccess {
  parentOrigin: string
  show: ReadonlySet<EmbedShowKey>
  theme: EmbedThemeValue | undefined
  locale: EmbedLocaleValue | undefined
  hideRail: boolean
}

export interface EmbedAccessResult {
  access: EmbedAccess | null
  error: string | null
}

const ORIGIN_PATTERN = /^https?:\/\/[^/\s]+$/i

export function isValidOrigin(value: string): boolean {
  if (!value) return false
  if (!ORIGIN_PATTERN.test(value)) return false
  try {
    const parsed = new URL(value)
    // Reject anything with a path / query / hash — origin must be just scheme + host (+ port).
    return parsed.origin === value
  } catch {
    return false
  }
}

function parseShow(raw: string | null): ReadonlySet<EmbedShowKey> {
  if (!raw) return DEFAULT_SHOW
  const result = new Set<EmbedShowKey>()
  for (const token of raw.split(',')) {
    const trimmed = token.trim()
    if (SHOW_KEYS.has(trimmed as EmbedShowKey)) {
      result.add(trimmed as EmbedShowKey)
    }
  }
  // Always keep save visible — without it the user has no way to commit edits.
  result.add('save')
  return result
}

function parseTheme(raw: string | null): EmbedThemeValue | undefined {
  return raw === 'light' || raw === 'dark' ? raw : undefined
}

function parseLocale(raw: string | null): EmbedLocaleValue | undefined {
  return raw === 'zh-CN' || raw === 'en-US' ? raw : undefined
}

function parseFlag(raw: string | null): boolean {
  if (!raw) return false
  const v = raw.toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

/**
 * Decode the URL parameters that govern the embed shell. Pure function so it
 * can be unit-tested without React. The hook below wraps this for routes.
 */
export function parseEmbedAccess(
  searchParams: URLSearchParams,
): EmbedAccessResult {
  const parentOrigin = (searchParams.get('parent_origin') || '').trim()
  if (!parentOrigin) {
    return {
      access: null,
      error: 'Missing required URL parameter `parent_origin`.',
    }
  }
  if (!isValidOrigin(parentOrigin)) {
    return {
      access: null,
      error:
        '`parent_origin` is not a valid origin (expected scheme://host[:port], no path).',
    }
  }

  return {
    access: {
      parentOrigin,
      show: parseShow(searchParams.get('show')),
      theme: parseTheme(searchParams.get('theme')),
      locale: parseLocale(searchParams.get('locale')),
      hideRail: parseFlag(searchParams.get('hide_rail')),
    },
    error: null,
  }
}

export function useEmbedAccess(): EmbedAccessResult {
  const [searchParams] = useSearchParams()
  return useMemo(() => parseEmbedAccess(searchParams), [searchParams])
}
