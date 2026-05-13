import zhCN from './zh-CN'
import enUS from './en-US'

export const localeRegistry = {
  'zh-CN': {
    label: 'Simplified Chinese',
    nativeLabel: '简体中文',
    resource: zhCN,
    matches: (value: string) =>
      value === 'zh' || value === 'zh-cn' || value.startsWith('zh-hans'),
  },
  'en-US': {
    label: 'English',
    nativeLabel: 'English',
    resource: enUS,
    matches: (value: string) =>
      value === 'en' || value === 'en-us' || value.startsWith('en-'),
  },
} as const

export type ProductLocale = keyof typeof localeRegistry

export interface SupportedLocale {
  code: ProductLocale
  label: string
  nativeLabel: string
}

export const DEFAULT_PRODUCT_LANGUAGE = 'zh-CN' satisfies ProductLocale

export const localeCodes = Object.keys(localeRegistry) as ProductLocale[]

export const supportedLocales: SupportedLocale[] = localeCodes.map((code) => ({
  code,
  label: localeRegistry[code].label,
  nativeLabel: localeRegistry[code].nativeLabel,
}))

export const normalizeLocale = (value: unknown): ProductLocale | undefined => {
  if (typeof value !== 'string') return undefined

  const normalized = value.trim().replace('_', '-').toLowerCase()
  if (!normalized) return undefined

  return localeCodes.find((code) => {
    const entry = localeRegistry[code]
    return normalized === code.toLowerCase() || entry.matches(normalized)
  })
}

export const createI18nResources = () =>
  Object.fromEntries(
    localeCodes.map((code) => [
      code,
      {
        translation: localeRegistry[code].resource,
      },
    ]),
  )

export const loadLocaleResource = async (locale: ProductLocale) =>
  localeRegistry[locale].resource
