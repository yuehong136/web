/**
 * i18n 国际化配置
 *
 * 安装依赖：
 * npm install i18next react-i18next i18next-browser-languagedetector
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {
  createI18nResources,
  DEFAULT_PRODUCT_LANGUAGE,
  loadLocaleResource,
  normalizeLocale,
  type ProductLocale,
} from './locale-registry'

export {
  DEFAULT_PRODUCT_LANGUAGE,
  localeCodes,
  normalizeLocale,
  supportedLocales,
  type ProductLocale,
  type SupportedLocale,
} from './locale-registry'

export const PRODUCT_LANGUAGE_STORAGE_KEY = 'i18n_language'

let routeLocaleOverride: ProductLocale | undefined

const getStoredProductLanguage = (): ProductLocale | undefined => {
  if (typeof window === 'undefined') return undefined

  const stored = normalizeLocale(
    window.localStorage.getItem(PRODUCT_LANGUAGE_STORAGE_KEY),
  )
  if (stored) return stored

  try {
    const uiStorage = JSON.parse(
      window.localStorage.getItem('ui-storage') || '{}',
    )
    return normalizeLocale(uiStorage?.state?.language)
  } catch {
    return undefined
  }
}

export const applyDocumentLocale = (lang: ProductLocale) => {
  if (typeof document === 'undefined') return

  document.documentElement.lang = lang
  document.documentElement.dir = i18n.dir(lang)
}

i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    resources: createI18nResources(),
    fallbackLng: DEFAULT_PRODUCT_LANGUAGE, // 默认语言
    debug: import.meta.env.DEV, // 开发环境开启调试

    interpolation: {
      escapeValue: false, // React 已经处理 XSS
    },

    detection: {
      // 语言检测配置
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: PRODUCT_LANGUAGE_STORAGE_KEY,
      convertDetectedLanguage: (language) =>
        normalizeLocale(language) ?? DEFAULT_PRODUCT_LANGUAGE,
    },
  })

i18n.on('languageChanged', (lang) => {
  applyDocumentLocale(normalizeLocale(lang) ?? DEFAULT_PRODUCT_LANGUAGE)
})

export default i18n

/**
 * 确保目标语言资源已加载。当前中英资源仍随主包加载；这个入口为后续
 * 切换到动态 import / i18next backend 时保留调用面。
 */
export const ensureLocaleLoaded = async (lang: ProductLocale) => {
  if (!i18n.hasResourceBundle(lang, 'translation')) {
    const resource = await loadLocaleResource(lang)
    i18n.addResourceBundle(lang, 'translation', resource, true, true)
  }
  return lang
}

const applyLanguage = async (lang: ProductLocale) => {
  await ensureLocaleLoaded(lang)
  await i18n.changeLanguage(lang)
  applyDocumentLocale(lang)
  return lang
}

/**
 * 切换产品语言，并持久化为本机偏好。
 */
export const setProductLanguage = async (lang: ProductLocale) => {
  const nextLanguage = normalizeLocale(lang) ?? DEFAULT_PRODUCT_LANGUAGE
  routeLocaleOverride = undefined
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRODUCT_LANGUAGE_STORAGE_KEY, nextLanguage)
  }
  return applyLanguage(nextLanguage)
}

/**
 * 临时应用路由级语言，例如 share/widget/embed，不覆盖本机产品语言偏好。
 */
export const applyRouteLocale = (lang: unknown) => {
  const nextLanguage = normalizeLocale(lang)
  if (!nextLanguage) return undefined

  routeLocaleOverride = nextLanguage
  void applyLanguage(nextLanguage)
  return nextLanguage
}

/**
 * 获取当前语言
 */
export const getCurrentLanguage = (): ProductLocale => {
  return (
    routeLocaleOverride ??
    getStoredProductLanguage() ??
    normalizeLocale(i18n.resolvedLanguage) ??
    normalizeLocale(i18n.language) ??
    DEFAULT_PRODUCT_LANGUAGE
  )
}

/**
 * 保持旧调用面，语义等同于产品语言切换。
 */
export const changeLanguage = setProductLanguage
