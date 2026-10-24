import { describe, expect, it } from 'vitest'
import {
  createI18nResources,
  loadLocaleNamespace,
  loadLocaleResource,
  localeCodes,
  namespaceCodes,
  normalizeLocale,
} from '../locale-registry'

const flatten = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('lazy locale resource registry', () => {
  it('normalizes supported variants before they reach i18next', () => {
    expect(normalizeLocale(' en_GB ')).toBe('en-US')
    expect(normalizeLocale('zh-Hans-CN')).toBe('zh-CN')
    expect(normalizeLocale('zh_CN')).toBe('zh-CN')
    expect(normalizeLocale('fr-FR')).toBeUndefined()
    expect(normalizeLocale(null)).toBeUndefined()
  })

  it('loads each registered language and domain including named exports', async () => {
    for (const locale of localeCodes) {
      for (const domain of namespaceCodes) {
        const resource = await loadLocaleNamespace(locale, domain)
        expect(resource, `${locale}/${domain}`).toBeTypeOf('object')
        expect(Object.keys(resource).length).toBeGreaterThan(0)
      }
    }
    expect(await loadLocaleNamespace('en-US', 'appearance')).toHaveProperty(
      'appearance',
    )
    expect(await loadLocaleNamespace('en-US', 'common')).toHaveProperty('modal')
  })

  it('matches the explicit compatibility catalog while allowing a single-domain resource request', async () => {
    const complete = await createI18nResources()
    for (const locale of localeCodes) {
      const legacy =
        locale === 'en-US'
          ? (await import('../en-US')).default
          : (await import('../zh-CN')).default
      expect(flatten(complete[locale].translation).sort()).toEqual(
        flatten(legacy).sort(),
      )
    }
    expect(Object.keys(await loadLocaleResource('en-US', ['home']))).toEqual([
      'home',
    ])
  })
})
