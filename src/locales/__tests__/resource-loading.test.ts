import { describe, expect, it } from 'vitest'
import { createInstance } from 'i18next'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { navItems } from '@/components/layout/sidebar-config'
import { useDefaultSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { EmbeddingModelSelector } from '@/components/knowledge/EmbeddingModelSelector'
import { namespacesForPath } from '../route-locales'
import {
  createI18nResources,
  loadLocaleNamespace,
  loadLocaleResource,
  localeCodes,
  namespaceCodes,
  normalizeLocale,
  type ProductLocale,
} from '../locale-registry'

const NavigationLabels = () => {
  const navigation = useDefaultSecondaryNavigation()
  return createElement(
    'nav',
    null,
    Object.values(navigation)
      .flatMap((section) => [
        section.title,
        ...section.groups.flatMap((group) =>
          group.items.map((item) => item.title),
        ),
      ])
      .join(' · '),
  )
}

const renderCold = async (
  locale: ProductLocale,
  path: string,
  view: ReactNode,
) => {
  const instance = createInstance()
  await instance.init({
    lng: locale,
    fallbackLng: false,
    saveMissing: true,
    resources: {
      [locale]: {
        translation: await loadLocaleResource(locale, namespacesForPath(path)),
      },
    },
  })
  const missing: string[] = []
  instance.on('missingKey', (_locales, _namespace, key) => missing.push(key))
  const html = renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n: instance },
      createElement(MemoryRouter, { initialEntries: [path] }, view),
    ),
  )
  expect(missing, `${locale}${path}`).toEqual([])
  return { instance, html }
}

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
    expect(normalizeLocale(' KO_kr ')).toBe('ko-KR')
    expect(normalizeLocale('ko')).toBe('ko-KR')
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
        locale !== 'zh-CN'
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

  it('resolves every global navigation label on a cold route load', async () => {
    for (const locale of localeCodes) {
      for (const path of [
        ...navItems.map((item) => item.href),
        '/agent/fixture',
        '/settings',
        '/mcp-chat',
      ]) {
        const { instance } = await renderCold(
          locale,
          path,
          createElement(NavigationLabels),
        )
        for (const item of navItems) {
          expect(
            instance.exists(item.titleKey),
            `${locale}${path}: ${item.titleKey}`,
          ).toBe(true)
        }
      }
    }
  })

  it('renders shared model selectors with only the consuming route resources', async () => {
    for (const locale of localeCodes) {
      for (const path of [
        '/home',
        '/explore',
        '/search/fixture',
        '/studio/create-app',
        '/tools/auto-fill',
        '/mcp-chat',
      ]) {
        await renderCold(
          locale,
          path,
          createElement(ChatModelSelector, {
            models: {},
            selectedModelName: null,
            onSelect: () => undefined,
          }),
        )
      }
      for (const path of [
        '/knowledge',
        '/memory',
        '/memory/fixture/settings',
      ]) {
        await renderCold(
          locale,
          path,
          createElement(EmbeddingModelSelector, {
            modelProviders: {},
            selectedModelId: null,
            onSelect: () => undefined,
          }),
        )
      }
    }
  })
})
