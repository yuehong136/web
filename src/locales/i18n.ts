import i18next, { use as installPlugin, dir } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {
  DEFAULT_PRODUCT_LANGUAGE,
  normalizeLocale,
  type LocaleNamespace,
  type ProductLocale,
} from './locale-registry'
import { createLocaleRuntime } from './locale-runtime'
import { namespacesForPath } from './route-locales'

export {
  DEFAULT_PRODUCT_LANGUAGE,
  localeCodes,
  namespaceCodes,
  normalizeLocale,
  supportedLocales,
  type LocaleNamespace,
  type ProductLocale,
  type SupportedLocale,
} from './locale-registry'
export { namespacesForPath } from './route-locales'
export const PRODUCT_LANGUAGE_STORAGE_KEY = 'i18n_language'

const getStoredProductLanguage = (): ProductLocale | undefined => {
  try {
    if (typeof window === 'undefined') return undefined
    const stored = normalizeLocale(
      window.localStorage.getItem(PRODUCT_LANGUAGE_STORAGE_KEY),
    )
    if (stored) return stored
    const legacy = JSON.parse(window.localStorage.getItem('ui-storage') || '{}')
    return normalizeLocale(legacy?.state?.language)
  } catch {
    return undefined
  }
}

void installPlugin(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    lng: getStoredProductLanguage(),
    fallbackLng: DEFAULT_PRODUCT_LANGUAGE,
    defaultNS: 'translation',
    ns: ['translation'],
    initImmediate: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: [],
      lookupLocalStorage: PRODUCT_LANGUAGE_STORAGE_KEY,
      convertDetectedLanguage: (language) =>
        normalizeLocale(language) ?? DEFAULT_PRODUCT_LANGUAGE,
    },
  })

export const applyDocumentLocale = (locale: ProductLocale) => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = dir(locale)
}

export const productLocaleRuntime = createLocaleRuntime({
  instance: i18next,
  initialLocale: normalizeLocale(i18next.language) ?? DEFAULT_PRODUCT_LANGUAGE,
  applyDocument: applyDocumentLocale,
  persist: (locale) => {
    if (typeof window !== 'undefined')
      window.localStorage.setItem(PRODUCT_LANGUAGE_STORAGE_KEY, locale)
  },
})

export const getProductLanguage = () =>
  productLocaleRuntime.getSnapshot().productLocale
export const getCurrentLanguage = () =>
  productLocaleRuntime.getSnapshot().effectiveLocale
export const subscribeProductLanguage =
  productLocaleRuntime.subscribeProductLanguage
export const setProductLanguage = productLocaleRuntime.setProductLanguage
export const changeLanguage = setProductLanguage
export const applyRouteLocale = productLocaleRuntime.applyRouteLocale
export const clearRouteLocale = productLocaleRuntime.clearRouteLocale
export const createRouteLocaleScope = productLocaleRuntime.createRouteScope
export const ensureLocaleLoaded = (
  locale: ProductLocale,
  namespaces?: readonly LocaleNamespace[],
) => productLocaleRuntime.ensureNamespaces(locale, namespaces)
export const ensureRouteNamespaces = (pathname: string) =>
  ensureLocaleLoaded(getCurrentLanguage(), namespacesForPath(pathname))
export const i18nReady = ensureLocaleLoaded(getCurrentLanguage()).then(
  (locale) => {
    applyDocumentLocale(getCurrentLanguage())
    return locale
  },
)

export default i18next
