import { describe, expect, it } from 'vitest'
import { createInstance } from 'i18next'
import { createLocaleRuntime } from '../locale-runtime'
import { createIsolatedLocaleRuntime } from '../isolated-locale'
import {
  loadLocaleResource,
  namespaceCodes,
  loadLocaleNamespace,
} from '../locale-registry'
import { koreanTranslationStatus } from '../ko-KR/status'

const flatten = (
  value: unknown,
  prefix = '',
  out: Record<string, string> = {},
) => {
  if (typeof value === 'string') out[prefix] = value
  else if (value && typeof value === 'object')
    Object.entries(value).forEach(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key, out),
    )
  return out
}
const placeholders = (value: string) =>
  [...value.matchAll(/{{\s*([^}]+)\s*}}/g)]
    .map((match) => match[1].trim())
    .sort()

describe('Korean preview catalog', () => {
  it('covers every current namespace and key with explicit English fallback, preserving placeholders', async () => {
    expect(Object.keys(koreanTranslationStatus).sort()).toEqual(
      [...namespaceCodes].sort(),
    )
    for (const ns of namespaceCodes) {
      const english = flatten(await loadLocaleNamespace('en-US', ns))
      const korean = flatten(await loadLocaleNamespace('ko-KR', ns))
      expect(Object.keys(korean).sort()).toEqual(Object.keys(english).sort())
      for (const key of Object.keys(english))
        expect(placeholders(korean[key]), key).toEqual(
          placeholders(english[key]),
        )
      expect(
        Object.values(korean).filter((value) => /[가-힣]/.test(value)).length,
      ).toBe(koreanTranslationStatus[ns].translated)
    }
  })
  it('loads only the requested domain and localizes the settings and navigation surfaces', async () => {
    const settings = await loadLocaleResource('ko-KR', ['settings'])
    expect(Object.keys(settings)).toEqual(['settings'])
    expect(settings).toHaveProperty('settings.profile.displayName', '표시 이름')
    expect(settings).toHaveProperty(
      'settings.profile.validation.nameMaxLength',
      '이름은 최대 100자까지 입력할 수 있습니다.',
    )
  })
  it('keeps Korean route/widget languages isolated from the product preference', async () => {
    const instance = createInstance()
    await instance.init({
      resources: {},
      lng: 'en-US',
      fallbackLng: false,
      initImmediate: false,
    })
    const persisted: string[] = []
    const runtime = createLocaleRuntime({
      instance,
      initialLocale: 'en-US',
      persist: (locale) => persisted.push(locale),
    })
    await runtime.ensureNamespaces('en-US', ['settings'])
    const route = runtime.createRouteScope()
    await route.set('ko')
    expect(instance.t('settings.profile.displayName')).toBe('표시 이름')
    expect(runtime.getSnapshot().productLocale).toBe('en-US')
    expect(persisted).toEqual([])
    const widget = createIsolatedLocaleRuntime('ko-KR')
    await widget.ensureNamespaces('ko-KR', ['settings'])
    expect(widget.instance.t('settings.profile.displayName')).toBe('표시 이름')
    await route.dispose()
    expect(instance.t('settings.profile.displayName')).toBe('Display name')
    expect(widget.getSnapshot().effectiveLocale).toBe('ko-KR')
  })
})
